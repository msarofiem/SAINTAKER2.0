import { Router } from 'express';
import { getConversionHeatmap, getLeadTimeline } from './controllers';

const router = Router();

router.get('/heatmap', getConversionHeatmap);
router.get('/timeline/:leadId', getLeadTimeline);

export default router;
