import { Outlet } from 'react-router-dom';
import Header from './Header';
import BottomNav from './BottomNav';

export default function Layout() {
  return (
    <div className="min-h-dvh bg-bg font-sans flex flex-col">
      <Header />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 pb-[calc(5rem+env(safe-area-inset-bottom))] md:pb-16">
        <Outlet />
      </main>
      {/* Desktop footer */}
      <footer className="hidden md:block fixed bottom-0 left-0 right-0 z-30 border-t border-white/10 bg-primary/95 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between">
          <p className="text-xs text-white/60">© {new Date().getFullYear()} BookFlow</p>
        </div>
      </footer>
      {/* Mobile bottom nav */}
      <BottomNav />
    </div>
  );
}
