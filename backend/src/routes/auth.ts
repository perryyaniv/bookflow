import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

router.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ message: 'Email and password required' });
    return;
  }
  const user = await User.findOne({ email: email.toLowerCase(), active: true });
  if (!user || !(await user.comparePassword(password))) {
    res.status(401).json({ message: 'Invalid credentials' });
    return;
  }
  const token = jwt.sign(
    { userId: user._id, name: user.name, role: user.role },
    process.env.JWT_SECRET || 'secret',
    { expiresIn: '30d' }
  );
  res.json({
    token,
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      branchId: user.branchId,
      forcePasswordChange: user.forcePasswordChange,
    },
  });
});

router.post('/change-password', authenticate, async (req: AuthRequest, res: Response) => {
  const { newPassword } = req.body;
  if (!newPassword || newPassword.length < 6) {
    res.status(400).json({ message: 'Password must be at least 6 characters' });
    return;
  }
  const user = await User.findById(req.user!.userId);
  if (!user) {
    res.status(404).json({ message: 'User not found' });
    return;
  }
  user.password = newPassword;
  user.forcePasswordChange = false;
  await user.save();
  res.json({ message: 'Password changed successfully' });
});

router.get('/me', authenticate, async (req: AuthRequest, res: Response) => {
  const user = await User.findById(req.user!.userId).select('-password');
  if (!user) {
    res.status(404).json({ message: 'User not found' });
    return;
  }
  res.json(user);
});

export default router;
