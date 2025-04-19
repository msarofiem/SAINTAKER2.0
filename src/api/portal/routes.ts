import { Router } from 'express';
import { getLeadStatus, uploadDocument, verifyPortalAccess } from './controllers';
import { validatePortalAccess, validateDocumentUpload } from './middleware';
import multer from 'multer';

const upload = multer({ dest: 'uploads/' });

const router = Router();

router.post('/access', validatePortalAccess, verifyPortalAccess);
router.get('/:leadId/status', getLeadStatus);
router.post('/:leadId/uploads', upload.single('file'), validateDocumentUpload, uploadDocument);

export default router;
