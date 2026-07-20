import { Router, Response } from 'express';
import { Server } from 'socket.io';
import Order, { ORDER_STATUSES, OrderStatus } from '../models/Order';
import AppSettings from '../models/AppSettings';
import { authenticate, AuthRequest } from '../middleware/auth';
import { logAudit } from '../utils/auditLogger';
import { isNotArrived, isNotCollected } from '../utils/alerts';

const router = Router();
router.use(authenticate);

const TRACKED_FIELDS = ['status', 'isPaid', 'orderedFrom', 'customerName', 'customerPhone', 'orderDate'];

async function getThresholds() {
  const settings = await AppSettings.findOne().lean();
  return {
    notArrivedThresholdDays: settings?.notArrivedThresholdDays ?? 14,
    notCollectedThresholdDays: settings?.notCollectedThresholdDays ?? 14,
  };
}

function withAlerts<T extends { status: OrderStatus; orderedAt?: Date | null; customerNotifiedAt?: Date | null }>(
  order: T,
  thresholds: { notArrivedThresholdDays: number; notCollectedThresholdDays: number }
) {
  return {
    ...order,
    isNotArrived: isNotArrived(order, thresholds.notArrivedThresholdDays),
    isNotCollected: isNotCollected(order, thresholds.notCollectedThresholdDays),
  };
}

router.get('/', async (req: AuthRequest, res: Response) => {
  const {
    branchId, status, isPaid, search,
    page = '1', limit = '25', sortBy = 'createdAt', sortDir = 'desc', alert,
  } = req.query as Record<string, string>;

  const query: Record<string, unknown> = {};
  if (branchId) query.branchId = branchId;
  if (status) query.status = status;
  if (isPaid !== undefined) query.isPaid = isPaid === 'true';
  if (search) {
    query.$or = [
      { customerName: { $regex: search, $options: 'i' } },
      { customerPhone: { $regex: search, $options: 'i' } },
      { 'items.bookName': { $regex: search, $options: 'i' } },
      { 'items.sku': { $regex: search, $options: 'i' } },
    ];
  }

  const thresholds = await getThresholds();
  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(100, parseInt(limit));
  const sortOrder = sortDir === 'asc' ? 1 : -1;

  if (alert === 'notArrived' || alert === 'notCollected') {
    // Compute in JS since it depends on configurable thresholds
    const candidateQuery = { ...query, status: alert === 'notArrived' ? 'הוזמן' : 'הלקוח עודכן' };
    const all = await Order.find(candidateQuery).populate('branchId', 'name').lean();
    const filtered = all.filter((o) =>
      alert === 'notArrived'
        ? isNotArrived(o as never, thresholds.notArrivedThresholdDays)
        : isNotCollected(o as never, thresholds.notCollectedThresholdDays)
    );
    const total = filtered.length;
    const paged = filtered
      .sort((a, b) => sortOrder * (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()))
      .slice((pageNum - 1) * limitNum, pageNum * limitNum)
      .map((o) => withAlerts(o, thresholds));
    res.json({ data: paged, total, page: pageNum, totalPages: Math.ceil(total / limitNum) });
    return;
  }

  const total = await Order.countDocuments(query);
  const orders = await Order.find(query)
    .populate('branchId', 'name')
    .sort({ [sortBy]: sortOrder })
    .skip((pageNum - 1) * limitNum)
    .limit(limitNum)
    .lean();

  const result = orders.map((o) => withAlerts(o, thresholds));
  res.json({ data: result, total, page: pageNum, totalPages: Math.ceil(total / limitNum) });
});

router.get('/:id', async (req: AuthRequest, res: Response) => {
  const order = await Order.findById(req.params.id).populate('branchId', 'name').lean();
  if (!order) {
    res.status(404).json({ message: 'Not found' });
    return;
  }
  const thresholds = await getThresholds();
  res.json(withAlerts(order, thresholds));
});

router.post('/', async (req: AuthRequest, res: Response) => {
  const payload = { ...req.body, createdBy: req.user!.userId, updatedBy: req.user!.userId };
  const order = await Order.create(payload);
  const populated = await Order.findById(order._id).populate('branchId', 'name').lean();
  await logAudit({ userId: req.user!.userId, userName: req.user!.name, orderId: order._id.toString(), action: 'יצר הזמנה' });
  res.status(201).json(populated);
});

router.put('/:id', async (req: AuthRequest, res: Response) => {
  const existing = await Order.findById(req.params.id).lean();
  if (!existing) {
    res.status(404).json({ message: 'Not found' });
    return;
  }

  const update: Record<string, unknown> = { ...req.body, updatedBy: req.user!.userId };
  const newStatus = update.status as OrderStatus | undefined;

  if (newStatus && newStatus !== existing.status) {
    if (newStatus === 'הוזמן' && !existing.orderedAt) update.orderedAt = new Date();
    if (newStatus === 'הלקוח עודכן' && !existing.customerNotifiedAt) update.customerNotifiedAt = new Date();
  }

  const io: Server = req.app.get('io');
  const updated = await Order.findByIdAndUpdate(req.params.id, update, { new: true })
    .populate('branchId', 'name')
    .lean();

  for (const field of TRACKED_FIELDS) {
    const oldVal = (existing as Record<string, unknown>)[field];
    const newVal = (req.body as Record<string, unknown>)[field];
    if (newVal !== undefined && String(oldVal) !== String(newVal)) {
      await logAudit({
        userId: req.user!.userId,
        userName: req.user!.name,
        orderId: req.params.id,
        action: 'עדכן שדה',
        fieldChanged: field,
        oldValue: oldVal,
        newValue: newVal,
      });
    }
  }

  const thresholds = await getThresholds();
  const result = withAlerts(updated!, thresholds);
  io.to(`branch:${existing.branchId}`).emit('order-updated', result);
  res.json(result);
});

router.patch('/:id/status', async (req: AuthRequest, res: Response) => {
  const { status } = req.body as { status: OrderStatus };
  if (!ORDER_STATUSES.includes(status)) {
    res.status(400).json({ message: 'Invalid status' });
    return;
  }
  const existing = await Order.findById(req.params.id);
  if (!existing) {
    res.status(404).json({ message: 'Not found' });
    return;
  }

  const oldStatus = existing.status;
  existing.status = status;
  existing.updatedBy = req.user!.userId as never;
  if (status === 'הוזמן' && !existing.orderedAt) existing.orderedAt = new Date();
  if (status === 'הלקוח עודכן' && !existing.customerNotifiedAt) existing.customerNotifiedAt = new Date();
  await existing.save();

  const populated = await Order.findById(existing._id).populate('branchId', 'name').lean();
  await logAudit({
    userId: req.user!.userId,
    userName: req.user!.name,
    orderId: existing._id.toString(),
    action: 'שינה סטטוס',
    fieldChanged: 'status',
    oldValue: oldStatus,
    newValue: status,
  });

  const io: Server = req.app.get('io');
  const thresholds = await getThresholds();
  const result = withAlerts(populated!, thresholds);
  io.to(`branch:${existing.branchId}`).emit('order-updated', result);
  res.json(result);
});

router.delete('/:id', async (req: AuthRequest, res: Response) => {
  const order = await Order.findById(req.params.id);
  if (!order) {
    res.status(404).json({ message: 'Not found' });
    return;
  }
  await order.deleteOne();
  await logAudit({ userId: req.user!.userId, userName: req.user!.name, action: 'מחק הזמנה' });
  res.json({ message: 'Deleted' });
});

export default router;
