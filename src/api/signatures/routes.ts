import { Router } from 'express';
import { createSignatureRequest, updateSignatureStatus, getSignatureStatus } from './controllers';
import { validateSignatureRequest, validateSignatureUpdate } from './middleware';

const router = Router();

router.post('/request', validateSignatureRequest, createSignatureRequest);
router.post('/:signatureId/status', validateSignatureUpdate, updateSignatureStatus);
router.get('/:signatureId', getSignatureStatus);

export default router;
