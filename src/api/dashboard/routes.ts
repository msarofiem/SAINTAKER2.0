import { Router } from 'express';
import { getLeads, getDashboardMetrics } from './controllers';

const router = Router();

router.get('/leads', getLeads);
router.get('/metrics', getDashboardMetrics);

export default router;
