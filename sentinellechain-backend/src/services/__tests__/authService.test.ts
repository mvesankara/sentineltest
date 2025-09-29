import * as authService from '../authService';
import { prisma } from '../../server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import * as auditService from '../auditService';
import { DeepMockProxy } from 'jest-mock-extended';
import { PrismaClient, User, Company, Prisma } from '@prisma/client';

// Mock required modules
jest.mock('../../server');
jest.mock('bcryptjs');
jest.mock('jsonwebtoken');
jest.mock('../auditService');

type MockedPrismaClient = DeepMockProxy<PrismaClient>;

describe('AuthService', () => {
  let mockPrisma: MockedPrismaClient;
  let mockedBcrypt: jest.Mocked<typeof bcrypt>;
  let mockedJwt: jest.Mocked<typeof jwt>;
  let mockedAuditService: jest.Mocked<typeof auditService>;

  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules() // Most important - it clears the cache
    process.env = {
      ...originalEnv,
      JWT_SECRET: 'test-secret',
    };

    jest.clearAllMocks();

    mockPrisma = prisma as unknown as MockedPrismaClient;
    mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;
    mockedJwt = jwt as jest.Mocked<typeof jwt>;
    mockedAuditService = auditService as jest.Mocked<typeof auditService>;

    mockedAuditService.recordAuditEvent.mockResolvedValue(undefined);
    (mockedJwt.sign as jest.Mock).mockReturnValue('testToken');
  });

  afterEach(() => {
    process.env = originalEnv; // Restore original env
  });

  describe('register', () => {
    const email = 'test@example.com';
    const password = 'password123';
    const companyName = 'Test Company';

    it('should register a new user and company successfully', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      (mockedBcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');

      const companyMock = { id: 'companyId', name: companyName, apiKey: 'apiKey', createdAt: new Date(), updatedAt: new Date() };
      mockPrisma.company.create.mockResolvedValue(companyMock);

      const userMock: User = {
        id: 'userId',
        email,
        password: 'hashedPassword',
        role: 'COMPANY_ADMIN',
        companyId: 'companyId',
        settings: null, // Align with schema
        createdAt: new Date(),
        updatedAt: new Date()
      };
      mockPrisma.user.create.mockResolvedValue(userMock);

      const result = await authService.register(email, password, companyName);

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({ where: { email } });
      expect(mockedBcrypt.hash).toHaveBeenCalledWith(password, 10);
      expect(mockPrisma.company.create).toHaveBeenCalledWith({ data: { name: companyName } });
      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: {
          email,
          password: 'hashedPassword',
          companyId: 'companyId',
          role: 'COMPANY_ADMIN',
        },
      });
      expect(result).toEqual(expect.objectContaining({ id: 'userId', email, companyId: 'companyId' }));
      expect(mockedAuditService.recordAuditEvent).toHaveBeenCalledWith(expect.objectContaining({
        action: auditService.AUDIT_ACTIONS.USER_REGISTER,
        userId: 'userId',
        companyId: 'companyId',
      }));
    });

    it('should throw an error if user already exists', async () => {
      const existingUserMock = { id: 'existingUserId', email } as User;
      mockPrisma.user.findUnique.mockResolvedValue(existingUserMock);

      await expect(authService.register(email, password, companyName)).rejects.toThrow('User with this email already exists.');
      expect(mockedAuditService.recordAuditEvent).not.toHaveBeenCalled();
    });

    it('should throw an error if company creation fails', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      (mockedBcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');
      mockPrisma.company.create.mockRejectedValue(new Error('Company creation failed'));

      await expect(authService.register(email, password, companyName)).rejects.toThrow('Company creation failed');
    });

    it('should throw an error if user creation fails after company creation', async () => {
        mockPrisma.user.findUnique.mockResolvedValue(null);
        (mockedBcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');
        const companyMock = { id: 'companyId', name: companyName } as Company;
        mockPrisma.company.create.mockResolvedValue(companyMock);
        mockPrisma.user.create.mockRejectedValue(new Error('User creation failed'));

        await expect(authService.register(email, password, companyName)).rejects.toThrow('User creation failed');
        expect(mockedAuditService.recordAuditEvent).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    const email = 'test@example.com';
    const password = 'password123';
    const companyData = { id: 'companyId', name: 'Test Company' } as Company;
    const userData = {
      id: 'userId',
      email,
      password: 'hashedPassword',
      role: 'USER',
      companyId: 'companyId',
      settings: null, // Align with schema
      company: companyData,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as User & { company: Company };

    it('should login successfully and return token and user data', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(userData);
      (mockedBcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await authService.login(email, password);

      expect(mockedJwt.sign).toHaveBeenCalledWith(
        {
          userId: userData.id,
          companyId: userData.companyId,
          role: userData.role,
          companyName: userData.company.name,
        },
        expect.any(String), // The secret is loaded at module level, this makes the test resilient
        { expiresIn: '1h' }
      );
      expect(result.token).toBe('testToken');
      expect(mockedAuditService.recordAuditEvent).toHaveBeenCalledWith(expect.objectContaining({
        action: auditService.AUDIT_ACTIONS.USER_LOGIN,
      }));
    });

    it('should throw error if user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      await expect(authService.login(email, password)).rejects.toThrow('Invalid email or password.');
    });

    it('should throw error if password does not match', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(userData);
      (mockedBcrypt.compare as jest.Mock).mockResolvedValue(false);
      await expect(authService.login(email, password)).rejects.toThrow('Invalid email or password.');
    });

    it('should throw error if company data is missing on user object during login', async () => {
      const userWithoutCompany = { ...userData, company: null } as unknown as (User & { company: null });
      mockPrisma.user.findUnique.mockResolvedValue(userWithoutCompany);
      (mockedBcrypt.compare as jest.Mock).mockResolvedValue(true);

      await expect(authService.login(email, password)).rejects.toThrow('User company information is missing or invalid.');
    });
  });
});