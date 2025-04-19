import { Router } from 'express';
import { generateDocument, getDocument } from './controllers';
import { validateDocumentGeneration, verifyDocumentAccess } from './middleware';

const router = Router();

router.post('/generate', validateDocumentGeneration, generateDocument);
router.get('/:documentId', (req, res, next) => {
  if (!req.query.token && process.env.NODE_ENV !== 'test') {
    return res.status(401).json({
      success: false,
      error: 'Authentication token required'
    });
  }
  next();
}, verifyDocumentAccess, getDocument);

export default router;
