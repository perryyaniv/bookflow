import { Router } from 'express';
import { Server } from 'socket.io';
import Order, { IOrderItem, ORDER_STATUSES, OrderStatus } from '../models/Order';
import AppSettings from '../models/AppSettings';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth';
import { logAudit } from '../utils/auditLogger';
import { isNotArrived, isNotCollected } from '../utils/alerts';
import { asyncHandler } from '../utils/asyncHandler';

const ARRIVAL_ADVANCEABLE: OrderStatus[] = ['נוצר', 'הוזמן', 'הגיע חלקית', 'הגיע'];
const ARRIVED_OR_LATER: OrderStatus[] = ['הגיע', 'הלקוח עודכן', 'נאסף'];

function supportsPartialArrival(itemCount: number): boolean {
  return itemCount > 1;
}

function statusFromItemArrivals(items: IOrderItem[], currentStatus: OrderStatus): OrderStatus {
  if (!ARRIVAL_ADVANCEABLE.includes(currentStatus)) return currentStatus;
  const allArrived = items.length > 0 && items.every((i) => i.arrived);
  const someArrived = items.some((i) => i.arrived);
  if (allArrived) return 'הגיע';
  if (someArrived) return 'הגיע חלקית';
  return currentStatus === 'הגיע' || currentStatus === 'הגיע חלקית' ? 'הוזמן' : currentStatus;
}

const router = Router();
router.use(authenticate);
const requireWriteAccess = requireRole('admin', 'editor');

const TRACKED_FIELDS = ['status', 'isPaid', 'orderedFrom', 'customerName', 'customerPhone', 'orderDate'];

const FIELD_LABELS: Record<string, string> = {
  status: 'סטטוס',
  isPaid: 'שולם',
  orderedFrom: 'הוזמן מ',
  customerName: 'שם הלקוח',
  customerPhone: 'טלפון',
  orderDate: 'תאריך הזמנה',
};

function formatLogValue(field: string, value: unknown): string {
  if (value === undefined || value === null || value === '') return '—';
  if (field === 'isPaid') return value === true || value === 'true' ? 'כן' : 'לא';
  if (field === 'orderDate') {
    const d = new Date(value as string);
    if (!isNaN(d.getTime())) return d.toLocaleDateString('he-IL');
  }
  return String(value);
}

async function getThresholds() {
  const settings = await AppSettings.findOne().lean();
  return {
    notArrivedThresholdDays: settings?.notArrivedThresholdDays ?? 14,
    notCollectedThresholdDays: settings?.notCollectedThresholdDays ?? 14,
  };
}

function withAlerts<T extends {
  status: OrderStatus;
  orderedAt?: Date | null;
  customerNotifiedAt?: Date | null;
  statusChangedAt?: Date | null;
  updatedAt?: Date;
  createdAt?: Date;
}>(
  order: T,
  thresholds: { notArrivedThresholdDays: number; notCollectedThresholdDays: number }
) {
  return {
    ...order,
    statusChangedAt: order.statusChangedAt ?? order.updatedAt ?? order.createdAt,
    isNotArrived: isNotArrived(order, thresholds.notArrivedThresholdDays),
    isNotCollected: isNotCollected(order, thresholds.notCollectedThresholdDays),
  };
}

router.get('/', asyncHandler<AuthRequest>(async (req, res) => {
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
}));

router.get('/:id', asyncHandler<AuthRequest>(async (req, res) => {
  const order = await Order.findById(req.params.id).populate('branchId', 'name').lean();
  if (!order) {
    res.status(404).json({ message: 'Not found' });
    return;
  }
  const thresholds = await getThresholds();
  res.json(withAlerts(order, thresholds));
}));

router.post('/', requireWriteAccess, asyncHandler<AuthRequest>(async (req, res) => {
  const payload = { ...req.body, createdBy: req.user!.userId, updatedBy: req.user!.userId };
  const order = await Order.create(payload);
  const populated = await Order.findById(order._id).populate('branchId', 'name').lean();
  await logAudit({ userId: req.user!.userId, userName: req.user!.name, orderId: order._id.toString(), action: 'יצר הזמנה' });
  res.status(201).json(populated);
}));

