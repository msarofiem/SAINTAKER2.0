import request from 'supertest';
import express from 'express';
import { prisma } from './test-utils';
import intakeRoutes from '../api/intake/routes';

const app = express();
app.use(express.json());

app.use((req, res, next) => {
  req.user = { userId: 'test-user-id' };
  next();
});

app.use('/api/intake', intakeRoutes);

jest.mock('../app', () => ({
  prisma
}));

jest.mock('../utils/openai', () => ({
  openai: {
    chat: {
      completions: {
        create: jest.fn().mockResolvedValue({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  recommendedAction: 'File',
                  settleProbability: 30,
                  fileProbability: 60,
                  trialProbability: 10,
                  reasoning: 'Mocked reasoning for testing'
                })
              }
            }
          ]
        })
      }
    }
  },
  litigationScorePrompt: jest.fn().mockReturnValue('mock prompt')
}));

describe('Litigation Score API', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    prisma.lead.findUnique.mockResolvedValue({
      id: 'test-lead-id',
      firstName: 'Test',
      lastName: 'User',
      typeOfAccident: 'Auto',
      dateOfAccident: new Date(),
      status: 'New',
      hasUmUimCoverage: true,
      injuries: [{ bodyPart: 'Back' }],
      address: { zip: '12345' }
    });

    prisma.litigationAssessment.upsert.mockResolvedValue({
      id: 'test-assessment-id',
      recommendedAction: 'File',
      settleProbability: 30,
      fileProbability: 60,
      trialProbability: 10,
      reasoning: 'Mocked reasoning for testing',
      leadId: 'test-lead-id',
      createdAt: new Date(),
      updatedAt: new Date()
    });
  });

  it('should generate a litigation score for a valid lead', async () => {
    const res = await request(app)
      .post('/api/intake/litigation-score/test-lead-id')
      .set('Authorization', 'Bearer mock-token')
      .send({});

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.assessment.recommendedAction).toBe('File');
    expect(prisma.litigationAssessment.upsert).toHaveBeenCalledTimes(1);
  });

  it('should return 404 for non-existent lead', async () => {
    prisma.lead.findUnique.mockResolvedValueOnce(null);

    const res = await request(app)
      .post('/api/intake/litigation-score/non-existent-id')
      .set('Authorization', 'Bearer mock-token')
      .send({});

    expect(res.statusCode).toEqual(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBe('Lead not found');
  });

  it('should handle OpenAI errors gracefully', async () => {
    const openaiMock = require('../utils/openai');
    openaiMock.openai.chat.completions.create.mockRejectedValueOnce(
      new Error('OpenAI error')
    );

    const res = await request(app)
      .post('/api/intake/litigation-score/test-lead-id')
      .set('Authorization', 'Bearer mock-token')
      .send({});

    expect(res.statusCode).toEqual(500);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBe('Failed to generate litigation score');
  });

  it('should handle JSON parsing errors', async () => {
    const openaiMock = require('../utils/openai');
    openaiMock.openai.chat.completions.create.mockResolvedValueOnce({
      choices: [
        {
          message: {
            content: 'Invalid JSON response'
          }
        }
      ]
    });

    const res = await request(app)
      .post('/api/intake/litigation-score/test-lead-id')
      .set('Authorization', 'Bearer mock-token')
      .send({});

    expect(res.statusCode).toEqual(500);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBe('Failed to parse AI assessment');
  });
});
