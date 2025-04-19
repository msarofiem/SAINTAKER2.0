import { Router } from 'express';

const router = Router();

router.post('/', (req, res) => {
  res.status(501).json({ message: 'Referral creation not implemented yet' });
});

export default router;
