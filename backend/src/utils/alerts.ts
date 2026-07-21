import { IOrder } from '../models/Order';

export function daysSince(date: Date): number {
  return Math.floor((Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24));
}

export function isNotArrived(order: Pick<IOrder, 'status' | 'orderedAt'>, thresholdDays: number): boolean {
  if (!['הוזמן', 'הגיע חלקית'].includes(order.status) || !order.orderedAt) return false;
  return daysSince(order.orderedAt) >= thresholdDays;
}

export function isNotCollected(order: Pick<IOrder, 'status' | 'customerNotifiedAt'>, thresholdDays: number): boolean {
  if (order.status !== 'הלקוח עודכן' || !order.customerNotifiedAt) return false;
  return daysSince(order.customerNotifiedAt) >= thresholdDays;
}
