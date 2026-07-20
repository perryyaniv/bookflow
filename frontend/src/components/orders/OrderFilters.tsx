import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { OrderFilters as OrderFiltersType } from '../../types';
import { type OrderStatus, type Branch, ORDER_STATUSES } from '../../types';

interface Props {
  filters: OrderFiltersType;
  onFilterChange: (filters: Partial<OrderFiltersType>) => void;
  branches: Branch[];
}

const selectCls = 'input py-1.5 text-sm';

export default function OrderFilters({ filters, onFilterChange, branches }: Props) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  const activeCount = [filters.branchId, filters.status, filters.isPaid !== undefined ? 'x' : undefined].filter(Boolean).length;

  const clearAll = () => onFilterChange({
    branchId: undefined, status: undefined, isPaid: undefined, page: 1,
  });

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center gap-2 px-3 py-2 rounded-md border text-sm font-medium transition-colors ${
          open || activeCount > 0
            ? 'bg-primary text-white border-primary'
            : 'bg-white text-gray-600 border-gray-200 hover:border-primary hover:text-primary'
        }`}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
        </svg>
        {t('orders.filters')}
        {activeCount > 0 && (
          <span className="text-xs font-bold px-1.5 py-0.5 rounded-full bg-white text-primary">
            {activeCount}
          </span>
        )}
        <svg className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute top-full mt-2 right-0 z-20 card p-4 bg-white min-w-[280px] shadow-lg">
            <div className="grid grid-cols-1 gap-3">
              <div>
                <label className="label">{t('orders.branch')}</label>
                <select value={filters.branchId ?? ''} onChange={(e) => onFilterChange({ branchId: e.target.value || undefined, page: 1 })} className={selectCls}>
                  <option value="">הכל</option>
                  {branches.map((b) => <option key={b._id} value={b._id}>{b.name}</option>)}
                </select>
              </div>
              <div>
                <label className="label">{t('orders.status')}</label>
                <select value={filters.status ?? ''} onChange={(e) => onFilterChange({ status: (e.target.value as OrderStatus) || undefined, page: 1 })} className={selectCls}>
                  <option value="">הכל</option>
                  {ORDER_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="label">{t('orders.isPaid')}</label>
                <select
                  value={filters.isPaid === undefined ? '' : String(filters.isPaid)}
                  onChange={(e) => onFilterChange({ isPaid: e.target.value === '' ? undefined : e.target.value === 'true', page: 1 })}
                  className={selectCls}
                >
                  <option value="">הכל</option>
                  <option value="true">{t('orders.paid')}</option>
                  <option value="false">{t('orders.unpaid')}</option>
                </select>
              </div>
            </div>
            {activeCount > 0 && (
              <div className="mt-3 flex justify-end border-t border-gray-100 pt-3">
                <button onClick={clearAll} className="text-xs text-gray-400 hover:text-red-500 transition-colors">
                  נקה הכל
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {!open && activeCount > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap mt-1">
          {filters.status && (
            <span className="flex items-center gap-1 text-xs bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-full">
              {filters.status}
              <button onClick={() => onFilterChange({ status: undefined, page: 1 })} className="hover:text-red-500">×</button>
            </span>
          )}
          {filters.branchId && (
            <span className="flex items-center gap-1 text-xs bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-full">
              {branches.find((b) => b._id === filters.branchId)?.name ?? 'סניף'}
              <button onClick={() => onFilterChange({ branchId: undefined, page: 1 })} className="hover:text-red-500">×</button>
            </span>
          )}
          {filters.isPaid !== undefined && (
            <span className="flex items-center gap-1 text-xs bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-full">
              {filters.isPaid ? t('orders.paid') : t('orders.unpaid')}
              <button onClick={() => onFilterChange({ isPaid: undefined, page: 1 })} className="hover:text-red-500">×</button>
            </span>
          )}
          <button onClick={clearAll} className="text-xs text-gray-400 hover:text-red-500 transition-colors">נקה הכל</button>
        </div>
      )}
    </div>
  );
}
