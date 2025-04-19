import { mockReset } from '../tests/__mocks__/prisma';

beforeEach(() => {
  mockReset();
  jest.clearAllMocks();
});

process.env.JWT_SECRET = 'test-secret-key';
process.env.NODE_ENV = 'test';
