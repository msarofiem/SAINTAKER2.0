import { Router } from 'express';

const router = Router();

router.post('/login', (req, res) => {
  res.status(501).json({ message: 'Authentication not implemented yet' });
});

export default router;
