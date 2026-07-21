import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Order, OrderStatus, OrderItem, Branch, ORDER_STATUSES } from '../../types';
import { getBranches } from '../../api/branches';
import { getSettings } from '../../api/settings';
import { isValidIsraeliPhone } from '../../utils/phone';
import { supportsPartialArrival } from '../../utils/orderRules';
import Button from '../ui/Button';
import DateInput from '../ui/DateInput';

type FormData = {
  customerName: string;
  customerPhone: string;
  branchId: string;
  orderDate: string;
  orderedFrom: string;
  isPaid: boolean;
  status: OrderStatus;
  notes: string;
  items: OrderItem[];
};

interface Props {
  initial?: Partial<Order>;
  onSubmit: (data: Record<string, unknown>) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
  isEdit?: boolean;
}

function toForm(order?: Partial<Order>): FormData {
  return {
    customerName: order?.customerName ?? '',
    customerPhone: order?.customerPhone ?? '',
    branchId: (order?.branchId as Branch)?._id ?? (order?.branchId as unknown as string) ?? '',
    orderDate: order?.orderDate ? order.orderDate.slice(0, 10) : new Date().toISOString().slice(0, 10),
    orderedFrom: order?.orderedFrom ?? '',
    isPaid: order?.isPaid ?? false,
    status: order?.status ?? 'נוצר',
    notes: order?.notes ?? '',
    items: order?.items?.length ? order.items : [{ bookName: '', sku: '', quantity: 1, arrived: false }],
  };
}

