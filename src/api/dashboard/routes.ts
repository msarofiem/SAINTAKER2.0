import { Router } from 'express';

const router = Router();

router.get('/leads', (req, res) => {
  res.status(501).json({ message: 'Dashboard leads not implemented yet' });
});

export default router;
