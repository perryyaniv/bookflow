import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { ROLE_LABELS } from '../../utils/roles';

function usePageTitle() {
  const location = useLocation();
  const { t } = useTranslation();
  const path = location.pathname;
  if (path === '/') return t('dashboard.title');
  if (path === '/orders/new') return t('nav.addOrder');
  if (path.startsWith('/orders/')) return t('orders.details');
  if (path === '/audit-log') return t('nav.auditLog');
  if (path === '/users') return t('nav.userManagement');
  if (path === '/settings') return t('nav.settings');
  return '';
}

export default function Header() {
  const { t } = useTranslation();
  const { user, clearAuth } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const pageTitle = usePageTitle();

  const isAdmin = user?.role === 'admin';

  const navItems = [
    { to: '/', label: t('dashboard.title'), show: true },
    { to: '/audit-log', label: t('nav.auditLog'), show: isAdmin },
    { to: '/users', label: t('nav.userManagement'), show: isAdmin },
    { to: '/settings', label: t('nav.settings'), show: isAdmin },
  ].filter((i) => i.show);

  const isActive = (to: string) =>
    to === '/'
      ? location.pathname === '/'
      : location.pathname === to ||
        (location.pathname.startsWith(to + '/') &&
          !navItems.some((i) => i.to !== to && i.to.startsWith(to) && location.pathname.startsWith(i.to)));

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      navigate(`/?search=${encodeURIComponent(search.trim())}`);
      setSearch('');
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 shadow-nav">
        <div className="bg-primary px-4 sm:px-6 pt-[env(safe-area-inset-top)]">
          <div className="max-w-7xl mx-auto relative flex items-center h-14">

            <div className="flex items-center gap-1 flex-none z-10">
              <button
                className="p-2 rounded-md text-white/80 hover:text-white hover:bg-white/10"
                onClick={() => setDrawerOpen((o) => !o)}
                aria-label="תפריט"
              >
                {drawerOpen
                  ? <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  : <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                }
              </button>

              <div className="hidden md:flex items-center gap-2 mr-2">
                <form onSubmit={handleSearch} className="relative">
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="חיפוש..."
                    className="w-36 bg-white/10 border border-white/30 text-white placeholder-white/50 rounded-md px-3 py-1.5 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-white/40 focus:bg-white/20 transition-all"
                  />
                  <button type="submit" className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/60 hover:text-white">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </button>
                </form>
                <div className="flex items-center gap-1.5 border-r border-white/20 pr-2">
                  <span className="text-xs text-white/70">{user?.name}</span>
                  <button onClick={clearAuth} title={t('nav.logout')}
                    className="p-1.5 rounded-md text-white/60 hover:text-white hover:bg-white/10 transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span className="text-white font-bold text-base">{pageTitle}</span>
            </div>

            <div className="mr-auto z-10" />

          </div>
        </div>
        <div className="h-1 bg-accent" />
      </header>

      {drawerOpen && (
        <div className="fixed top-[60px] bottom-14 left-0 right-0 z-40">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDrawerOpen(false)} />
          <div className="absolute top-0 right-0 h-full w-72 bg-primary shadow-xl flex flex-col">
            <div className="px-4 py-3 border-b border-white/10">
              <form onSubmit={(e) => { handleSearch(e); setDrawerOpen(false); }} className="flex gap-2">
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="חיפוש..."
                  className="flex-1 bg-white/10 border border-white/30 text-white placeholder-white/50 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-white/40"
                />
                <button type="submit" className="px-3 bg-white/20 text-white rounded-md text-sm font-medium hover:bg-white/30">חפש</button>
              </form>
            </div>
            <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto">
              {navItems.map((item) => (
                <Link key={item.to} to={item.to} onClick={() => setDrawerOpen(false)}
                  className={`flex items-center px-4 py-3 rounded-md text-sm font-medium transition-colors ${
                    isActive(item.to) ? 'bg-white/20 text-white' : 'text-white/80 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
            <div className="px-4 py-4 border-t border-white/10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white">{user?.name}</p>
                  <p className="text-xs text-white/50 mt-0.5">
                    {user?.role ? ROLE_LABELS[user.role] : ''}
                  </p>
                </div>
                <button onClick={() => { clearAuth(); setDrawerOpen(false); }}
                  className="flex items-center gap-1.5 text-xs text-white/70 hover:text-white px-3 py-2 rounded-md hover:bg-white/10 transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  {t('nav.logout')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
