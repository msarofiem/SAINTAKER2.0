import { Router } from 'express';
import { authMiddleware } from '../../utils/auth';
import { 
  createReferralPartner, 
  getReferralPartners,
  getReferralPartnerById,
  updateReferralPartner
} from './partners';
import { 
  findReferralMatches, 
  createReferralMatch 
} from './matcher';
import { 
  validateReferralPartner, 
  validateReferralPartnerUpdate 
} from './partner-validation';

const router = Router();

if (process.env.NODE_ENV !== 'test') {
  router.use(authMiddleware);
}

router.post('/partners', validateReferralPartner, createReferralPartner);
router.get('/partners', getReferralPartners);
router.get('/partners/:partnerId', getReferralPartnerById);
router.put('/partners/:partnerId', validateReferralPartnerUpdate, updateReferralPartner);

router.get('/matches/:leadId', findReferralMatches);
router.post('/matches/:leadId/:partnerId', createReferralMatch);

router.post('/:leadId', (req, res) => {
  res.status(501).json({ success: false, message: 'Referral creation not implemented yet' });
});

router.get('/', (req, res) => {
  res.status(200).json({ success: true, data: [] });
});

export default router;
