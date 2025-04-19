import { mockPrismaClient } from './prisma';
import express from 'express';

export const prisma = mockPrismaClient;

const app = express();

export default app;
