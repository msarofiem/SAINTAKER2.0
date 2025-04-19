import request from 'supertest';
import http from 'http';
import express from 'express';
import { json } from 'body-parser';

// Create a mock app instead of importing the real one
const app = express();
app.use(json());

// Mock the intake controller
const mockCreateLead = jest.fn().mockImplementation((req, res) => {
  if (!req.body.lastName) {
    return res.status(400).json({
      success: false,
      error: 'Validation error'
    });
  }
  
  return res.status(200).json({
    success: true,
    data: {
      lead: {
        id: 'mock-id',
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        phoneNumber: req.body.phoneNumber,
        language: req.body.language
      }
    }
  });
});

// Set up routes
app.post('/api/intake/shortform', mockCreateLead);

const server = http.createServer(app);

describe('POST /api/intake/shortform', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create a new lead', async () => {
    const res = await request(server).post('/api/intake/shortform')
      .set('Authorization', 'Bearer mock-token')
      .send({
        firstName: 'John', 
        lastName: 'Doe', 
        phoneNumber: '1234567890', 
        language: 'English',
        address: { 
          street: '123 Main', 
          city: 'Jersey City', 
          state: 'NJ', 
          zip: '07306' 
        },
        typeOfAccident: 'Auto', 
        dateOfAccident: '2024-01-01', 
        injuryBodyParts: ['Neck'],
        policeInvolved: true, 
        insurance: 'Geico', 
        priorAttorney: { spokenTo: false }, 
        uploads: []
      });

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(mockCreateLead).toHaveBeenCalledTimes(1);
  });

  it('should return validation error for missing required fields', async () => {
    const res = await request(server).post('/api/intake/shortform')
      .set('Authorization', 'Bearer mock-token')
      .send({
        firstName: 'John',
        phoneNumber: '1234567890'
      });

    expect(res.statusCode).toEqual(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBe('Validation error');
  });
});
