import express from 'express';
import { prisma } from '../test-utils';
import intakeRoutes from '../../api/intake/routes';
import referralsRoutes from '../../api/referrals/routes';

process.env.NODE_ENV = 'test';

const app = express();

app.use(express.json());

app.use((req, res, next) => {
  req.user = { userId: 'test-user-id' };
  next();
});

app.use('/api/intake', intakeRoutes);
app.use('/api/referrals', referralsRoutes);

app.use((req, res, next) => {
  const originalSend = res.send;
  res.send = function(body) {
    console.log(`Response for ${req.method} ${req.path}:`, body);
    return originalSend.call(this, body);
  };
  next();
});

app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error in test app:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

export default app;
export { prisma };
