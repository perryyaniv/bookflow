import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { getOrders } from '../api/orders';
import { Order } from '../types';
import AlertPanel from '../components/orders/AlertPanel';
import Spinner from '../components/ui/Spinner';

type CardColor = 'gray' | 'green' | 'blue' | 'red';

const colorMap: Record<CardColor, { border: string; num: string }> = {
  gray:  { border: 'border-r-gray-300',  num: 'text-gray-700' },
  green: { border: 'border-r-green-400', num: 'text-green-700' },
  blue:  { border: 'border-r-primary',   num: 'text-primary' },
  red:   { border: 'border-r-red-400',   num: 'text-red-600' },
};

function StatCard({ label, value, color = 'gray' }: { label: string; value: number; color?: CardColor }) {
  const { border, num } = colorMap[color];
  return (
    <div className={`bg-white border border-gray-100 border-r-4 ${border} rounded-lg shadow-card px-3 py-3 flex flex-col items-center justify-center text-center`}>
      <p className={`text-lg font-bold leading-none ${num}`}>{value}</p>
      <p className="text-[10px] text-gray-400 font-medium mt-0.5">{label}</p>
    </div>
  );
}

export default function Dashboard() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [notArrived, setNotArrived] = useState<Order[]>([]);
  const [notCollected, setNotCollected] = useState<Order[]>([]);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      getOrders({ page: 1, limit: 500, sortBy: 'createdAt', sortDir: 'desc' }),
      getOrders({ page: 1, limit: 100, alert: 'notArrived' }),
      getOrders({ page: 1, limit: 100, alert: 'notCollected' }),
    ])
      .then(([all, arrived, collected]) => {
        setAllOrders(all.data);
        setNotArrived(arrived.data);
        setNotCollected(collected.data);
      })
      .finally(() => setLoading(false));
  }, []);

  const total = allOrders.length;
  const open = allOrders.filter((o) => o.status !== 'נאסף' && o.status !== 'בוטל').length;

  if (loading) return <Spinner />;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-2">
        <StatCard label={t('dashboard.totalOrders')} value={total} color="gray" />
        <StatCard label={t('dashboard.openOrders')} value={open} color="blue" />
        <StatCard label={t('dashboard.notArrived')} value={notArrived.length} color="red" />
        <StatCard label={t('dashboard.notCollected')} value={notCollected.length} color="red" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <AlertPanel
          title={t('dashboard.urgentNotArrived')}
          orders={notArrived}
          emptyText="אין הזמנות שמאחרות"
          viewAllTo="/orders?alert=notArrived"
          tone="red"
        />
        <AlertPanel
          title={t('dashboard.urgentNotCollected')}
          orders={notCollected}
          emptyText="אין הזמנות שמאחרות"
          viewAllTo="/orders?alert=notCollected"
          tone="amber"
        />
      </div>
    </div>
  );
}
