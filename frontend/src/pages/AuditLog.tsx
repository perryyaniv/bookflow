import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { getAuditLog } from '../api/auditLog';
import { AuditLogEntry } from '../types';
import Spinner from '../components/ui/Spinner';
import Button from '../components/ui/Button';
import { formatDate, formatDateTime } from '../utils/date';

const FIELD_LABELS: Record<string, string> = {
  status: 'סטטוס',
  isPaid: 'שולם',
  orderedFrom: 'הוזמן מ',
  customerName: 'שם הלקוח',
  customerPhone: 'טלפון',
  orderDate: 'תאריך הזמנה',
};

function formatFieldValue(field: string, value?: string): string {
  if (!value || value === 'undefined' || value === 'null') return '—';
  if (field === 'isPaid') return value === 'true' ? 'כן' : 'לא';
  if (field === 'orderDate') {
    const d = new Date(value);
    if (!isNaN(d.getTime())) return formatDate(d);
  }
  return value;
}

export default function AuditLog() {
  const { t } = useTranslation();
  const [entries, setEntries] = useState<AuditLogEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [inputSearch, setInputSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getAuditLog({ page, limit: 50, search: search || undefined });
      setEntries(result.data);
      setTotal(result.total);
      setTotalPages(result.totalPages);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => { load(); }, [load]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(inputSearch);
    setPage(1);
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          value={inputSearch}
          onChange={(e) => setInputSearch(e.target.value)}
          placeholder={t('auditLog.search')}
          className="flex-1 border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
        <Button type="submit" size="sm">{t('common.search')}</Button>
        {search && (
          <Button type="button" variant="ghost" size="sm" onClick={() => { setSearch(''); setInputSearch(''); setPage(1); }}>
            נקה
          </Button>
        )}
      </form>

      <div className="text-sm text-gray-500">{total} רשומות</div>

      {loading ? (
        <Spinner />
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">{t('auditLog.timestamp')}</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">{t('auditLog.user')}</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">{t('auditLog.action')}</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">{t('auditLog.field')}</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">{t('auditLog.oldValue')}</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">{t('auditLog.newValue')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {entries.map((e) => (
                <tr key={e._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap text-xs">
                    {formatDateTime(e.timestamp)}
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-800">{e.userName}</td>
                  <td className="px-4 py-3 text-gray-600">{e.action}</td>
                  <td className="px-4 py-3 text-gray-500">{e.fieldChanged ? (FIELD_LABELS[e.fieldChanged] ?? e.fieldChanged) : '—'}</td>
                  <td className="px-4 py-3 text-gray-500 max-w-[120px] truncate">{formatFieldValue(e.fieldChanged ?? '', e.oldValue)}</td>
                  <td className="px-4 py-3 text-gray-700 max-w-[120px] truncate">{formatFieldValue(e.fieldChanged ?? '', e.newValue)}</td>
                </tr>
              ))}
              {entries.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-gray-400">{t('common.noData')}</td>
                </tr>
              )}
            </tbody>
          </table>
          </div>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>הקודם</Button>
          <span className="text-sm text-gray-600">{page} / {totalPages}</span>
          <Button variant="secondary" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>הבא</Button>
        </div>
      )}
    </div>
  );
}
