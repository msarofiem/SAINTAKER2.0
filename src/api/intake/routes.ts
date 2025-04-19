import { Router } from 'express';
import { createShortFormLead } from './controllers';
import { validateShortFormLead } from './middleware';
import { evaluateIntake } from './evaluate';

const router = Router();

router.post('/shortform', validateShortFormLead, createShortFormLead);
router.post('/evaluate/:leadId', evaluateIntake);

export default router;
