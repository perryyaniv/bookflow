import { Router } from 'express';
import Branch from '../models/Branch';
import Order from '../models/Order';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();
router.use(authenticate);

router.get('/', asyncHandler<AuthRequest>(async (_req, res) => {
  const branches = await Branch.find().sort({ name: 1 });
  res.json(branches);
}));

router.post('/', requireRole('admin'), asyncHandler<AuthRequest>(async (req, res) => {
  const branch = await Branch.create(req.body);
  res.status(201).json(branch);
}));

router.put('/:id', requireRole('admin'), asyncHandler<AuthRequest>(async (req, res) => {
  const branch = await Branch.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!branch) {
    res.status(404).json({ message: 'Not found' });
    return;
  }
  res.json(branch);
}));

router.delete('/:id', requireRole('admin'), asyncHandler<AuthRequest>(async (req, res) => {
  const inUse = await Order.exists({ branchId: req.params.id });
  if (inUse) {
    res.status(409).json({ message: 'בשימוש - לא ניתן למחוק' });
    return;
  }
  await Branch.findByIdAndDelete(req.params.id);
  res.json({ message: 'Deleted' });
}));

export default router;
