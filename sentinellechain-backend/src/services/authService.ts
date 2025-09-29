import { PrismaClient, User } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../server'; // Shared Prisma client
import { recordAuditEvent, AUDIT_ACTIONS } from './auditService';

const JWT_SECRET = process.env.JWT_SECRET || 'your-very-secure-and-long-jwt-secret';

if (JWT_SECRET === 'your-very-secure-and-long-jwt-secret' && process.env.NODE_ENV === 'production') {
  console.warn('WARNING: JWT_SECRET is using a default insecure value in a production-like environment. Please set a strong secret in .env.');
}

export async function register(email: string, passwordInput: string, companyName: string): Promise<Omit<User, 'password'>> {
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    throw new Error('User with this email already exists.');
  }

  const hashedPassword = await bcrypt.hash(passwordInput, 10);

  let company = await prisma.company.findUnique({ where: { name: companyName } });
  if (!company) {
    company = await prisma.company.create({ data: { name: companyName } });
  }

  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      companyId: company.id,
      role: companyName === 'SentinelleAdmin' ? 'ADMIN' : 'COMPANY_ADMIN',
    },
  });

  // Record audit event for successful registration
  await recordAuditEvent({
    action: AUDIT_ACTIONS.USER_REGISTER,
    userId: user.id,
    companyId: user.companyId,
    details: { registeredEmail: email },
  });

  const { password, ...userWithoutPassword } = user;
  return userWithoutPassword;
}

export async function login(email: string, passwordInput: string): Promise<{ token: string; user: Omit<User, 'password'> }> {
  const user = await prisma.user.findUnique({
    where: { email },
    include: { company: true },
  });

  if (!user) {
    throw new Error('Invalid email or password.');
  }

  const isPasswordValid = await bcrypt.compare(passwordInput, user.password);
  if (!isPasswordValid) {
    throw new Error('Invalid email or password.');
  }

  // Ensure company information is available before creating the token
  if (!user.company) {
    throw new Error('User company information is missing or invalid.');
  }

  const token = jwt.sign(
    {
      userId: user.id,
      companyId: user.companyId,
      role: user.role,
      companyName: user.company.name,
    },
    JWT_SECRET,
    { expiresIn: '1h' }
  );

  await recordAuditEvent({
    action: AUDIT_ACTIONS.USER_LOGIN,
    userId: user.id,
    companyId: user.companyId,
  });

  const { password, ...userWithoutPassword } = user;
  return { token, user: userWithoutPassword };
}