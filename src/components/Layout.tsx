import { NavLink, Outlet } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ArrowLeftRight, 
  BarChart3, 
  Settings, 
  Moon, 
  Sun,
  Lock,
  Menu,
  X,
  Sparkles
} from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/transactions', icon: ArrowLeftRight, label: 'Transactions' },
  { to: '/reports', icon: BarChart3, label: 'Reports' },
  { to: '/more', icon: Sparkles, label: 'More' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

export function Layout() {
  const { effectiveTheme, toggleTheme } = useTheme();
  const { logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#fafafb] dark:bg-[#0a0a0c] text-zinc-900 dark:text-zinc-100">
      {/* ─── Desktop Sidebar ─── */}
      <aside className="fixed left-0 top-0 z-30 h-screen w-[260px] hidden lg:flex flex-col border-r border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900">
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 h-16 border-b border-zinc-200/80 dark:border-zinc-800/80 flex-shrink-0">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 shadow-lg shadow-violet-500/20">
            <span className="text-lg">💎</span>
          </div>
          <div>
            <h1 className="font-bold text-base tracking-tight leading-none">FinVault</h1>
            <p className="text-[10px] text-zinc-500 dark:text-zinc-500 font-medium">Privacy-First Finance</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-semibold transition-all ${
                  isActive
                    ? 'bg-violet-600/10 text-violet-700 dark:text-violet-400'
                    : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/60'
                }`
              }
            >
              <item.icon className="w-[18px] h-[18px]" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-3 py-3 border-t border-zinc-200/80 dark:border-zinc-800/80 space-y-0.5 flex-shrink-0">
          <button
            onClick={toggleTheme}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/60 transition-colors"
          >
            {effectiveTheme === 'dark' ? <Sun className="w-[18px] h-[18px]" /> : <Moon className="w-[18px] h-[18px]" />}
            {effectiveTheme === 'dark' ? 'Light Mode' : 'Dark Mode'}
          </button>
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/60 transition-colors"
          >
            <Lock className="w-[18px] h-[18px]" />
            Lock App
          </button>
        </div>
      </aside>

      {/* ─── Mobile Header ─── */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-30 border-b border-zinc-200/80 dark:border-zinc-800/80 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md">
        <div className="flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600">
              <span className="text-sm">💎</span>
            </div>
            <span className="font-bold text-sm">FinVault</span>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={toggleTheme} className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
              {effectiveTheme === 'dark' ? <Sun className="w-[18px] h-[18px]" /> : <Moon className="w-[18px] h-[18px]" />}
            </button>
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
              {mobileMenuOpen ? <X className="w-[18px] h-[18px]" /> : <Menu className="w-[18px] h-[18px]" />}
            </button>
          </div>
        </div>
        {mobileMenuOpen && (
          <div className="border-t border-zinc-200 dark:border-zinc-800 px-3 py-2 bg-white dark:bg-zinc-900 animate-fade-in">
            {navItems.map(item => (
              <NavLink key={item.to} to={item.to} end={item.to === '/'} onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium ${isActive ? 'bg-violet-600/10 text-violet-600 dark:text-violet-400' : 'text-zinc-700 dark:text-zinc-400'}`}
              >
                <item.icon className="w-[18px] h-[18px]" />
                {item.label}
              </NavLink>
            ))}
            <button onClick={logout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-zinc-600 dark:text-zinc-400">
              <Lock className="w-[18px] h-[18px]" />
              Lock App
            </button>
          </div>
        )}
      </header>

      {/* ─── Main Content ─── */}
      <main className="lg:pl-[260px] pt-14 lg:pt-0 pb-20 lg:pb-0 min-h-screen">
        <Outlet />
      </main>

      {/* ─── Mobile Bottom Nav ─── */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 border-t border-zinc-200/80 dark:border-zinc-800/80 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md safe-area-bottom">
        <div className="flex items-center justify-around h-16 px-1">
          {navItems.map(item => (
            <NavLink key={item.to} to={item.to} end={item.to === '/'}
              className={({ isActive }) => `flex flex-col items-center justify-center gap-0.5 w-16 py-1.5 rounded-xl transition-colors ${isActive ? 'text-violet-600 dark:text-violet-400' : 'text-zinc-400 dark:text-zinc-500'}`}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-[10px] font-semibold leading-none">{item.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
