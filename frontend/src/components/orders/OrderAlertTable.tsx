import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Order } from '../../types';
import { AlertLevel } from '../../utils/alertLevel';
import { formatDate } from '../../utils/date';

interface Row {
  order: Order;
  level: AlertLevel;
}

interface Props {
  rows: Row[];
}

const LEVEL_DOT: Record<AlertLevel, string> = {
  red: 'bg-red-500',
  yellow: 'bg-amber-400',
  green: 'bg-primary',
};

function bookNames(order: Order): string {
  const names = order.items?.map((it) => it.bookName).filter(Boolean) ?? [];
  if (names.length === 0) return '—';
  if (names.length <= 2) return names.join(', ');
  return `${names.slice(0, 2).join(', ')} +${names.length - 2}`;
}

export default function OrderAlertTable({ rows }: Props) {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const th = (label: string, extra = '') => (
    <th className={`px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide ${extra}`}>
      {label}
    </th>
  );

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            {th('', 'w-8')}
            {th(t('orders.customerName'))}
            {th(t('orders.bookName'), 'hidden sm:table-cell')}
            {th(t('orders.isPaid'))}
            {th(t('orders.lastStatusChange'), 'hidden sm:table-cell')}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {rows.map(({ order, level }) => (
            <tr
              key={order._id}
              onClick={() => navigate(`/orders/${order._id}`)}
              className="hover:bg-primary/5 cursor-pointer transition-colors"
            >
              <td className="px-4 py-3">
                <span className={`inline-block w-2.5 h-2.5 rounded-full ${LEVEL_DOT[level]}`} />
              </td>
              <td className="px-4 py-3 font-medium text-gray-900">{order.customerName}</td>
              <td className="px-4 py-3 text-gray-600 hidden sm:table-cell">{bookNames(order)}</td>
              <td className="px-4 py-3">
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${order.isPaid ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                  {order.isPaid ? t('orders.paid') : t('orders.unpaid')}
                </span>
              </td>
              <td className="px-4 py-3 text-gray-600 whitespace-nowrap hidden sm:table-cell">
                {formatDate(order.statusChangedAt)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
