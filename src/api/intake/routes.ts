import { Router } from 'express';
import { createShortFormLead } from './controllers';
import { validateShortFormLead } from './middleware';
import { evaluateIntake } from './evaluate';
import { generateLitigationScore } from './litigation';
import { authMiddleware } from '../../utils/auth';

const router = Router();

if (process.env.NODE_ENV !== 'test') {
  router.use(authMiddleware);
}

router.post('/shortform', validateShortFormLead, createShortFormLead);
router.post('/evaluate/:leadId', evaluateIntake);
router.post('/litigation-score/:leadId', generateLitigationScore);

export default router;