export default function OrderForm({ initial, onSubmit, onCancel, loading, isEdit }: Props) {
  const { t } = useTranslation();
  const [form, setForm] = useState<FormData>(toForm(initial));
  const [branches, setBranches] = useState<Branch[]>([]);
  const [orderSources, setOrderSources] = useState<string[]>([]);
  const [step, setStep] = useState<1 | 2>(1);

  useEffect(() => {
    Promise.all([getBranches(), getSettings()]).then(([branchList, settings]) => {
      setBranches(branchList.filter((b) => b.isActive));
      setOrderSources(settings.orderSourceOptions);
    });
  }, []);

  const set = (field: keyof FormData, value: unknown) =>
    setForm((f) => ({ ...f, [field]: value }));

  const setItem = (index: number, field: keyof OrderItem, value: unknown) =>
    setForm((f) => ({
      ...f,
      items: f.items.map((it, i) => (i === index ? { ...it, [field]: value } : it)),
    }));

  const addItem = () =>
    setForm((f) => ({ ...f, items: [...f.items, { bookName: '', sku: '', quantity: 1, arrived: false }] }));

  const removeItem = (index: number) =>
    setForm((f) => ({ ...f, items: f.items.filter((_, i) => i !== index) }));

  const phoneValid = isValidIsraeliPhone(form.customerPhone);
  const step1Valid = !!form.customerName && phoneValid && !!form.branchId && !!form.orderedFrom;
  const canSubmit = step1Valid && form.items.some((it) => it.bookName.trim());
  const realItemCount = form.items.filter((it) => it.bookName.trim()).length;
  const statusOptions = ORDER_STATUSES.filter((s) => s !== 'הגיע חלקית' || supportsPartialArrival(realItemCount));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 1) {
      setStep(2);
      return;
    }
    const payload: Record<string, unknown> = {
      ...form,
      items: form.items
        .filter((it) => it.bookName.trim())
        .map((it) => ({ ...it, quantity: Number(it.quantity) || 1 })),
    };
    await onSubmit(payload);
  };

  const inputCls = 'input';
  const field = (label: string, children: React.ReactNode) => (
    <div><label className="label">{label}</label>{children}</div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center gap-2 text-xs font-semibold">
        <span className={step === 1 ? 'text-primary' : 'text-gray-400'}>1. {t('orders.details')}</span>
        <span className="text-gray-300">›</span>
        <span className={step === 2 ? 'text-primary' : 'text-gray-400'}>2. {t('orders.items')}</span>
      </div>

      {step === 1 && (
      <>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {field(t('orders.customerName') + ' *', (
          <input required value={form.customerName} onChange={(e) => set('customerName', e.target.value)} className={inputCls} />
        ))}
        {field(t('orders.customerPhone') + ' *', (
          <>
            <input required value={form.customerPhone} onChange={(e) => set('customerPhone', e.target.value)} className={inputCls} type="tel" />
            {form.customerPhone && !phoneValid && (
              <p className="text-xs text-red-500 mt-1">{t('orders.invalidPhone')}</p>
            )}
          </>
        ))}
        {field(t('orders.branch') + ' *', (
          <select required value={form.branchId} onChange={(e) => set('branchId', e.target.value)} className={inputCls}>
            <option value="">בחר...</option>
            {branches.map((b) => <option key={b._id} value={b._id}>{b.name}</option>)}
          </select>
        ))}
        {field(t('orders.orderDate'), (
          <DateInput value={form.orderDate} onChange={(v) => set('orderDate', v)} className={inputCls + ' pl-9'} />
        ))}
        {field(t('orders.orderedFrom') + ' *', (
          <select required value={form.orderedFrom} onChange={(e) => set('orderedFrom', e.target.value)} className={inputCls}>
            <option value="">בחר...</option>
            {orderSources.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        ))}
        {isEdit && (
          <div>
            <label className="label">{t('orders.status')}</label>
            <select value={form.status} onChange={(e) => set('status', e.target.value as OrderStatus)} className={inputCls}>
              {statusOptions.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        <input
          id="isPaid"
          type="checkbox"
          checked={form.isPaid}
          onChange={(e) => set('isPaid', e.target.checked)}
          className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary"
        />
        <label htmlFor="isPaid" className="text-sm text-gray-700">{t('orders.isPaid')}</label>
      </div>
      </>
      )}

      {step === 2 && (
      <>
      <div>
        <label className="label">{t('orders.items')}</label>
        <div className="space-y-2">
          {form.items.map((item, index) => (
            <div key={index} className="flex flex-col sm:flex-row gap-2 p-3 bg-gray-50 rounded-md border border-gray-100">
              <div className="sm:flex-1">
                <label className="label sm:hidden">{t('orders.bookName')}</label>
                <input
                  value={item.bookName}
                  onChange={(e) => setItem(index, 'bookName', e.target.value)}
                  placeholder={t('orders.bookName')}
                  className={inputCls}
                />
              </div>
              <div className="sm:w-32">
                <label className="label sm:hidden">{t('orders.sku')}</label>
                <input
                  value={item.sku ?? ''}
                  onChange={(e) => setItem(index, 'sku', e.target.value)}
                  placeholder={t('orders.sku')}
                  className={inputCls}
                />
              </div>
              <div className="sm:w-24">
                <label className="label">{t('orders.quantity')}</label>
                <input
                  type="number"
                  min="1"
                  value={item.quantity}
                  onChange={(e) => setItem(index, 'quantity', e.target.value)}
                  className={inputCls}
                />
              </div>
              {form.items.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeItem(index)}
                  className="flex-shrink-0 text-red-400 hover:text-red-600 px-2 self-end sm:self-center pb-2 sm:pb-0"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={addItem}
          className="mt-2 flex items-center gap-2 px-4 py-2 rounded-md border border-dashed border-gray-300 text-sm text-gray-500 hover:border-primary hover:text-primary transition-colors w-full justify-center"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          {t('orders.addItem')}
        </button>
      </div>

      {field(t('orders.notes'), (
        <textarea
          value={form.notes}
          onChange={(e) => set('notes', e.target.value)}
          rows={3}
          className={inputCls + ' resize-none'}
        />
      ))}
      </>
      )}

      <div className="flex gap-3 justify-end pt-2 border-t border-gray-100">
        {step === 2 && (
          <Button type="button" variant="secondary" onClick={() => setStep(1)}>{t('common.back')}</Button>
        )}
        <Button type="button" variant="secondary" onClick={onCancel}>{t('common.cancel')}</Button>
        {step === 1 ? (
          <Button type="submit" disabled={!step1Valid}>{t('common.next')}</Button>
        ) : (
          <Button type="submit" loading={loading} disabled={!canSubmit}>{t('common.save')}</Button>
        )}
      </div>
    </form>
  );
}
