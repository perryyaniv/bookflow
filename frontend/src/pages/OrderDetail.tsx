import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getOrder, updateOrder, deleteOrder, setItemArrived } from '../api/orders';
import { getSettings } from '../api/settings';
import { Order } from '../types';
import { StatusBadge } from '../components/ui/Badge';
import OrderForm from '../components/orders/OrderForm';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Spinner from '../components/ui/Spinner';
import { getAuditLog } from '../api/auditLog';
import { AuditLogEntry } from '../types';
import { io } from 'socket.io-client';
import { formatDate, formatDateTime } from '../utils/date';
import { AlertLevel, getAlertLevel, getAlertText } from '../utils/alertLevel';
import { hasWriteAccess } from '../utils/roles';
import { supportsPartialArrival } from '../utils/orderRules';

const ALERT_ICON_COLOR: Record<AlertLevel, string> = {
  red: 'text-red-600',
  yellow: 'text-amber-600',
  green: '',
};

type Tab = 'details' | 'history';

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="py-2 border-b border-gray-50 last:border-0">
      <span className="label mb-0.5 text-[10px]">{label}</span>
      <span className="text-sm text-gray-800 font-medium block leading-snug">{value ?? '—'}</span>
    </div>
  );
}

export default function OrderDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { t } = useTranslation();
  const { user } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [tab, setTab] = useState<Tab>('details');
  const [editing, setEditing] = useState(() => hasWriteAccess(user?.role) && searchParams.get('edit') === '1');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [history, setHistory] = useState<AuditLogEntry[]>([]);
  const [liveAlert, setLiveAlert] = useState('');
  const [thresholds, setThresholds] = useState({ notArrivedThresholdDays: 14, notCollectedThresholdDays: 14 });

  const { showToast } = useToast();
  const isAdmin = user?.role === 'admin';
  const canWrite = hasWriteAccess(user?.role);

  useEffect(() => {
    if (!id) return;
    getOrder(id).then(setOrder).finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    getSettings().then((s) => setThresholds({
      notArrivedThresholdDays: s.notArrivedThresholdDays,
      notCollectedThresholdDays: s.notCollectedThresholdDays,
    }));
  }, []);

  useEffect(() => {
    if (!order?.branchId?._id) return;
    const socket = io('', { path: '/socket.io' });
    socket.emit('join-branch', order.branchId._id);
    socket.on('order-updated', (updated: Order) => {
      if (updated._id !== id) return;
      setOrder(updated);
      setLiveAlert('ההזמנה עודכנה על ידי משתמש אחר');
      setTimeout(() => setLiveAlert(''), 5000);
    });
    return () => { socket.emit('leave-branch', order.branchId._id); socket.disconnect(); };
  }, [order?.branchId?._id, id]);

  useEffect(() => {
    if (tab === 'history' && id) {
      getAuditLog({ orderId: id, limit: 100 }).then((r) => setHistory(r.data));
    }
  }, [tab, id]);

  const handleSave = async (data: Record<string, unknown>) => {
    if (!id) return;
    setSaving(true);
    try {
      const updated = await updateOrder(id, data);
      setOrder(updated);
      setEditing(false);
      showToast('ההזמנה נשמרה בהצלחה', 'success');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    await deleteOrder(id);
    navigate('/orders');
  };

  const handleToggleArrived = async (index: number, arrived: boolean) => {
    if (!id) return;
    const updated = await setItemArrived(id, index, arrived);
    setOrder(updated);
  };

  if (loading) return <Spinner />;
  if (!order) return <div className="text-center py-16 text-gray-400">הזמנה לא נמצאה</div>;

  const alertLevel = getAlertLevel(order, thresholds);
  const alertMsg = getAlertText(order, alertLevel, t);

  const TABS: { key: Tab; label: string }[] = [
    { key: 'details', label: t('orders.details') },
    ...(isAdmin ? [{ key: 'history' as Tab, label: t('orders.history') }] : []),
  ];

  return (
    <div className="space-y-3">
      {liveAlert && (
        <div className="bg-amber-50 border border-amber-300 text-amber-800 text-sm px-4 py-2.5 rounded-md">
          {liveAlert}
        </div>
      )}

      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <button
              onClick={() => navigate('/orders')}
              className="text-gray-400 hover:text-primary flex-shrink-0"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-lg sm:text-xl font-bold text-dark truncate">{order.customerName}</h1>
            <StatusBadge status={order.status} />
            {alertMsg && (
              <span className={`flex items-center gap-1 text-xs font-bold flex-shrink-0 ${ALERT_ICON_COLOR[alertLevel]}`}>
                <svg className="w-4 h-4 flex-shrink-0 animate-breathe" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                </svg>
                {alertMsg}
              </span>
            )}
          </div>
          <p className="text-xs text-gray-400 mr-7">{order.customerPhone}</p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {!editing && canWrite && <Button size="sm" onClick={() => setEditing(true)}>{t('orders.edit')}</Button>}
          {canWrite && (
            <Button variant="danger" size="sm" onClick={() => setDeleteModal(true)}>{t('orders.delete')}</Button>
          )}
        </div>
      </div>

      <div className="flex border-b border-gray-200 overflow-x-auto">
        {TABS.map((tab_) => (
          <button
            key={tab_.key}
            onClick={() => { setTab(tab_.key); setEditing(false); }}
            className={`px-4 py-2.5 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors -mb-px flex-shrink-0 ${
              tab === tab_.key
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            {tab_.label}
          </button>
        ))}
      </div>

      <div className="card p-4 sm:p-5">
        {tab === 'details' && (
          editing ? (
            <OrderForm initial={order} onSubmit={handleSave} onCancel={() => setEditing(false)} loading={saving} isEdit />
          ) : (
            <div className="space-y-5">
              <div>
                <p className="section-title mb-3">פרטי הזמנה</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4">
                  <DetailRow label={t('orders.customerName')} value={order.customerName} />
                  <DetailRow label={t('orders.customerPhone')} value={order.customerPhone} />
                  <DetailRow label={t('orders.branch')} value={order.branchId?.name} />
                  <DetailRow label={t('orders.orderDate')} value={formatDate(order.orderDate)} />
                  <DetailRow label={t('orders.orderedFrom')} value={order.orderedFrom} />
                  <DetailRow label={t('orders.status')} value={<StatusBadge status={order.status} />} />
                  <DetailRow label={t('orders.isPaid')} value={
                    <span className={`font-bold ${order.isPaid ? 'text-primary' : 'text-red-500 animate-breathe'}`}>
                      {order.isPaid ? t('orders.paid') : t('orders.unpaid')}
                    </span>
                  } />
                  <DetailRow label={t('orders.orderedAt')} value={formatDate(order.orderedAt)} />
                  <DetailRow label={t('orders.customerNotifiedAt')} value={formatDate(order.customerNotifiedAt)} />
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100">
                <p className="section-title mb-3">{t('orders.items')}</p>
                <div className="overflow-x-auto rounded-md border border-gray-100">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-right text-xs font-semibold text-gray-500">{t('orders.bookName')}</th>
                        <th className="px-3 py-2 text-right text-xs font-semibold text-gray-500">{t('orders.sku')}</th>
                        <th className="px-3 py-2 text-right text-xs font-semibold text-gray-500">{t('orders.quantity')}</th>
                        <th className="px-3 py-2 text-right text-xs font-semibold text-gray-500">{t('orders.arrived')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {order.items.map((it, idx) => (
                        <tr key={idx} className={it.arrived ? 'bg-primary/5' : undefined}>
                          <td className="px-3 py-2 text-gray-800">{it.bookName}</td>
                          <td className="px-3 py-2 text-gray-500">{it.sku || '—'}</td>
                          <td className="px-3 py-2 text-gray-800">{it.quantity}</td>
                          <td className="px-3 py-2">
                            <input
                              type="checkbox"
                              checked={it.arrived}
                              disabled={order.status === 'הלקוח עודכן' || order.status === 'נאסף' || order.status === 'בוטל' || !canWrite || !supportsPartialArrival(order.items.length)}
                              onChange={(e) => handleToggleArrived(idx, e.target.checked)}
                              className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary disabled:opacity-50"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {order.notes && (
                <div className="pt-4 border-t border-gray-100">
                  <p className="section-title">{t('orders.notes')}</p>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{order.notes}</p>
                </div>
              )}
            </div>
          )
        )}

        {tab === 'history' && (
          <div className="space-y-2">
            {history.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">{t('common.noData')}</p>
            ) : history.map((entry) => (
              <div key={entry._id} className="py-2.5 border-b border-gray-50 last:border-0">
                <p className="text-sm text-gray-800">
                  <span className="font-semibold">{entry.userName}</span> — {entry.action}
                  {entry.fieldChanged && (
                    <span className="text-gray-500 text-xs block mt-0.5">
                      {entry.fieldChanged}: {entry.oldValue} → {entry.newValue}
                    </span>
                  )}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">{formatDateTime(entry.timestamp)}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal open={deleteModal} onClose={() => setDeleteModal(false)} title={t('common.areYouSure')} size="sm">
        <p className="text-sm text-gray-600 mb-4">{t('orders.deleteConfirm')}</p>
        <div className="flex gap-3 justify-end">
          <Button variant="secondary" onClick={() => setDeleteModal(false)}>{t('common.cancel')}</Button>
          <Button variant="danger" onClick={handleDelete}>{t('orders.delete')}</Button>
        </div>
      </Modal>
    </div>
  );
}
