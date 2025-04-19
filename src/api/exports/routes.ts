import { Router } from 'express';
import { generateExport, downloadExport } from './controllers';
import { validateExportRequest } from './middleware';

const router = Router();

router.post('/:leadId', validateExportRequest, generateExport);
router.get('/:exportId', downloadExport);

export default router;
