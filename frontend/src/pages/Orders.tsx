import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getOrders } from '../api/orders';
import { getBranches } from '../api/branches';
import { Order, OrderFilters as OrderFiltersType, Branch } from '../types';
import OrderCard from '../components/orders/OrderCard';
import OrderTable from '../components/orders/OrderTable';
import OrderFiltersPanel from '../components/orders/OrderFilters';
import Button from '../components/ui/Button';
import Spinner from '../components/ui/Spinner';

export default function Orders() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [view, setView] = useState<'cards' | 'table'>('table');
  const [orders, setOrders] = useState<Order[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [branches, setBranches] = useState<Branch[]>([]);

  const alertParam = searchParams.get('alert') as 'notArrived' | 'notCollected' | null;

  const [filters, setFilters] = useState<OrderFiltersType>({
    page: 1,
    limit: 25,
    sortBy: 'createdAt',
    sortDir: 'desc',
    search: searchParams.get('search') ?? undefined,
    alert: alertParam ?? undefined,
  });

  useEffect(() => {
    getBranches().then(setBranches);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getOrders(filters);
      setOrders(result.data);
      setTotal(result.total);
      setTotalPages(result.totalPages);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { load(); }, [load]);

  const handleFilterChange = (updates: Partial<OrderFiltersType>) =>
    setFilters((f) => ({ ...f, ...updates }));

  const handleSort = (field: string) =>
    setFilters((f) => ({
      ...f,
      sortBy: field,
      sortDir: f.sortBy === field && f.sortDir === 'desc' ? 'asc' : 'desc',
      page: 1,
    }));

  const handleStatusChanged = (updated: Order) => {
    setOrders((prev) => prev.map((x) => x._id === updated._id ? updated : x));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end gap-2 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center border border-gray-200 rounded-md overflow-hidden">
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
          <Button onClick={() => navigate('/orders/new')} size="sm">
            + {t('nav.addOrder')}
          </Button>
        </div>
      </div>

      <OrderFiltersPanel filters={filters} onFilterChange={handleFilterChange} branches={branches} />

      {loading ? (
        <Spinner />
      ) : orders.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl mx-auto mb-4 flex items-center justify-center">
            <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-gray-700 mb-2">
            {filters.search || filters.status || filters.branchId ? t('orders.noResults') : 'אין הזמנות עדיין'}
          </h2>
          <p className="text-sm text-gray-400 mb-6">
            {filters.search || filters.status || filters.branchId
              ? 'נסה לשנות את הסינון'
              : 'הוסף את ההזמנה הראשונה כדי להתחיל'}
          </p>
          {!filters.search && !filters.status && !filters.branchId && (
            <Button onClick={() => navigate('/orders/new')} size="lg">
              + הוספת הזמנה ראשונה
            </Button>
          )}
        </div>
      ) : (
        <>
          <p className="text-sm text-gray-500">{total} הזמנות</p>

          {view === 'cards' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {orders.map((o) => (
                <OrderCard key={o._id} order={o} onStatusChanged={handleStatusChanged} />
              ))}
            </div>
          ) : (
            <OrderTable
              orders={orders}
              sortBy={filters.sortBy ?? 'createdAt'}
              sortDir={filters.sortDir ?? 'desc'}
              onSort={handleSort}
            />
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <Button
                variant="secondary"
                size="sm"
                disabled={filters.page <= 1}
                onClick={() => handleFilterChange({ page: filters.page - 1 })}
              >
                הקודם
              </Button>
              <span className="text-sm text-gray-600">
                {t('orders.page')} {filters.page} {t('orders.of')} {totalPages}
              </span>
              <Button
                variant="secondary"
                size="sm"
                disabled={filters.page >= totalPages}
                onClick={() => handleFilterChange({ page: filters.page + 1 })}
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
