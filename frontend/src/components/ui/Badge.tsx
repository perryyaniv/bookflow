import { OrderStatus } from '../../types';

const statusConfig: Record<OrderStatus, { dot: string }> = {
  'נוצר': { dot: 'bg-status-created' },
  'הוזמן': { dot: 'bg-status-ordered' },
  'הגיע חלקית': { dot: 'bg-status-partial' },
  'הגיע': { dot: 'bg-status-arrived' },
  'הלקוח עודכן': { dot: 'bg-status-notified' },
  'נאסף': { dot: 'bg-status-collected' },
  'בוטל': { dot: 'bg-status-cancelled' },
};

interface StatusBadgeProps { status: OrderStatus }

export function StatusBadge({ status }: StatusBadgeProps) {
  const cfg = statusConfig[status] ?? { dot: 'bg-gray-300' };
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${cfg.dot}`} />
      <span className="text-xs text-gray-600 font-medium">{status}</span>
    </span>
  );
}

interface BadgeProps {
  children: React.ReactNode;
  className?: string;
}

export function Badge({ children, className = '' }: BadgeProps) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${className}`}>
      {children}
    </span>
  );
}
