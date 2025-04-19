import { mockPrismaClient } from './__mocks__/prisma';

jest.mock('../app', () => {
  const express = require('express');
  const app = express();
  
  app.use(express.json());
  
  app.use((req, res, next) => {
    const oldSend = res.send;
    res.send = function(data) {
      console.log(`${req.method} ${req.path} ${res.statusCode} ${Date.now() - req._startTime}ms - IP: ${req.ip} - User: ${req.user?.userId || 'anonymous'}`);
      return oldSend.apply(res, arguments);
    };
    next();
  });
  
  return {
    __esModule: true,
    default: app,
    prisma: mockPrismaClient
  };
});

export const prisma = mockPrismaClient;

export const setupTestEnv = () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
};
