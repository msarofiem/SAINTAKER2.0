import request from 'supertest';
import http from 'http';
import app from '../app';
import { prisma } from '../app';

const server = http.createServer(app);

jest.mock('../utils/openai', () => ({
  openai: {
    chat: {
      completions: {
        create: jest.fn().mockResolvedValue({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  score: 75,
                  recommendation: "Accept",
                  strengths: ["Clear liability", "Documented injuries"],
                  redFlags: ["Delay in treatment"],
                  explanation: "This is a strong case with clear liability."
                })
              }
            }
          ]
        })
      }
    }
  },
  evaluateIntakePrompt: jest.fn().mockReturnValue('Mock prompt')
}));

describe('POST /api/intake/evaluate/:leadId', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should evaluate lead and return score', async () => {
    prisma.lead.findUnique = jest.fn().mockResolvedValue({
      id: 'lead-id',
      firstName: 'John',
      lastName: 'Doe',
      typeOfAccident: 'Auto',
      dateOfAccident: new Date(),
      injuries: [{ bodyPart: 'Back' }]
    });
    
    prisma.intakeEvaluation.upsert = jest.fn().mockResolvedValue({
      id: 'eval-id',
      leadId: 'lead-id',
      score: 75,
      recommendation: 'Accept',
      strengths: 'Clear liability, Documented injuries',
      redFlags: 'Delay in treatment',
      aiResponse: '{"score":75,"recommendation":"Accept"}'
    });
    
    const res = await request(server).post('/api/intake/evaluate/lead-id')
      .set('Authorization', 'Bearer valid-token');

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.evaluation).toBeDefined();
    expect(res.body.data.evaluation.score).toEqual(75);
    expect(prisma.intakeEvaluation.upsert).toHaveBeenCalledTimes(1);
  });

  it('should return 404 for non-existent lead', async () => {
    prisma.lead.findUnique = jest.fn().mockResolvedValue(null);
    
    const res = await request(server).post('/api/intake/evaluate/non-existent-lead')
      .set('Authorization', 'Bearer valid-token');

    expect(res.statusCode).toEqual(404);
    expect(res.body.success).toBe(false);
  });
});
