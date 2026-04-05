'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Settings2, Fuel, Disc, Zap, AlertTriangle, TrendingUp } from 'lucide-react';
import { useTelemetry, setKtzLocoNumber } from '@/shared/lib/telemetry-context';
import { HealthIndicatorDetailed } from '@/widgets/health-indicator-detailed';
import { Speedometer } from '@/widgets/speedometer';
import { DieselPanel } from '@/widgets/diesel-panel';
import { FuelPanel } from '@/widgets/fuel-panel';
import { BrakesPanel } from '@/widgets/brakes-panel';
import { ElectricPanel } from '@/widgets/electric-panel';
import { AlertsPanel } from '@/widgets/alerts-panel';
import { TrendsPanel } from '@/widgets/trends-panel';
import { DiagnosticsLog } from '@/widgets/diagnostics-log';
import { TrackSchematic } from '@/widgets/track-schematic';
type PanelView = 'diesel' | 'fuel' | 'brakes' | 'electric' | 'alerts' | 'trends';

const PANEL_DEFS = [
  { id: 'diesel' as PanelView, label: 'ДИЗЕЛЬ', icon: Settings2, color: 'cyan' as const },
  { id: 'fuel' as PanelView, label: 'ТОПЛИВО', icon: Fuel, color: 'green' as const },
  { id: 'brakes' as PanelView, label: 'ТОРМОЗА', icon: Disc, color: 'purple' as const },
  { id: 'electric' as PanelView, label: 'ЭЛЕКТРИКА', icon: Zap, color: 'yellow' as const },
  { id: 'alerts' as PanelView, label: 'АЛЕРТЫ', icon: AlertTriangle, color: 'red' as const },
  { id: 'trends' as PanelView, label: 'ТРЕНДЫ', icon: TrendingUp, color: 'blue' as const },
];

const colorMap = {
  cyan: { active: 'bg-cyan-500 text-white border-transparent', idle: 'bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 border-slate-800' },
  green: { active: 'bg-green-500 text-white border-transparent', idle: 'bg-green-500/20 text-green-400 hover:bg-green-500/30 border-slate-800' },
  purple: { active: 'bg-purple-500 text-white border-transparent', idle: 'bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 border-slate-800' },
  yellow: { active: 'bg-yellow-500 text-white border-transparent', idle: 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30 border-slate-800' },
  red: { active: 'bg-red-500 text-white border-transparent', idle: 'bg-red-500/20 text-red-400 hover:bg-red-500/30 border-slate-800' },
  blue: { active: 'bg-blue-500 text-white border-transparent', idle: 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 border-slate-800' },
};

export default function CabinPage() {
  const router = useRouter();
  const telemetry = useTelemetry();
  const [activePanel, setActivePanel] = useState<PanelView>('diesel');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const loco = params.get('loco');
    if (!loco) return;
    setKtzLocoNumber(decodeURIComponent(loco));
    router.replace('/', { scroll: false });
  }, [router]);

  const panels = useMemo(() => {
    if (telemetry.locomotiveType === 'KZ8A') {
      return PANEL_DEFS.filter(p => p.id !== 'diesel' && p.id !== 'fuel');
    }
    return PANEL_DEFS.filter(p => p.id !== 'electric');
  }, [telemetry.locomotiveType]);

  useEffect(() => {
    const kz = telemetry.locomotiveType === 'KZ8A';
    setActivePanel(prev => {
      if (kz && (prev === 'diesel' || prev === 'fuel')) return 'electric';
      if (!kz && prev === 'electric') return 'diesel';
      return prev;
    });
  }, [telemetry.locomotiveType]);

  return (
    <>
      <div className="grid grid-cols-12 gap-6 mb-6">
        <div className="col-span-8">
          <HealthIndicatorDetailed telemetry={telemetry} />
        </div>
        <div className="col-span-4">
          <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-8 h-full flex items-center justify-center">
            <Speedometer speed={telemetry.speed} />
          </div>
        </div>
      </div>

      <div className="flex gap-3 mb-6">
        {panels.map((panel) => {
          const Icon = panel.icon;
          const isActive = activePanel === panel.id;
          const classes = colorMap[panel.color as keyof typeof colorMap];
          return (
            <button
              key={panel.id}
              onClick={() => setActivePanel(panel.id)}
              className={`flex-1 min-w-0 flex items-center justify-center gap-2 px-4 py-4 rounded-xl font-bold text-sm uppercase tracking-wider transition-all border-2 ${
                isActive ? classes.active : classes.idle
              }`}
            >
              <Icon className="w-5 h-5" />
              {panel.label}
            </button>
          );
        })}
      </div>

      <div className="mb-6">
        {activePanel === 'diesel' && <DieselPanel telemetry={telemetry} />}
        {activePanel === 'fuel' && <FuelPanel telemetry={telemetry} />}
        {activePanel === 'brakes' && <BrakesPanel telemetry={telemetry} />}
        {activePanel === 'electric' && <ElectricPanel telemetry={telemetry} />}
        {activePanel === 'alerts' && <AlertsPanel alerts={telemetry.alerts} />}
        {activePanel === 'trends' && <TrendsPanel />}
      </div>

      <div className="grid grid-cols-2 gap-6">
        <DiagnosticsLog logs={telemetry.diagnostics} />
        <TrackSchematic
          currentStation={telemetry.route.currentStation}
          nextStation={telemetry.route.nextStation}
          progress={telemetry.route.progress}
          gradient={telemetry.route.gradient}
        />
      </div>

      <div className="mt-6">
        <span className="text-sm text-slate-600">© 2026 Мониторинг локомотивов КТЖ</span>
      </div>
    </>
  );
}
