import request from 'supertest';
import app from '../src/app';

describe('POST /api/intake/shortform', () => {
  it('should create a new lead', async () => {
    const res = await request(app).post('/api/intake/shortform').send({
      firstName: 'John', lastName: 'Doe', phoneNumber: '1234567890', language: 'English',
      address: { street: '123 Main', city: 'Jersey City', state: 'NJ', zip: '07306' },
      typeOfAccident: 'Auto', dateOfAccident: '2024-01-01', injuryBodyParts: ['Neck'],
      policeInvolved: true, insurance: 'Geico', priorAttorney: { spokenTo: false }, uploads: []
    });
    expect(res.statusCode).toEqual(200);
  });
});