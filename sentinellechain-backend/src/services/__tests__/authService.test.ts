import * as authService from '../authService';
import { prisma } from '../../server'; // This will be the mock from __mocks__/server.ts
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import * as auditService from '../auditService'; // To mock recordAuditEvent
import { DeepMockProxy } from 'jest-mock-extended';
import { PrismaClient, User, Company } from '@prisma/client'; // Import actual types

// Mock external dependencies
jest.mock('bcryptjs');
jest.mock('jsonwebtoken');
jest.mock('../auditService'); // Mock the entire auditService

// Use DeepMockProxy for Prisma
type MockedPrismaClient = DeepMockProxy<PrismaClient>;

describe('AuthService', () => {
  let mockPrisma: MockedPrismaClient;
  let mockedBcrypt: jest.Mocked<typeof bcrypt>;
  let mockedJwt: jest.Mocked<typeof jwt>;
  let mockedAuditService: jest.Mocked<typeof auditService>;

  beforeEach(() => {
    jest.clearAllMocks(); // Clear all mocks

    // Re-assign mocks for type safety
    mockPrisma = prisma as unknown as MockedPrismaClient; // prisma from our mock file
    mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;
    mockedJwt = jwt as jest.Mocked<typeof jwt>;
    mockedAuditService = auditService as jest.Mocked<typeof auditService>;

    // Default mock implementations
    mockedAuditService.recordAuditEvent.mockResolvedValue(undefined);
    // Ensure JWT sign returns a string
    (mockedJwt.sign as jest.Mock).mockReturnValue('testToken');
  });

  describe('register', () => {
    const email = 'test@example.com';
    const password = 'password123';
    const companyName = 'Test Company';

    it('should register a new user and company successfully', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockedBcrypt.hash.mockResolvedValue('hashedPassword' as never);

      const companyMock = { id: 'companyId', name: companyName, apiKey: 'apiKey', createdAt: new Date(), updatedAt: new Date() } as Company;
      mockPrisma.company.create.mockResolvedValue(companyMock);

      const userMock = {
        id: 'userId', email, password: 'hashedPassword', role: 'USER', companyId: 'companyId',
        createdAt: new Date(), updatedAt: new Date()
      } as User;
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
      expect(result).toEqual(expect.objectContaining({
        id: 'userId',
        email,
        companyId: 'companyId'
      }));
      expect(mockedAuditService.recordAuditEvent).toHaveBeenCalledWith(expect.objectContaining({
        action: auditService.AUDIT_ACTIONS.USER_REGISTER,
        companyId: 'companyId',
        userId: 'userId',
      }));
    });

    it('should throw an error if user already exists', async () => {
      const existingUserMock = { id: 'existingUserId', email, password: 'hashedPassword', role: 'USER', companyId: 'companyId', createdAt: new Date(), updatedAt: new Date() } as User;
      mockPrisma.user.findUnique.mockResolvedValue(existingUserMock);

      await expect(authService.register(email, password, companyName)).rejects.toThrow('User with this email already exists.');
      expect(mockedBcrypt.hash).not.toHaveBeenCalled();
      expect(mockPrisma.company.create).not.toHaveBeenCalled();
      expect(mockPrisma.user.create).not.toHaveBeenCalled();
      expect(mockedAuditService.recordAuditEvent).not.toHaveBeenCalled();
    });

    it('should throw an error if company creation fails', async () => {
        mockPrisma.user.findUnique.mockResolvedValue(null);
        mockedBcrypt.hash.mockResolvedValue('hashedPassword' as never);
        mockPrisma.company.create.mockRejectedValue(new Error('Company creation failed'));

        await expect(authService.register(email, password, companyName)).rejects.toThrow('Company creation failed');
        expect(mockPrisma.user.create).not.toHaveBeenCalled();
        expect(mockedAuditService.recordAuditEvent).not.toHaveBeenCalled();
    });

    it('should throw an error if user creation fails after company creation', async () => {
        mockPrisma.user.findUnique.mockResolvedValue(null);
        mockedBcrypt.hash.mockResolvedValue('hashedPassword' as never);
        const companyMock = { id: 'companyId', name: companyName, apiKey: 'apiKey', createdAt: new Date(), updatedAt: new Date() } as Company;
        mockPrisma.company.create.mockResolvedValue(companyMock);
        mockPrisma.user.create.mockRejectedValue(new Error('User creation failed'));

        await expect(authService.register(email, password, companyName)).rejects.toThrow('User creation failed');
        expect(mockedAuditService.recordAuditEvent).not.toHaveBeenCalledWith(expect.objectContaining({ action: auditService.AUDIT_ACTIONS.USER_REGISTER }));
    });
  });

  describe('login', () => {
    const email = 'test@example.com';
    const password = 'password123';
    const companyData = { id: 'companyId', name: 'Test Company', apiKey: 'apiKey', createdAt: new Date(), updatedAt: new Date() } as Company;
    const userData = {
      id: 'userId',
      email,
      password: 'hashedPassword',
      role: 'USER',
      companyId: 'companyId',
      company: companyData,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as User & { company: Company }; // Ensure company is part of the type for the mock

    it('should login successfully and return token and user data', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(userData);
      mockedBcrypt.compare.mockResolvedValue(true as never);
      // mockedJwt.sign already set up in beforeEach to return 'testToken'

      const result = await authService.login(email, password);

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email },
        include: { company: true },
      });
      expect(mockedBcrypt.compare).toHaveBeenCalledWith(password, userData.password);
      expect(mockedJwt.sign).toHaveBeenCalledWith(
        { userId: userData.id, companyId: userData.companyId, role: userData.role, companyName: userData.company.name },
        process.env.JWT_SECRET, // Make sure JWT_SECRET is in your .env for tests or mock process.env
        { expiresIn: '1h' }
      );
      expect(result.token).toBe('testToken');
      expect(result.user).toEqual(expect.objectContaining({
        id: userData.id,
        email: userData.email,
        companyId: userData.companyId,
        companyName: userData.company.name,
      }));
       expect(mockedAuditService.recordAuditEvent).toHaveBeenCalledWith(expect.objectContaining({
        action: auditService.AUDIT_ACTIONS.USER_LOGIN,
        userId: userData.id,
        companyId: userData.companyId,
      }));
    });

    it('should throw error if user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(authService.login(email, password)).rejects.toThrow('Invalid email or password.');
      expect(mockedBcrypt.compare).not.toHaveBeenCalled();
      expect(mockedJwt.sign).not.toHaveBeenCalledTimes(1); // It's called once in beforeEach, so check it's not called again
      expect(mockedAuditService.recordAuditEvent).not.toHaveBeenCalled();
    });

    it('should throw error if password does not match', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(userData);
      mockedBcrypt.compare.mockResolvedValue(false as never);

      await expect(authService.login(email, password)).rejects.toThrow('Invalid email or password.');
      expect(mockedJwt.sign).not.toHaveBeenCalledTimes(1);
      expect(mockedAuditService.recordAuditEvent).not.toHaveBeenCalled();
    });

    it('should throw error if company data is missing on user object during login', async () => {
      const userWithoutCompany = { ...userData, company: undefined } as unknown as User; // Force type for test
      mockPrisma.user.findUnique.mockResolvedValue(userWithoutCompany);
      mockedBcrypt.compare.mockResolvedValue(true as never);

      await expect(authService.login(email, password)).rejects.toThrow('User company information is missing or invalid.');
      expect(mockedJwt.sign).not.toHaveBeenCalledTimes(1);
      expect(mockedAuditService.recordAuditEvent).not.toHaveBeenCalled();
    });
  });
});
