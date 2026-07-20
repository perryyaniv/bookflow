import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { getBranches, createBranch, updateBranch, deleteBranch } from '../api/branches';
import { getSettings, updateSettings } from '../api/settings';
import { Branch, AppSettings } from '../types';
import { useToast } from '../contexts/ToastContext';
import Button from '../components/ui/Button';
import Spinner from '../components/ui/Spinner';

function BranchEditor() {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const [items, setItems] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    getBranches().then(setItems).finally(() => setLoading(false));
  }, []);

  const handleAdd = async () => {
    if (!newName.trim()) return;
    setAdding(true);
    try {
      const item = await createBranch({ name: newName.trim() });
      setItems((prev) => [...prev, item]);
      setNewName('');
    } finally {
      setAdding(false);
    }
  };

  const handleToggleActive = async (item: Branch) => {
    const updated = await updateBranch(item._id, { isActive: !item.isActive });
    setItems((prev) => prev.map((i) => i._id === item._id ? updated : i));
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteBranch(id);
      setItems((prev) => prev.filter((i) => i._id !== id));
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      showToast(msg || 'שגיאה במחיקה', 'error');
    }
  };

  if (loading) return <Spinner size="sm" />;

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          placeholder={t('settings.itemName')}
          className="input flex-1"
        />
        <Button size="sm" loading={adding} onClick={handleAdd}>{t('common.add')}</Button>
      </div>
      <div className="space-y-1">
        {items.map((item) => (
          <div key={item._id} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50 group">
            <div className="flex items-center gap-2">
              <span className={`text-sm ${item.isActive ? 'text-gray-800' : 'text-gray-400 line-through'}`}>{item.name}</span>
              {!item.isActive && <span className="text-xs text-gray-400">({t('settings.inactive')})</span>}
            </div>
            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => handleToggleActive(item)}
                className="text-xs text-gray-500 hover:text-primary px-2 py-1 rounded hover:bg-gray-100"
              >
                {item.isActive ? t('settings.inactive') : t('settings.active')}
              </button>
              <button
                onClick={() => handleDelete(item._id)}
                className="text-xs text-red-400 hover:text-red-600 px-2 py-1 rounded hover:bg-red-50"
              >
                {t('common.delete')}
              </button>
            </div>
          </div>
        ))}
        {items.length === 0 && <p className="text-sm text-gray-400 text-center py-4">{t('common.noData')}</p>}
      </div>
    </div>
  );
}

function OrderSourcesEditor() {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [newSource, setNewSource] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getSettings().then(setSettings).finally(() => setLoading(false));
  }, []);

  const persist = async (orderSourceOptions: string[]) => {
    setSaving(true);
    try {
      const updated = await updateSettings({ orderSourceOptions });
      setSettings(updated);
      showToast(t('common.success'), 'success');
    } finally {
      setSaving(false);
    }
  };

  const handleAdd = () => {
    if (!newSource.trim() || !settings) return;
    persist([...settings.orderSourceOptions, newSource.trim()]);
    setNewSource('');
  };

  const handleRemove = (source: string) => {
    if (!settings) return;
    persist(settings.orderSourceOptions.filter((s) => s !== source));
  };

  if (loading || !settings) return <Spinner size="sm" />;

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <input
          value={newSource}
          onChange={(e) => setNewSource(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          placeholder={t('settings.itemName')}
          className="input flex-1"
        />
        <Button size="sm" loading={saving} onClick={handleAdd}>{t('common.add')}</Button>
      </div>
      <div className="flex flex-wrap gap-2">
        {settings.orderSourceOptions.map((source) => (
          <span key={source} className="flex items-center gap-1.5 text-sm bg-primary/8 text-primary border border-primary/20 px-3 py-1 rounded-full">
            {source}
            <button onClick={() => handleRemove(source)} className="hover:text-red-500">×</button>
          </span>
        ))}
        {settings.orderSourceOptions.length === 0 && <p className="text-sm text-gray-400">{t('common.noData')}</p>}
      </div>
    </div>
  );
}

function ThresholdsEditor() {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notArrived, setNotArrived] = useState('14');
  const [notCollected, setNotCollected] = useState('14');

  useEffect(() => {
    getSettings().then((s) => {
      setSettings(s);
      setNotArrived(String(s.notArrivedThresholdDays));
      setNotCollected(String(s.notCollectedThresholdDays));
    }).finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await updateSettings({
        notArrivedThresholdDays: Number(notArrived) || 14,
        notCollectedThresholdDays: Number(notCollected) || 14,
      });
      setSettings(updated);
      showToast(t('common.success'), 'success');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !settings) return <Spinner size="sm" />;

  return (
    <div className="space-y-4 max-w-sm">
      <div>
        <label className="label">{t('settings.notArrivedThresholdDays')}</label>
        <input type="number" min="1" value={notArrived} onChange={(e) => setNotArrived(e.target.value)} className="input" />
      </div>
      <div>
        <label className="label">{t('settings.notCollectedThresholdDays')}</label>
        <input type="number" min="1" value={notCollected} onChange={(e) => setNotCollected(e.target.value)} className="input" />
      </div>
      <Button size="sm" loading={saving} onClick={handleSave}>{t('common.save')}</Button>
    </div>
  );
}

export default function Settings() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('branches');

  const tabs = [
    { key: 'branches', label: t('settings.branches') },
    { key: 'orderSources', label: t('settings.orderSources') },
    { key: 'thresholds', label: t('settings.thresholds') },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-2">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg border-b-2 transition-colors -mb-2 ${
              activeTab === tab.key ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        {activeTab === 'branches' && <BranchEditor />}
        {activeTab === 'orderSources' && <OrderSourcesEditor />}
        {activeTab === 'thresholds' && <ThresholdsEditor />}
      </div>
    </div>
  );
}
