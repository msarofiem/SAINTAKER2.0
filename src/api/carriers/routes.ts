import { Router } from 'express';
import { 
  createCarrierAccess, 
  getCarrierAccess, 
  verifyCarrierAccess,
  getCarrierDocuments
} from './controllers';

const router = Router();

router.post('/access/:leadId', createCarrierAccess);
router.get('/access', getCarrierAccess);
router.get('/verify', verifyCarrierAccess);
router.get('/documents/:leadId', getCarrierDocuments);

export default router;
