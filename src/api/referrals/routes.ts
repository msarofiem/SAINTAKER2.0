import { Router } from 'express';
import { createReferral, rejectLead } from './controllers';
import { validateReferral, validateRejection } from './middleware';

const router = Router();

router.post('/', validateReferral, createReferral);
router.post('/reject', validateRejection, rejectLead);

export default router;
