import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { changePassword } from '../api/auth';
import Button from '../components/ui/Button';

export default function ChangePassword() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (newPassword.length < 6) { setError(t('auth.passwordTooShort')); return; }
    if (newPassword !== confirm) { setError(t('auth.passwordsNoMatch')); return; }
    setLoading(true);
    try {
      await changePassword(newPassword);
      navigate('/');
    } catch {
      setError('שגיאה בשינוי הסיסמה');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="bg-primary rounded-lg shadow-nav px-6 pt-5 pb-0 mb-0">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-white rounded-md p-2">
              <svg className="h-7 w-7 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <div>
              <h1 className="text-white font-bold text-lg">{t('auth.changePasswordTitle')}</h1>
              <p className="text-white/60 text-xs">{t('auth.changePasswordSubtitle')}</p>
            </div>
          </div>
          <div className="h-1 bg-accent -mx-6" />
        </div>

        <div className="bg-white rounded-b-lg border border-gray-200 border-t-0 px-6 py-6 shadow-card">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">{t('auth.newPassword')}</label>
              <input type="password" required value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="input" />
            </div>
            <div>
              <label className="label">{t('auth.confirmPassword')}</label>
              <input type="password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} className="input" />
            </div>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-2.5 rounded-md text-center">{error}</div>
            )}
            <Button type="submit" loading={loading} className="w-full" size="lg">
              {t('auth.changePassword')}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
