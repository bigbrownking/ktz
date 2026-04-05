'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bell, Settings, Activity, LogIn, LogOut, User, Train, ChevronDown } from 'lucide-react';
import { TelemetryProvider } from '@/shared/lib/telemetry-context';
import { useAuth } from '@/shared/lib/auth-context';
import { isAdmin } from '@/shared/lib/auth-store';

const DRIVER_NAV = [
  { href: '/',            label: 'Кабина' },
  { href: '/map',         label: 'Карта' },
  { href: '/route',       label: 'Маршрут' },
  { href: '/maintenance', label: 'Обслуживание' },
  { href: '/profile',     label: 'Профиль' },
];

const ADMIN_NAV = [
  { href: '/map',     label: 'Карта флота' },
  { href: '/admin',   label: 'Диспетчер' },
  { href: '/reports', label: 'Отчёты' },
  { href: '/profile', label: 'Профиль' },
];

const GUEST_NAV = [
  { href: '/',            label: 'Кабина' },
  { href: '/map',         label: 'Карта' },
  { href: '/route',       label: 'Маршрут' },
  { href: '/maintenance', label: 'Обслуживание' },
  { href: '/admin',       label: 'Диспетчер' },
];

function Header() {
  const pathname = usePathname();
  const { session, logout } = useAuth();

  const navItems = session ? (isAdmin(session) ? ADMIN_NAV : DRIVER_NAV) : GUEST_NAV;
  const displayName = session
    ? `${session.name} ${session.surname}`.trim() || session.username
    : null;

  return (
    <header className="sticky top-0 z-50" style={{ background: '#141414', borderBottom: '1px solid #2a2a2a' }}>
      <div className="flex items-center justify-between px-4 py-2.5 gap-4">
        <div className="flex items-center gap-4 shrink-0">
          <Link href={session && isAdmin(session) ? '/admin' : '/'} className="flex items-center gap-2 pr-4 shrink-0" style={{ borderRight: '1px solid #2a2a2a' }}>
            <Activity className="w-5 h-5 text-cyan-400" />
            <span className="text-sm font-bold text-cyan-400 tracking-wider whitespace-nowrap hidden sm:block">
              KINETIC OBSERVER
            </span>
          </Link>

          <nav className="flex items-center gap-0.5">
            {navItems.map(({ href, label }) => {
              const isActive = pathname === href || (href !== '/' && pathname.startsWith(href));
              return (
                <Link key={href} href={href}
                  className={`px-3 py-1.5 rounded-lg text-sm whitespace-nowrap transition-colors ${
                    isActive ? 'text-cyan-400 bg-cyan-400/10' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                  }`}>
                  {label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {session?.locomotiveNumber && (
            <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-lg" style={{ background: '#1e1e1e', border: '1px solid #333' }}>
              <Train className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-xs text-cyan-400 font-mono font-semibold">{session.locomotiveNumber}</span>
            </div>
          )}

          <button className="p-1.5 hover:bg-white/5 rounded-lg transition-colors relative">
            <Bell className="w-4 h-4 text-slate-400" />
            <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-red-500 rounded-full" />
          </button>
          <button className="p-1.5 hover:bg-white/5 rounded-lg transition-colors">
            <Settings className="w-4 h-4 text-slate-400" />
          </button>

          {session ? (
            <div className="flex items-center gap-1.5">
              <Link href="/profile" className="flex items-center gap-2 hover:bg-white/5 rounded-xl px-2 py-1 transition-colors">
                {session.photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={session.photoUrl} alt={displayName ?? ''} className="w-7 h-7 rounded-full object-cover" style={{ border: '1px solid #06b6d4' }} />
                ) : (
                  <div className="w-7 h-7 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full flex items-center justify-center">
                    <User className="w-3.5 h-3.5 text-white" />
                  </div>
                )}
                <div className="hidden md:block text-left">
                  <div className="text-xs font-semibold text-white leading-none">{displayName}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">{isAdmin(session) ? 'Диспетчер' : 'Машинист'}</div>
                </div>
                <ChevronDown className="w-3 h-3 text-slate-600 hidden md:block" />
              </Link>
              <button onClick={logout} title="Выйти"
                className="p-1.5 hover:bg-red-500/10 hover:text-red-400 text-slate-500 rounded-lg transition-colors">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <Link href="/login" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-cyan-400 text-sm transition-colors whitespace-nowrap"
              style={{ background: 'rgba(6,182,212,0.08)', border: '1px solid rgba(6,182,212,0.25)' }}>
              <LogIn className="w-3.5 h-3.5" />
              <span>Войти</span>
            </Link>
          )}
        </div>
      </div>

      {session && !isAdmin(session) && session.locomotiveNumber && (
        <div className="px-4 pb-1.5 flex items-center gap-2">
          <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
          <span className="text-[11px] text-slate-600">
            Локомотив <span className="text-cyan-400 font-mono font-semibold">{session.locomotiveNumber}</span>
            {session.locomotiveName && <> · <span className="text-slate-500">{session.locomotiveName}</span></>}
          </span>
        </div>
      )}
    </header>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <TelemetryProvider>
      <Header />
      <main className="p-6">{children}</main>
    </TelemetryProvider>
  );
}
