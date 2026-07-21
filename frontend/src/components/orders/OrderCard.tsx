import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Order, OrderStatus } from '../../types';
import { StatusBadge } from '../ui/Badge';
import { formatDate } from '../../utils/date';
import { changeOrderStatus } from '../../api/orders';
import { useToast } from '../../contexts/ToastContext';
import Modal from '../ui/Modal';
import Button from '../ui/Button';

interface Props {
  order: Order;
  onStatusChanged?: (updated: Order) => void;
}

const NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus>> = {
  'נוצר': 'הוזמן',
  'הוזמן': 'הגיע',
  'הגיע חלקית': 'הגיע',
  'הגיע': 'הלקוח עודכן',
  'הלקוח עודכן': 'נאסף',
};

export default function OrderCard({ order, onStatusChanged }: Props) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [changing, setChanging] = useState(false);
  const { showToast } = useToast();
  const [confirmStatus, setConfirmStatus] = useState<OrderStatus | null>(null);

  const nextStatus = NEXT_STATUS[order.status];
  const isTerminal = order.status === 'נאסף' || order.status === 'בוטל';

  const doStatusChange = async (status: OrderStatus) => {
    setChanging(true);
    try {
      const updated = await changeOrderStatus(order._id, status);
      onStatusChanged?.(updated);
      showToast(`ההזמנה הועברה לסטטוס "${status}"`, 'success');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      showToast(msg ?? 'שגיאה בשינוי סטטוס', 'error');
    } finally {
      setChanging(false);
      setConfirmStatus(null);
    }
  };

  const handleAdvanceClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!nextStatus) return;
    setConfirmStatus(nextStatus);
  };

  const handleCancelClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setConfirmStatus('בוטל');
  };

  return (
    <div
      onClick={() => navigate(`/orders/${order._id}`)}
      className="card cursor-pointer hover:shadow-md hover:border-r-primary-dark transition-all group flex flex-col"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-gray-900 text-sm leading-tight group-hover:text-primary transition-colors truncate">
            {order.customerName}
          </h3>
          <p className="text-xs text-gray-400 mt-0.5">{order.customerPhone}</p>
        </div>
        <StatusBadge status={order.status} />
      </div>

      <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 flex-1">
        <span className="label mb-0">{t('orders.branch')}</span>
        <span className="text-xs text-gray-700 font-medium">{order.branchId?.name ?? '—'}</span>

        <span className="label mb-0">{t('orders.orderDate')}</span>
        <span className="text-xs text-gray-700">{formatDate(order.orderDate)}</span>

        <span className="label mb-0">{t('orders.isPaid')}</span>
        <span className={`text-xs font-medium ${order.isPaid ? 'text-green-600' : 'text-red-500'}`}>
          {order.isPaid ? t('orders.paid') : t('orders.unpaid')}
        </span>
      </div>

      {order.items?.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {order.items.slice(0, 3).map((it, idx) => (
            <span key={idx} className={`text-xs px-2 py-0.5 rounded-full truncate max-w-[10rem] border ${it.arrived ? 'bg-status-partial/10 text-status-partial border-status-partial/30' : 'bg-primary/8 text-primary border-primary/20'}`}>
              {it.bookName} ×{it.quantity}
            </span>
          ))}
          {order.items.length > 3 && (
            <span className="text-xs text-gray-400 px-1">+{order.items.length - 3}</span>
          )}
        </div>
      )}

      {order.status === 'הגיע חלקית' && (
        <p className="mt-1.5 text-xs font-medium text-status-partial">
          {order.items.filter((i) => i.arrived).length} מתוך {order.items.length} ספרים הגיעו
        </p>
      )}

      {(order.isNotArrived || order.isNotCollected) && (
        <div className="mt-2 flex items-center gap-1.5 text-red-500 text-xs font-medium">
          <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
          </svg>
          {order.isNotArrived ? t('orders.notArrived') : t('orders.notCollected')}
        </div>
      )}

      {!isTerminal && (
        <div
          className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-2"
          onClick={(e) => e.stopPropagation()}
        >
          {nextStatus && (
            <button
              onClick={handleAdvanceClick}
              disabled={changing}
              title={`שנה סטטוס ל-${nextStatus}`}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors bg-primary text-white hover:bg-primary-dark"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              {nextStatus}
            </button>
          )}
          <button
            onClick={handleCancelClick}
            disabled={changing}
            title="בטל הזמנה"
            className="px-3 py-1.5 rounded-md text-xs font-semibold text-red-500 hover:bg-red-50 transition-colors border border-red-200 hover:border-red-300"
          >
            בוטל
          </button>
        </div>
      )}

      {confirmStatus && (
        <Modal open onClose={() => setConfirmStatus(null)} size="sm">
          <div className="text-center space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-gray-800 text-base">שינוי סטטוס הזמנה</p>
              <p className="text-sm text-gray-500 mt-1">
                להעביר את ההזמנה של <span className="font-medium text-gray-700">"{order.customerName}"</span> לסטטוס{' '}
                <span className="font-semibold text-primary">"{confirmStatus}"</span>?
              </p>
            </div>
            <div className="flex gap-3">
              <Button variant="secondary" className="flex-1" onClick={() => setConfirmStatus(null)}>ביטול</Button>
              <Button className="flex-1" loading={changing} onClick={() => doStatusChange(confirmStatus)}>אישור</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
