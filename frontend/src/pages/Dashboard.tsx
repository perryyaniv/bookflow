import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getOrders } from '../api/orders';
import { getSettings } from '../api/settings';
import { Order, OrderStatus, ORDER_STATUSES } from '../types';
import { getAlertLevel, getAlertAgeDays, AlertLevel } from '../utils/alertLevel';
import { useAuth } from '../contexts/AuthContext';
import { hasWriteAccess } from '../utils/roles';
import OrderCard from '../components/orders/OrderCard';
import Button from '../components/ui/Button';
import Spinner from '../components/ui/Spinner';

type CardColor = 'gray' | 'green' | 'red';

const colorMap: Record<CardColor, { border: string; num: string }> = {
  gray:  { border: 'border-r-gray-300', num: 'text-gray-700' },
  green: { border: 'border-r-primary',  num: 'text-primary' },
  red:   { border: 'border-r-red-400',  num: 'text-red-600' },
};

function StatCard({ label, value, color = 'gray', selected, onClick }: {
  label: string;
  value: number;
  color?: CardColor;
  selected?: boolean;
  onClick?: () => void;
}) {
  const { border, num } = colorMap[color];
  return (
    <button
      onClick={onClick}
      className={`relative bg-white border border-gray-100 border-r-4 ${border} rounded-lg shadow-card px-3 py-1.5 flex flex-col items-center justify-center text-center transition-colors hover:bg-gray-50`}
    >
      {selected && (
        <span className="absolute top-1 right-1 w-3.5 h-3.5 rounded-full bg-primary text-white flex items-center justify-center">
          <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </span>
      )}
      <p className="text-[10px] text-gray-400 font-medium">{label}</p>
      <p className={`text-lg font-bold leading-none ${num}`}>{value}</p>
    </button>
  );
}

const LEVEL_RANK: Record<AlertLevel, number> = { red: 2, yellow: 1, green: 0 };
const PAGE_SIZE = 25;
const HIDDEN_BY_DEFAULT_STATUSES: OrderStatus[] = ['בוטל', 'נאסף'];

