import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Order } from '../../types';
import { StatusBadge } from '../ui/Badge';
import { formatDate } from '../../utils/date';

interface Props {
  orders: Order[];
  sortBy: string;
  sortDir: 'asc' | 'desc';
  onSort: (field: string) => void;
}

function SortIcon({ active, dir }: { active: boolean; dir: 'asc' | 'desc' }) {
  return (
    <svg className={`w-3.5 h-3.5 inline mr-1 ${active ? 'text-primary' : 'text-gray-300'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      {dir === 'asc' && active
        ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
        : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />}
    </svg>
  );
}

export default function OrderTable({ orders, sortBy, sortDir, onSort }: Props) {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const th = (label: string, field?: string, extra = '') => (
    <th
      className={`px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide ${field ? 'cursor-pointer hover:text-gray-800 select-none' : ''} ${extra}`}
      onClick={field ? () => onSort(field) : undefined}
    >
      {field && <SortIcon active={sortBy === field} dir={sortDir} />}
      {label}
    </th>
  );

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            {th(t('orders.customerName'), 'customerName')}
            {th(t('orders.customerPhone'), undefined, 'hidden sm:table-cell')}
            {th(t('orders.branch'), undefined, 'hidden md:table-cell')}
            {th(t('orders.status'), 'status')}
            {th(t('orders.orderDate'), 'orderDate', 'hidden sm:table-cell')}
            {th(t('orders.items'), undefined, 'hidden lg:table-cell')}
            {th(t('orders.isPaid'), undefined, 'hidden md:table-cell')}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {orders.map((order) => (
            <tr
              key={order._id}
              onClick={() => navigate(`/orders/${order._id}`)}
              className="hover:bg-primary/5 cursor-pointer transition-colors"
            >
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  {(order.isNotArrived || order.isNotCollected) && (
                    <span className="text-red-400 text-sm font-medium flex-shrink-0 leading-none" title={order.isNotArrived ? t('orders.notArrived') : t('orders.notCollected')}>⚠</span>
                  )}
                  <span className="font-medium text-gray-900">{order.customerName}</span>
                </div>
              </td>
              <td className="px-4 py-3 text-gray-600 hidden sm:table-cell">{order.customerPhone}</td>
              <td className="px-4 py-3 text-gray-600 hidden md:table-cell">{order.branchId?.name ?? '—'}</td>
              <td className="px-4 py-3"><StatusBadge status={order.status} /></td>
              <td className="px-4 py-3 text-gray-600 whitespace-nowrap hidden sm:table-cell">{formatDate(order.orderDate)}</td>
              <td className="px-4 py-3 text-gray-600 hidden lg:table-cell">
                {order.items?.map((it) => it.bookName).join(', ') || '—'}
              </td>
              <td className="px-4 py-3 hidden md:table-cell">
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${order.isPaid ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                  {order.isPaid ? t('orders.paid') : t('orders.unpaid')}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
