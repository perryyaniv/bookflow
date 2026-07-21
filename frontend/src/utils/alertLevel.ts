import { Order } from '../types';

export type AlertLevel = 'red' | 'yellow' | 'green';

const NOT_ARRIVED_STATUSES = ['הוזמן', 'הגיע חלקית'];
const NOT_COLLECTED_STATUS = 'הלקוח עודכן';

const YELLOW_RATIO = 0.7;

function daysSince(date: string | Date): number {
  return Math.floor((Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24));
}

export function getAlertAgeDays(order: Order): number {
  if (NOT_ARRIVED_STATUSES.includes(order.status) && order.orderedAt) return daysSince(order.orderedAt);
  if (order.status === NOT_COLLECTED_STATUS && order.customerNotifiedAt) return daysSince(order.customerNotifiedAt);
  return 0;
}

export function getAlertLevel(
  order: Order,
  thresholds: { notArrivedThresholdDays: number; notCollectedThresholdDays: number }
): AlertLevel {
  if (order.isNotArrived || order.isNotCollected) return 'red';

  if (NOT_ARRIVED_STATUSES.includes(order.status) && order.orderedAt) {
    if (daysSince(order.orderedAt) >= thresholds.notArrivedThresholdDays * YELLOW_RATIO) return 'yellow';
  }
  if (order.status === NOT_COLLECTED_STATUS && order.customerNotifiedAt) {
    if (daysSince(order.customerNotifiedAt) >= thresholds.notCollectedThresholdDays * YELLOW_RATIO) return 'yellow';
  }
  return 'green';
}