export default function Dashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const canWrite = hasWriteAccess(user?.role);
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [thresholds, setThresholds] = useState({ notOrderedThresholdDays: 3, notArrivedThresholdDays: 14, notCollectedThresholdDays: 14 });
  const [scope, setScope] = useState<'inProgress' | 'all' | 'alerts'>('inProgress');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [search, setSearch] = useState(searchParams.get('search') ?? '');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | ''>('');
  const [alertFilter, setAlertFilter] = useState<'' | 'alert' | 'none'>('');
  const [paidFilter, setPaidFilter] = useState<'' | 'true' | 'false'>('');
  const [customerFilter, setCustomerFilter] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    setSearch(searchParams.get('search') ?? '');
  }, [searchParams]);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      getOrders({ page: 1, limit: 500, sortBy: 'createdAt', sortDir: 'desc' }),
      getSettings(),
    ])
      .then(([ordersRes, settings]) => {
        setOrders(ordersRes.data);
        setThresholds({
          notOrderedThresholdDays: settings.notOrderedThresholdDays,
          notArrivedThresholdDays: settings.notArrivedThresholdDays,
          notCollectedThresholdDays: settings.notCollectedThresholdDays,
        });
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { setPage(1); }, [search, statusFilter, alertFilter, paidFilter, customerFilter, scope]);

  const handleStatusChanged = (updated: Order) => {
    setOrders((prev) => prev.map((o) => (o._id === updated._id ? updated : o)));
  };

  const visibleOrders = useMemo(() => {
    if (scope === 'all') return orders;
    if (scope === 'alerts') return orders.filter((o) => o.isNotOrdered || o.isNotArrived || o.isNotCollected);
    return orders.filter((o) => !HIDDEN_BY_DEFAULT_STATUSES.includes(o.status));
  }, [orders, scope]);

  const rows = useMemo(
    () => visibleOrders.map((order) => ({
      order,
      level: getAlertLevel(order, thresholds),
      age: getAlertAgeDays(order),
    })),
    [visibleOrders, thresholds]
  );

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    const nameQ = customerFilter.trim().toLowerCase();
    return rows.filter(({ order, level }) => {
      if (statusFilter && order.status !== statusFilter) return false;
      if (paidFilter && String(order.isPaid) !== paidFilter) return false;
      if (alertFilter === 'alert' && level === 'green') return false;
      if (alertFilter === 'none' && level !== 'green') return false;
      if (nameQ && !order.customerName.toLowerCase().includes(nameQ)) return false;
      if (!q) return true;
      const haystack = [
        order.customerName,
        order.customerPhone,
        order.orderedFrom,
        order.status,
        order.isPaid ? 'שולם' : 'לא שולם',
        order.branchId?.name,
        order.notes,
        ...(order.items?.flatMap((it) => [it.bookName, it.sku]) ?? []),
      ].filter(Boolean).join(' ').toLowerCase();
      return haystack.includes(q);
    });
  }, [rows, search, statusFilter, alertFilter, paidFilter, customerFilter]);

  const sortedRows = useMemo(() => {
    return [...filteredRows].sort((a, b) => {
      if (LEVEL_RANK[b.level] !== LEVEL_RANK[a.level]) return LEVEL_RANK[b.level] - LEVEL_RANK[a.level];
      if (a.level !== 'green') return b.age - a.age;
      return new Date(b.order.statusChangedAt).getTime() - new Date(a.order.statusChangedAt).getTime();
    });
  }, [filteredRows]);

  const activeOrders = useMemo(
    () => orders.filter((o) => !HIDDEN_BY_DEFAULT_STATUSES.includes(o.status)),
    [orders]
  );
  const total = activeOrders.length;
  const alarms = activeOrders.filter((o) => o.isNotOrdered || o.isNotArrived || o.isNotCollected).length;
  const totalPages = Math.max(1, Math.ceil(sortedRows.length / PAGE_SIZE));
  const pagedRows = sortedRows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  if (loading) return <Spinner />;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2">
        <StatCard
          label={t('orders.scopeInProgress')}
          value={total}
          color="green"
          selected={scope === 'inProgress'}
          onClick={() => setScope('inProgress')}
        />
        <StatCard
          label={t('orders.scopeAlerts')}
          value={alarms}
          color="red"
          selected={scope === 'alerts'}
          onClick={() => setScope('alerts')}
        />
        <StatCard
          label={t('orders.scopeAll')}
          value={orders.length}
          color="gray"
          selected={scope === 'all'}
          onClick={() => setScope('all')}
        />
      </div>

      <div className="flex items-center gap-2">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('common.search')}
          className="input flex-1"
        />
        <button
          onClick={() => setFiltersOpen((o) => !o)}
          title={t('orders.filters')}
          aria-label={t('orders.filters')}
          className={`flex-shrink-0 p-2 rounded-md border transition-colors ${filtersOpen ? 'bg-primary text-white border-primary' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h18M6 9h12M10 14h4" />
          </svg>
        </button>
      </div>

      {filtersOpen && (
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as OrderStatus | '')}
            className="input w-auto"
          >
            <option value="">{t('orders.filterAllStatuses')}</option>
            {ORDER_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <select
            value={alertFilter}
            onChange={(e) => setAlertFilter(e.target.value as '' | 'alert' | 'none')}
            className="input w-auto"
          >
            <option value="">{t('orders.filterAllAlerts')}</option>
            <option value="alert">{t('orders.filterHasAlert')}</option>
            <option value="none">{t('orders.filterNoAlert')}</option>
          </select>
          <select
            value={paidFilter}
            onChange={(e) => setPaidFilter(e.target.value as '' | 'true' | 'false')}
            className="input w-auto"
          >
            <option value="">{t('orders.filterAllPaid')}</option>
            <option value="true">{t('orders.paid')}</option>
            <option value="false">{t('orders.unpaid')}</option>
          </select>
          <input
            value={customerFilter}
            onChange={(e) => setCustomerFilter(e.target.value)}
            placeholder={t('orders.customerName')}
            className="input w-auto min-w-[140px]"
          />
        </div>
      )}

      {sortedRows.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl mx-auto mb-4 flex items-center justify-center">
            <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-gray-700">
            {orders.length === 0 ? 'אין הזמנות עדיין' : t('orders.noResultsSearch')}
          </h2>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {pagedRows.map(({ order, level }) => (
              <OrderCard key={order._id} order={order} level={level} canWrite={canWrite} onStatusChanged={handleStatusChanged} />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <Button
                variant="secondary"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                הקודם
              </Button>
              <span className="text-sm text-gray-600">
                {t('orders.page')} {page} {t('orders.of')} {totalPages}
              </span>
              <Button
                variant="secondary"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                הבא
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
