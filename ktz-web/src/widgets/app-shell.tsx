'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Activity, LogIn, LogOut, User, Train, ChevronDown } from 'lucide-react';
import { TelemetryProvider } from '@/shared/lib/telemetry-context';
import { useAuth } from '@/shared/lib/auth-context';
import { isAdmin } from '@/shared/lib/auth-store';
import { ExportPanel } from '@/widgets/export-panel';

const DRIVER_NAV = [
  { href: '/',            label: 'Кабина' },
  { href: '/map',         label: 'Карта' },
  { href: '/replay',      label: 'История' },
  { href: '/route',       label: 'Маршрут' },
  { href: '/maintenance', label: 'Обслуживание' },
  { href: '/profile',     label: 'Профиль' },
];

const ADMIN_NAV = [
  { href: '/map',     label: 'Карта' },
  { href: '/admin',   label: 'Диспетчер' },
  { href: '/reports', label: 'Отчёты' },
  { href: '/replay',  label: 'История' },
  { href: '/profile', label: 'Профиль' },
];

const GUEST_NAV = [
  { href: '/',            label: 'Кабина' },
  { href: '/map',         label: 'Карта' },
  { href: '/replay',      label: 'История' },
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
    <header
      className="sticky top-0 z-50 border-b border-white/[0.06] shadow-[0_8px_30px_rgba(0,0,0,0.45)] backdrop-blur-md"
      style={{ background: 'linear-gradient(180deg, #111111 0%, #141414 100%)' }}
    >
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3 px-6 py-4 min-h-[4.25rem]">
        <div className="flex min-w-0 flex-1 items-center gap-4 lg:gap-6">
          <Link
            href={session && isAdmin(session) ? '/admin' : '/'}
            className="group flex shrink-0 items-center gap-3 rounded-xl pr-5"
            style={{ borderRight: '1px solid rgba(255,255,255,0.08)' }}
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 ring-1 ring-cyan-500/25 transition group-hover:bg-cyan-500/15">
              <Activity className="h-6 w-6 text-cyan-400" />
            </span>
            <span className="hidden flex-col sm:flex">
              <span className="text-[11px] font-medium uppercase tracking-[0.2em] text-slate-500">Kinetic</span>
              <span className="text-base font-bold tracking-wide text-cyan-400">OBSERVER</span>
            </span>
          </Link>

          <nav className="flex min-w-0 flex-1 items-center gap-0.5 overflow-x-auto pb-0.5 sm:gap-1 sm:pb-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {navItems.map(({ href, label }) => {
              const isActive = pathname === href || (href !== '/' && pathname.startsWith(href));
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-2.5 text-[15px] font-medium leading-tight whitespace-nowrap transition-all ${
                    isActive
                      ? 'bg-cyan-500/15 text-cyan-300 shadow-[inset_0_0_0_1px_rgba(34,211,238,0.25)]'
                      : 'text-slate-400 hover:bg-white/[0.06] hover:text-slate-100'
                  }`}
                >
                  {label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex min-w-0 shrink-0 items-center gap-2 sm:gap-3">
          {session?.locomotiveNumber && (
            <div
              className="hidden items-center gap-2 rounded-xl px-3 py-2 lg:flex"
              style={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.08)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)' }}
            >
              <Train className="h-4 w-4 text-cyan-400" />
              <span className="font-mono text-sm font-semibold text-cyan-400">{session.locomotiveNumber}</span>
            </div>
          )}

          {session && (
            <div
              className="flex max-w-[min(100%,22rem)] min-w-0 shrink items-center justify-end rounded-xl px-2.5 py-2"
              style={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.08)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)' }}
              title="Экспорт телеметрии за 15 мин (CSV / PDF) — доступен машинистам и диспетчерам"
            >
              <ExportPanel variant="header" />
            </div>
          )}

          {session ? (
            <div className="flex items-center gap-1.5">
              <Link
                href="/profile"
                className="flex items-center gap-2.5 rounded-xl px-2 py-1.5 transition-colors hover:bg-white/[0.06]"
              >
                {session.photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={session.photoUrl} alt={displayName ?? ''} className="h-9 w-9 rounded-full object-cover ring-2 ring-cyan-500/30" />
                ) : (
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 ring-2 ring-cyan-500/25">
                    <User className="h-4 w-4 text-white" />
                  </div>
                )}
                <div className="hidden text-left md:block">
                  <div className="text-sm font-semibold leading-none text-white">{displayName}</div>
                  <div className="mt-0.5 text-[11px] text-slate-500">{isAdmin(session) ? 'Диспетчер' : 'Машинист'}</div>
                </div>
                <ChevronDown className="hidden h-3.5 w-3.5 text-slate-500 md:block" />
              </Link>
              <button
                onClick={logout}
                title="Выйти"
                className="rounded-xl p-2.5 text-slate-500 transition-colors hover:bg-red-500/10 hover:text-red-400"
              >
                <LogOut className="h-[18px] w-[18px]" />
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-[15px] font-medium text-cyan-400 transition-colors whitespace-nowrap hover:bg-cyan-500/10"
              style={{ border: '1px solid rgba(34,211,238,0.35)', background: 'rgba(6,182,212,0.06)' }}
            >
              <LogIn className="h-4 w-4" />
              <span>Войти</span>
            </Link>
          )}
        </div>
      </div>

      {session && !isAdmin(session) && session.locomotiveNumber && (
        <div className="flex items-center gap-2 border-t border-white/[0.05] px-6 py-2.5" style={{ background: 'rgba(0,0,0,0.2)' }}>
          <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
          <span className="text-xs text-slate-500">
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
