import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Order, OrderStatus, ORDER_STATUSES } from '../../types';
import { AlertLevel, getAlertText } from '../../utils/alertLevel';
import { StatusBadge } from '../ui/Badge';
import { formatDate } from '../../utils/date';
import { changeOrderStatus } from '../../api/orders';
import { useToast } from '../../contexts/ToastContext';
import Modal from '../ui/Modal';
import Button from '../ui/Button';

interface Props {
  order: Order;
  level: AlertLevel;
  canWrite: boolean;
  onStatusChanged?: (updated: Order) => void;
}

const ALERT_TEXT_COLOR: Record<AlertLevel, string> = {
  red: 'text-red-600',
  yellow: 'text-amber-600',
  green: '',
};

const NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus>> = {
  'נוצר': 'הוזמן',
  'הוזמן': 'הגיע',
  'הגיע חלקית': 'הגיע',
  'הגיע': 'הלקוח עודכן',
  'הלקוח עודכן': 'נאסף',
};

const JUMPABLE_STATUSES = ORDER_STATUSES.filter((s) => s !== 'בוטל');

export default function OrderCard({ order, level, canWrite, onStatusChanged }: Props) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [changing, setChanging] = useState(false);
  const { showToast } = useToast();
  const [confirmStatus, setConfirmStatus] = useState<OrderStatus | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const nextStatus = NEXT_STATUS[order.status];
  const isTerminal = order.status === 'נאסף' || order.status === 'בוטל';
  const alertMsg = getAlertText(order, level, t);
  const isCancelConfirm = confirmStatus === 'בוטל';

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

  const handleJumpTo = (e: React.MouseEvent, status: OrderStatus) => {
    e.stopPropagation();
    setMenuOpen(false);
    if (status === order.status) return;
    setConfirmStatus(status);
  };

  return (
    <div
      onClick={() => setExpanded((e) => !e)}
      className="card cursor-pointer hover:shadow-md hover:border-r-primary-dark transition-all group flex flex-col"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-bold text-gray-900 text-xs leading-tight group-hover:text-primary transition-colors truncate">
              {order.customerName}
            </h3>
            {alertMsg && (
              <span className={`flex items-center gap-1 font-bold text-xs leading-tight flex-shrink-0 ${ALERT_TEXT_COLOR[level]}`}>
                <svg className="w-3.5 h-3.5 flex-shrink-0 animate-breathe" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                </svg>
                {alertMsg}
              </span>
            )}
          </div>
          <p className="text-xs text-gray-400 mt-0.5">{order.customerPhone}</p>
        </div>
        <StatusBadge status={order.status} />
      </div>

      <div className="flex items-center justify-between gap-2">
        <span className={`text-xs font-bold ${order.isPaid ? 'text-green-600' : 'text-red-500 animate-breathe'}`}>
          {order.isPaid ? t('orders.paid') : t('orders.unpaid')}
        </span>
      </div>

      {order.items?.length > 0 && (
        <div className="mt-1.5 space-y-1">
          {(expanded ? order.items : order.items.slice(0, 3)).map((it, idx) => (
            <div key={idx} className="flex items-center justify-between gap-2 text-xs bg-gray-50 rounded px-2 py-1.5">
              <span className="truncate text-gray-800">
                {it.bookName}{it.sku ? ` · ${t('orders.sku')}: ${it.sku}` : ''}
              </span>
              <span className="flex items-center gap-2 flex-shrink-0 text-gray-500">
                <span>×{it.quantity}</span>
                {it.arrived
                  ? <span className="text-green-600 font-semibold">{t('orders.arrived')} ✓</span>
                  : <span className="text-amber-600 font-semibold">{t('orders.pending')}</span>}
              </span>
            </div>
          ))}
          {!expanded && order.items.length > 3 && (
            <p className="text-xs text-gray-400 px-1">+{order.items.length - 3} נוספים</p>
          )}
        </div>
      )}

      <div className="flex items-center justify-center mt-1.5 text-gray-300 group-hover:text-primary transition-colors">
        <svg className={`w-4 h-4 transition-transform ${expanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {expanded && (
        <div className="mt-2 pt-3 border-t border-gray-100 space-y-3" onClick={(e) => e.stopPropagation()}>
          <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
            <span className="label mb-0">{t('orders.branch')}</span>
            <span className="text-xs text-gray-700 font-medium">{order.branchId?.name ?? '—'}</span>

            <span className="label mb-0">{t('orders.orderDate')}</span>
            <span className="text-xs text-gray-700">{formatDate(order.orderDate)}</span>

            <span className="label mb-0">{t('orders.orderedFrom')}</span>
            <span className="text-xs text-gray-700">{order.orderedFrom || '—'}</span>
          </div>

          {order.status === 'הגיע חלקית' && (
            <p className="text-xs font-medium text-status-partial">
              {order.items.filter((i) => i.arrived).length} מתוך {order.items.length} ספרים הגיעו
            </p>
          )}

          {order.notes && (
            <p className="text-xs text-gray-600 whitespace-pre-wrap">{order.notes}</p>
          )}

          <button
            onClick={(e) => { e.stopPropagation(); navigate(`/orders/${order._id}`); }}
            className="text-xs font-semibold text-primary hover:text-primary-dark flex items-center gap-1"
          >
            {t('orders.details')}
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      )}

      {expanded && !isTerminal && canWrite && (
        <div
          className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-2"
          onClick={(e) => e.stopPropagation()}
        >
          {nextStatus && (
            <div className="relative flex-1 flex">
              <button
                onClick={handleAdvanceClick}
                disabled={changing}
                title={`שנה סטטוס ל-${nextStatus}`}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-r-md rounded-l-none text-xs font-semibold transition-colors bg-primary text-white hover:bg-primary-dark"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                {nextStatus}
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setMenuOpen((o) => !o); }}
                disabled={changing}
                title="בחר סטטוס"
                className="flex-shrink-0 px-2 flex items-center justify-center rounded-l-md rounded-r-none border-r border-primary-dark/40 bg-primary text-white hover:bg-primary-dark transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={(e) => { e.stopPropagation(); setMenuOpen(false); }} />
                  <div className="absolute bottom-full mb-1 right-0 z-20 bg-white border border-gray-200 rounded-md shadow-lg py-1 w-40 max-h-56 overflow-y-auto">
                    {JUMPABLE_STATUSES.map((s) => (
                      <button
                        key={s}
                        onClick={(e) => handleJumpTo(e, s)}
                        disabled={s === order.status}
                        className={`w-full text-right px-3 py-1.5 text-xs transition-colors ${
                          s === order.status ? 'text-gray-400 cursor-default' : 'text-gray-700 hover:bg-primary/5'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
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
            <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto ${isCancelConfirm ? 'bg-red-100' : 'bg-primary/10'}`}>
              <svg className={`w-6 h-6 ${isCancelConfirm ? 'text-red-600' : 'text-primary'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isCancelConfirm ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                )}
              </svg>
            </div>
            <div>
              <p className={`font-semibold text-base ${isCancelConfirm ? 'text-red-700' : 'text-gray-800'}`}>
                {isCancelConfirm ? 'ביטול הזמנה' : 'שינוי סטטוס הזמנה'}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                להעביר את ההזמנה של <span className="font-medium text-gray-700">"{order.customerName}"</span> לסטטוס{' '}
                <span className={`font-semibold ${isCancelConfirm ? 'text-red-600' : 'text-primary'}`}>"{confirmStatus}"</span>?
              </p>
            </div>
            <div className="flex gap-3">
              <Button variant="secondary" className="flex-1" onClick={() => setConfirmStatus(null)}>ביטול</Button>
              <Button
                variant={isCancelConfirm ? 'dangerSolid' : 'primary'}
                className="flex-1"
                loading={changing}
                onClick={() => doStatusChange(confirmStatus)}
              >
                אישור
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
