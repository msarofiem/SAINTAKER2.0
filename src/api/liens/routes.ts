import { Router } from 'express';
import { createLien, updateLien, getLiens, generateLongworthLetter } from './controllers';
import { validateLienCreation, validateLienUpdate } from './middleware';

const router = Router();

router.post('/:leadId', validateLienCreation, createLien);
router.put('/:lienId', validateLienUpdate, updateLien);
router.get('/:leadId', getLiens);
router.post('/:leadId/longworth', generateLongworthLetter);

export default router;
