import { Router } from 'express';
import { createReferral, getReferrals } from './controllers';
import { getReferralStatus, updateReferralFeedback, sendReferralReminder } from './feedback';
import { validateReferralData } from './validation';

const router = Router();

router.post('/:leadId', validateReferralData, createReferral);
router.get('/', getReferrals);
router.get('/status', getReferralStatus);
router.put('/feedback/:referralId', updateReferralFeedback);
router.post('/reminder/:referralId', sendReferralReminder);

export default router;
