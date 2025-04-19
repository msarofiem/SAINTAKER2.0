import { Router } from 'express';

const router = Router();

router.post('/generate', (req, res) => {
  res.status(501).json({ message: 'Document generation not implemented yet' });
});

export default router;
