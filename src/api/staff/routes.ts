import { Router } from 'express';
import { 
  createStaffMember, 
  getStaffMembers, 
  assignLead, 
  getStaffAssignments,
  toggleAutoAssign
} from './controllers';

const router = Router();

router.post('/', createStaffMember);
router.get('/', getStaffMembers);
router.post('/assign/:leadId', assignLead);
router.get('/assignments', getStaffAssignments);
router.put('/auto-assign', toggleAutoAssign);

export default router;
