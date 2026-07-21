import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getOrders } from '../api/orders';
import { getSettings } from '../api/settings';
import { Order, OrderStatus, ORDER_STATUSES } from '../types';
import { getAlertLevel, getAlertAgeDays, AlertLevel } from '../utils/alertLevel';
import OrderCard from '../components/orders/OrderCard';
import OrderAlertTable from '../components/orders/OrderAlertTable';
import Button from '../components/ui/Button';
import Spinner from '../components/ui/Spinner';

type CardColor = 'gray' | 'green' | 'red';

const colorMap: Record<CardColor, { border: string; num: string }> = {
  gray:  { border: 'border-r-gray-300', num: 'text-gray-700' },
  green: { border: 'border-r-primary',  num: 'text-primary' },
  red:   { border: 'border-r-red-400',  num: 'text-red-600' },
};

function StatCard({ label, value, color = 'gray' }: { label: string; value: number; color?: CardColor }) {
  const { border, num } = colorMap[color];
  return (
    <div className={`bg-white border border-gray-100 border-r-4 ${border} rounded-lg shadow-card px-3 py-1.5 flex flex-col items-center justify-center text-center`}>
      <p className="text-[10px] text-gray-400 font-medium">{label}</p>
      <p className={`text-lg font-bold leading-none ${num}`}>{value}</p>
    </div>
  );
}

const LEVEL_RANK: Record<AlertLevel, number> = { red: 2, yellow: 1, green: 0 };
const PAGE_SIZE = 25;

export default function Dashboard() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [thresholds, setThresholds] = useState({ notArrivedThresholdDays: 14, notCollectedThresholdDays: 14 });
  const [view, setView] = useState<'cards' | 'table'>('cards');
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
          notArrivedThresholdDays: settings.notArrivedThresholdDays,
          notCollectedThresholdDays: settings.notCollectedThresholdDays,
        });
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { setPage(1); }, [search, statusFilter, alertFilter, paidFilter, customerFilter]);

  const handleStatusChanged = (updated: Order) => {
    setOrders((prev) => prev.map((o) => (o._id === updated._id ? updated : o)));
  };

  const rows = useMemo(
    () => orders.map((order) => ({
      order,
      level: getAlertLevel(order, thresholds),
      age: getAlertAgeDays(order),
    })),
    [orders, thresholds]
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

  const total = orders.length;
  const alarms = orders.filter((o) => o.isNotArrived || o.isNotCollected).length;
  const totalPages = Math.max(1, Math.ceil(sortedRows.length / PAGE_SIZE));
  const pagedRows = sortedRows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  if (loading) return <Spinner />;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        <StatCard label={t('dashboard.totalOrders')} value={total} color="green" />
        <StatCard label={t('dashboard.alarms')} value={alarms} color="red" />
      </div>

      <div className="flex items-center gap-2 flex-wrap justify-between">
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
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
        <div className="flex items-center border border-gray-200 rounded-md overflow-hidden flex-shrink-0">
          <button
            onClick={() => setView('cards')}
            className={`px-3 py-1.5 text-sm transition-colors ${view === 'cards' ? 'bg-primary text-white' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            {t('orders.cardsView')}
          </button>
          <button
            onClick={() => setView('table')}
            className={`px-3 py-1.5 text-sm transition-colors ${view === 'table' ? 'bg-primary text-white' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            {t('orders.tableView')}
          </button>
        </div>
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
            {(search || statusFilter || alertFilter || paidFilter || customerFilter)
              ? t('orders.noResultsSearch')
              : 'אין הזמנות עדיין'}
          </h2>
        </div>
      ) : (
        <>
          {view === 'cards' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {pagedRows.map(({ order, level }) => (
                <OrderCard key={order._id} order={order} level={level} onStatusChanged={handleStatusChanged} />
              ))}
            </div>
          ) : (
            <OrderAlertTable rows={pagedRows} />
          )}

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
