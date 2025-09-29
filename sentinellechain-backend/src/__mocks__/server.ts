import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { PrismaClient } from '@prisma/client';
import { Server } from 'http';

// Mock the Prisma client instance using jest-mock-extended
export const prisma = mockDeep<PrismaClient>();

// Mock the server instance (if needed by other tests)
export const server = {} as Server;