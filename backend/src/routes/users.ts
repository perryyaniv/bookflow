import { Router, Response } from 'express';
import User from '../models/User';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth';
import { logAudit } from '../utils/auditLogger';

const router = Router();
router.use(authenticate, requireRole('admin'));

router.get('/', async (_req: AuthRequest, res: Response) => {
  const users = await User.find().select('-password').sort({ createdAt: -1 });
  res.json(users);
});

router.post('/', async (req: AuthRequest, res: Response) => {
  const { name, email, password, role, branchId } = req.body;
  if (!name || !email || !password || !role) {
    res.status(400).json({ message: 'name, email, password, role required' });
    return;
  }
  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    res.status(409).json({ message: 'Email already exists' });
    return;
  }
  const user = await User.create({ name, email, password, role, branchId: branchId || null, forcePasswordChange: true });
  await logAudit({ userId: req.user!.userId, userName: req.user!.name, action: `יצר משתמש ${name}` });
  res.status(201).json({
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    branchId: user.branchId,
    active: user.active,
    forcePasswordChange: user.forcePasswordChange,
  });
});

router.put('/:id', async (req: AuthRequest, res: Response) => {
  const { role, active, branchId, name } = req.body;
  const update: Record<string, unknown> = {};
  if (role !== undefined) update.role = role;
  if (active !== undefined) update.active = active;
  if (branchId !== undefined) update.branchId = branchId || null;
  if (name !== undefined) update.name = name;

  const user = await User.findByIdAndUpdate(req.params.id, update, { new: true }).select('-password');
  if (!user) {
    res.status(404).json({ message: 'User not found' });
    return;
  }
  await logAudit({ userId: req.user!.userId, userName: req.user!.name, action: `עדכן משתמש ${user.name}` });
  res.json(user);
});

router.post('/:id/reset-password', async (req: AuthRequest, res: Response) => {
  const { tempPassword } = req.body;
  if (!tempPassword) {
    res.status(400).json({ message: 'tempPassword required' });
    return;
  }
  const user = await User.findById(req.params.id);
  if (!user) {
    res.status(404).json({ message: 'User not found' });
    return;
  }
  user.password = tempPassword;
  user.forcePasswordChange = true;
  await user.save();
  await logAudit({ userId: req.user!.userId, userName: req.user!.name, action: `אפס סיסמה למשתמש ${user.name}` });
  res.json({ message: 'Password reset' });
});

export default router;
