import { Router } from 'express';
import { createShortFormLead } from './controllers';
import { validateShortFormLead } from './middleware';

const router = Router();

router.post('/shortform', validateShortFormLead, createShortFormLead);

export default router;