router.put('/:id', requireWriteAccess, asyncHandler<AuthRequest>(async (req, res) => {
  const existing = await Order.findById(req.params.id).lean();
  if (!existing) {
    res.status(404).json({ message: 'Not found' });
    return;
  }

  const update: Record<string, unknown> = { ...req.body, updatedBy: req.user!.userId };
  const newStatus = update.status as OrderStatus | undefined;
  const effectiveItems = (update.items as IOrderItem[] | undefined) ?? existing.items;

  if (newStatus === 'הגיע חלקית' && !supportsPartialArrival(effectiveItems.length)) {
    res.status(400).json({ message: 'סטטוס "הגיע חלקית" רלוונטי רק להזמנה עם יותר מספר אחד' });
    return;
  }

  if (newStatus && newStatus !== existing.status) {
    if (newStatus === 'הוזמן' && !existing.orderedAt) update.orderedAt = new Date();
    if (newStatus === 'הלקוח עודכן' && !existing.customerNotifiedAt) update.customerNotifiedAt = new Date();
    update.statusChangedAt = new Date();
  }

  const effectiveStatus = (newStatus ?? existing.status) as OrderStatus;
  if (ARRIVED_OR_LATER.includes(effectiveStatus)) {
    update.items = effectiveItems.map((it) => ({ ...it, arrived: true }));
  }

  const io: Server = req.app.get('io');
  const updated = await Order.findByIdAndUpdate(req.params.id, update, { new: true })
    .populate('branchId', 'name')
    .lean();

  for (const field of TRACKED_FIELDS) {
    const oldVal = (existing as Record<string, unknown>)[field];
    const newVal = (req.body as Record<string, unknown>)[field];
    if (newVal !== undefined && String(oldVal) !== String(newVal)) {
      const label = FIELD_LABELS[field] ?? field;
      await logAudit({
        userId: req.user!.userId,
        userName: req.user!.name,
        orderId: req.params.id,
        action: `עדכן ${label}: "${formatLogValue(field, oldVal)}" → "${formatLogValue(field, newVal)}"`,
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
}));

router.patch('/:id/status', requireWriteAccess, asyncHandler<AuthRequest>(async (req, res) => {
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

  if (status === 'הגיע חלקית' && !supportsPartialArrival(existing.items.length)) {
    res.status(400).json({ message: 'סטטוס "הגיע חלקית" רלוונטי רק להזמנה עם יותר מספר אחד' });
    return;
  }

  const oldStatus = existing.status;
  existing.status = status;
  existing.updatedBy = req.user!.userId as never;
  if (status === 'הוזמן' && !existing.orderedAt) existing.orderedAt = new Date();
  if (ARRIVED_OR_LATER.includes(status)) existing.items.forEach((i) => { i.arrived = true; });
  if (status === 'הלקוח עודכן' && !existing.customerNotifiedAt) existing.customerNotifiedAt = new Date();
  if (status !== oldStatus) existing.statusChangedAt = new Date();
  await existing.save();

  const populated = await Order.findById(existing._id).populate('branchId', 'name').lean();
  await logAudit({
    userId: req.user!.userId,
    userName: req.user!.name,
    orderId: existing._id.toString(),
    action: `שינה סטטוס: "${oldStatus}" → "${status}"`,
    fieldChanged: 'status',
    oldValue: oldStatus,
    newValue: status,
  });

  const io: Server = req.app.get('io');
  const thresholds = await getThresholds();
  const result = withAlerts(populated!, thresholds);
  io.to(`branch:${existing.branchId}`).emit('order-updated', result);
  res.json(result);
}));

router.patch('/:id/items/:index/arrived', requireWriteAccess, asyncHandler<AuthRequest>(async (req, res) => {
  const index = parseInt(req.params.index, 10);
  const { arrived } = req.body as { arrived: boolean };

  const existing = await Order.findById(req.params.id);
  if (!existing) {
    res.status(404).json({ message: 'Not found' });
    return;
  }
  const item = existing.items[index];
  if (!item) {
    res.status(400).json({ message: 'Invalid item index' });
    return;
  }

  if (!supportsPartialArrival(existing.items.length)) {
    res.status(400).json({ message: 'בהזמנה עם ספר אחד יש לשנות את סטטוס ההזמנה כולה' });
    return;
  }

  item.arrived = !!arrived;
  const oldStatus = existing.status;
  const newStatus = statusFromItemArrivals(existing.items, existing.status);
  existing.status = newStatus;
  existing.updatedBy = req.user!.userId as never;
  if (ARRIVED_OR_LATER.includes(newStatus)) existing.items.forEach((i) => { i.arrived = true; });
  if ((newStatus === 'הגיע' || newStatus === 'הגיע חלקית') && !existing.orderedAt) existing.orderedAt = new Date();
  if (newStatus !== oldStatus) existing.statusChangedAt = new Date();
  await existing.save();

  await logAudit({
    userId: req.user!.userId,
    userName: req.user!.name,
    orderId: existing._id.toString(),
    action: arrived ? `סימן ספר כהגיע: ${item.bookName}` : `ביטל סימון הגעה: ${item.bookName}`,
  });
  if (newStatus !== oldStatus) {
    await logAudit({
      userId: req.user!.userId,
      userName: req.user!.name,
      orderId: existing._id.toString(),
      action: `שינה סטטוס: "${oldStatus}" → "${newStatus}"`,
      fieldChanged: 'status',
      oldValue: oldStatus,
      newValue: newStatus,
    });
  }

  const populated = await Order.findById(existing._id).populate('branchId', 'name').lean();
  const io: Server = req.app.get('io');
  const thresholds = await getThresholds();
  const result = withAlerts(populated!, thresholds);
  io.to(`branch:${existing.branchId}`).emit('order-updated', result);
  res.json(result);
}));

router.delete('/:id', requireWriteAccess, asyncHandler<AuthRequest>(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) {
    res.status(404).json({ message: 'Not found' });
    return;
  }
  await order.deleteOne();
  await logAudit({ userId: req.user!.userId, userName: req.user!.name, action: 'מחק הזמנה' });
  res.json({ message: 'Deleted' });
}));

export default router;
