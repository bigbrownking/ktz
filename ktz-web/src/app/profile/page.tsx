'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/shared/lib/auth-context';
import { routesApi, ApiRoute } from '@/shared/lib/api-client';
import { useTelemetryContext } from '@/shared/lib/telemetry-context';
import {
  User, Train, MapPin, Activity, Shield, Calendar,
  Clock, Gauge, Heart, ChevronRight, LogIn,
} from 'lucide-react';
import Link from 'next/link';

export default function ProfilePage() {
  const { session } = useAuth();
  const { telemetry, connected } = useTelemetryContext();
  const [route, setRoute] = useState<ApiRoute | null>(null);
  const [loadingRoute, setLoadingRoute] = useState(true);

  useEffect(() => {
    if (!session?.locomotiveNumber) { setLoadingRoute(false); return; }
    routesApi.getAll()
      .then(routes => {
        const found = routes.find(r => r.locomotiveNumber === session.locomotiveNumber);
        setRoute(found ?? null);
      })
      .catch(() => {})
      .finally(() => setLoadingRoute(false));
  }, [session?.locomotiveNumber]);

  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center">
          <User className="w-8 h-8 text-slate-500" />
        </div>
        <div className="text-slate-400 text-lg">Вы не авторизованы</div>
        <Link href="/login" className="flex items-center gap-2 px-6 py-3 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl font-semibold transition-colors">
          <LogIn className="w-4 h-4" />
          Войти в систему
        </Link>
      </div>
    );
  }

  const displayName = `${session.name} ${session.surname}`.trim() || session.username;
  const isAdmin = session.role === 'ROLE_ADMIN';
  const stations = route?.stations ? route.stations.split(',').map(s => s.trim()) : [];
  const etaH = route?.estimatedMinutes ? Math.floor(route.estimatedMinutes / 60) : null;
  const etaM = route?.estimatedMinutes ? route.estimatedMinutes % 60 : null;

  const healthColor = telemetry.health >= 80 ? '#10b981' : telemetry.health >= 60 ? '#f59e0b' : '#ef4444';

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="bg-gradient-to-br from-slate-900 to-[#0f1629] border border-slate-800 rounded-2xl p-6">
        <div className="flex items-start gap-6">
          <div className="relative flex-shrink-0">
            {session.photoUrl ? (
              <img src={session.photoUrl} alt={displayName}
                className="w-24 h-24 rounded-2xl object-cover border-2 border-cyan-500/40" />
            ) : (
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border-2 border-cyan-500/40 flex items-center justify-center">
                <User className="w-10 h-10 text-cyan-400" />
              </div>
            )}
            <span className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-slate-900 ${connected ? 'bg-green-400' : 'bg-slate-500'}`} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between flex-wrap gap-3">
              <div>
                <h1 className="text-2xl font-bold text-white">{displayName}</h1>
                <div className="text-slate-400 text-sm mt-1">@{session.username}</div>
                {session.age > 0 && (
                  <div className="flex items-center gap-1 text-slate-500 text-xs mt-1">
                    <Calendar className="w-3 h-3" />{session.age} лет
                  </div>
                )}
              </div>
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-sm font-semibold ${
                isAdmin
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                  : 'bg-green-500/10 border-green-500/30 text-green-400'
              }`}>
                {isAdmin ? <Shield className="w-4 h-4" /> : <Train className="w-4 h-4" />}
                {isAdmin ? 'Диспетчер' : 'Машинист'}
              </div>
            </div>

            {session.locomotiveNumber && (
              <div className="mt-4 flex flex-wrap gap-3">
                <div className="flex items-center gap-2 bg-slate-800/60 border border-slate-700 rounded-xl px-3 py-2">
                  <Train className="w-4 h-4 text-cyan-400" />
                  <div>
                    <div className="text-[10px] text-slate-500 uppercase tracking-wider">Локомотив</div>
                    <div className="text-sm font-bold text-white font-mono">{session.locomotiveNumber}</div>
                  </div>
                </div>
                {session.locomotiveName && (
                  <div className="flex items-center gap-2 bg-slate-800/60 border border-slate-700 rounded-xl px-3 py-2">
                    <MapPin className="w-4 h-4 text-amber-400" />
                    <div>
                      <div className="text-[10px] text-slate-500 uppercase tracking-wider">Маршрут</div>
                      <div className="text-sm font-bold text-white">{session.locomotiveName}</div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {!isAdmin && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: <Gauge className="w-5 h-5 text-cyan-400" />, label: 'Скорость', value: `${Math.round(telemetry.speed)} км/ч`, color: 'cyan' },
            { icon: <Heart className="w-5 h-5" style={{ color: healthColor }} />, label: 'Здоровье', value: `${Math.round(telemetry.health)}%`, color: 'green' },
            { icon: <Activity className="w-5 h-5 text-blue-400" />, label: 'Состояние', value: telemetry.healthCategory, color: 'blue' },
            { icon: <div className={`w-2.5 h-2.5 rounded-full ${connected ? 'bg-green-400 animate-pulse' : 'bg-slate-500'}`} />, label: 'Связь', value: connected ? 'Онлайн' : 'Ожидание', color: connected ? 'green' : 'slate' },
          ].map(({ icon, label, value }) => (
            <div key={label} className="bg-[#0f1629] border border-slate-800 rounded-2xl p-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center flex-shrink-0">{icon}</div>
              <div>
                <div className="text-xs text-slate-500 uppercase tracking-wider">{label}</div>
                <div className="font-bold text-white text-sm mt-0.5">{value}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {!isAdmin && !loadingRoute && route && (
          <div className="bg-[#0f1629] border border-slate-800 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-white flex items-center gap-2">
                <MapPin className="w-4 h-4 text-amber-400" />
                Мой маршрут
              </h2>
              <Link href="/route" className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors">
                Подробнее <ChevronRight className="w-3 h-3" />
              </Link>
            </div>

            {stations.length > 0 && (
              <div className="mb-4 flex flex-col gap-1">
                {stations.map((st, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="flex flex-col items-center">
                      <div className={`w-2.5 h-2.5 rounded-full border-2 ${i === 0 || i === stations.length - 1 ? 'border-cyan-400 bg-cyan-400' : 'border-slate-600 bg-slate-800'}`} />
                      {i < stations.length - 1 && <div className="w-px h-4 bg-slate-700" />}
                    </div>
                    <span className={`text-sm ${i === 0 || i === stations.length - 1 ? 'text-white font-semibold' : 'text-slate-400'}`}>{st}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="grid grid-cols-3 gap-3">
              {route.distanceKm && (
                <div className="bg-slate-900 rounded-xl p-3">
                  <div className="text-slate-500 text-xs mb-1">Расстояние</div>
                  <div className="text-white font-bold text-sm">{route.distanceKm} км</div>
                </div>
              )}
              {etaH !== null && (
                <div className="bg-slate-900 rounded-xl p-3">
                  <div className="text-slate-500 text-xs mb-1 flex items-center gap-1"><Clock className="w-3 h-3" />Время</div>
                  <div className="text-white font-bold text-sm">{etaH}ч {etaM}м</div>
                </div>
              )}
              {route.distanceKm && route.estimatedMinutes && (
                <div className="bg-slate-900 rounded-xl p-3">
                  <div className="text-slate-500 text-xs mb-1">Ср. скор.</div>
                  <div className="text-white font-bold text-sm">{Math.round(route.distanceKm / (route.estimatedMinutes / 60))} км/ч</div>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="bg-[#0f1629] border border-slate-800 rounded-2xl p-6">
          <h2 className="font-bold text-white mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4 text-cyan-400" />
            Быстрые действия
          </h2>
          <div className="space-y-2">
            {(isAdmin ? [
              { href: '/admin', label: 'Управление системой', icon: <Shield className="w-4 h-4 text-amber-400" />, desc: 'Локомотивы, маршруты, машинисты' },
              { href: '/map', label: 'Карта флота', icon: <MapPin className="w-4 h-4 text-cyan-400" />, desc: 'Все поезда в реальном времени' },
              { href: '/reports', label: 'Отчёты', icon: <Activity className="w-4 h-4 text-green-400" />, desc: 'Аналитика и статистика' },
            ] : [
              { href: '/', label: 'Кабина', icon: <Gauge className="w-4 h-4 text-cyan-400" />, desc: 'Телеметрия локомотива' },
              { href: '/route', label: 'Мой маршрут', icon: <MapPin className="w-4 h-4 text-amber-400" />, desc: 'Детали текущего маршрута' },
              { href: '/map', label: 'Карта', icon: <Activity className="w-4 h-4 text-green-400" />, desc: 'Положение на карте' },
              { href: '/maintenance', label: 'Обслуживание', icon: <Train className="w-4 h-4 text-slate-400" />, desc: 'Технический статус' },
            ]).map(({ href, label, icon, desc }) => (
              <Link key={href} href={href}
                className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/50 hover:bg-slate-800 transition-colors group">
                <div className="w-9 h-9 bg-slate-800 group-hover:bg-slate-700 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors">{icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-white">{label}</div>
                  <div className="text-xs text-slate-500">{desc}</div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-slate-400 transition-colors" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
