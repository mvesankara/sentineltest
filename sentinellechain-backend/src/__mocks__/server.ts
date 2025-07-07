// sentinellechain-backend/src/__mocks__/server.ts
import { PrismaClient } from '@prisma/client';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';

// We mock the PrismaClient constructor to return our deep mock.
// jest.mock('@prisma/client', () => ({
//   PrismaClient: jest.fn(() => mockDeep<PrismaClient>()),
// }));
// The above global mock might be too broad or cause issues if PrismaClient is used elsewhere non-mocked.
// Instead, we'll export a mocked instance that our service tests will import from '../server'.

export const prisma: DeepMockProxy<PrismaClient> = mockDeep<PrismaClient>();

// If 'app' was also exported from the actual server.ts and needed for tests:
// import { Express } from 'express';
// export const app: DeepMockProxy<Express> = mockDeep<Express>();
