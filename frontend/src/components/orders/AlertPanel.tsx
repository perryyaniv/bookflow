import { useNavigate } from 'react-router-dom';
import { Order } from '../../types';
import { formatDate } from '../../utils/date';

interface Props {
  title: string;
  orders: Order[];
  emptyText: string;
  viewAllTo: string;
  tone: 'red' | 'amber';
}

const toneClasses = {
  red: { icon: 'text-red-500 bg-red-100', border: 'border-r-red-400' },
  amber: { icon: 'text-amber-600 bg-amber-100', border: 'border-r-amber-400' },
};

export default function AlertPanel({ title, orders, emptyText, viewAllTo, tone }: Props) {
  const navigate = useNavigate();
  const cfg = toneClasses[tone];

  return (
    <div className={`bg-white border border-gray-200 border-r-4 ${cfg.border} rounded-lg shadow-card p-4`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${cfg.icon}`}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
            </svg>
          </span>
          <h3 className="font-bold text-gray-800 text-sm">{title}</h3>
        </div>
        <span className="text-xs font-semibold text-gray-400">{orders.length}</span>
      </div>

      {orders.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-4">{emptyText}</p>
      ) : (
        <div className="space-y-1.5">
          {orders.slice(0, 5).map((o) => (
            <button
              key={o._id}
              onClick={() => navigate(`/orders/${o._id}`)}
              className="w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-md hover:bg-gray-50 transition-colors text-right"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">{o.customerName}</p>
                <p className="text-xs text-gray-400">{o.branchId?.name ?? '—'}</p>
              </div>
              <span className="text-xs text-gray-400 flex-shrink-0">{formatDate(o.orderedAt ?? o.customerNotifiedAt)}</span>
            </button>
          ))}
          {orders.length > 5 && (
            <button
              onClick={() => navigate(viewAllTo)}
              className="w-full text-center text-xs text-primary font-medium hover:underline pt-1"
            >
              הצג הכל ({orders.length})
            </button>
          )}
        </div>
      )}
    </div>
  );
}
