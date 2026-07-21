import { Router } from 'express';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth';
import AuditLogEntry from '../models/AuditLogEntry';
import { logAudit } from '../utils/auditLogger';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();
router.use(authenticate, requireRole('admin'));

router.get('/', asyncHandler<AuthRequest>(async (req, res) => {
  const { orderId, page = '1', limit = '50', search } = req.query as Record<string, string>;
  const query: Record<string, unknown> = {};
  if (orderId) query.orderId = orderId;
  if (search) {
    query.$or = [
      { userName: { $regex: search, $options: 'i' } },
      { action: { $regex: search, $options: 'i' } },
      { fieldChanged: { $regex: search, $options: 'i' } },
    ];
  }

  const total = await AuditLogEntry.countDocuments(query);
  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(100, parseInt(limit));
  const data = await AuditLogEntry.find(query)
    .sort({ timestamp: -1 })
    .skip((pageNum - 1) * limitNum)
    .limit(limitNum)
    .lean();

  res.json({ data, total, page: pageNum, totalPages: Math.ceil(total / limitNum) });
}));

router.delete('/', asyncHandler<AuthRequest>(async (req, res) => {
  const result = await AuditLogEntry.deleteMany({});
  await logAudit({
    userId: req.user!.userId,
    userName: req.user!.name,
    action: `ניקה את לוג השינויים (${result.deletedCount} רשומות)`,
  });
  res.json({ message: 'Cleared', deletedCount: result.deletedCount });
}));

export default router;
