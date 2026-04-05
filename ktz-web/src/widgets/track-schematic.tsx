'use client';

import { TrendingDown } from 'lucide-react';

interface Props {
  currentStation: string;
  nextStation: string;
  progress: number;
  gradient: number;
}

export function TrackSchematic({ currentStation, nextStation, progress, gradient }: Props) {
  return (
    <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-6 h-full">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Схема участка</h3>
        <div className="text-xs text-cyan-400 font-semibold">ЛИНИЯ 04-А • СЕВЕРНОЕ НАПРАВЛЕНИЕ</div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between items-end px-1">
          <div className="flex flex-col items-center gap-1">
            <div className="w-3 h-3 bg-cyan-400 rounded-full shadow-lg shadow-cyan-400/50" />
            <span className="text-xs font-semibold text-cyan-400">{currentStation}</span>
          </div>
          <span className="text-xs text-slate-500">{Math.round(progress)}% маршрута</span>
          <div className="flex flex-col items-center gap-1">
            <div className="w-3 h-3 bg-slate-600 rounded-full" />
            <span className="text-xs font-semibold text-slate-400">{nextStation}</span>
          </div>
        </div>

        <div className="relative mx-1" style={{ height: '48px' }}>
          <div
            className="absolute left-0 right-0 rounded-full"
            style={{ top: '50%', transform: 'translateY(-50%)', height: '4px', background: '#1e293b' }}
          />
          <div
            className="absolute left-0 rounded-full transition-all duration-1000"
            style={{
              top: '50%',
              transform: 'translateY(-50%)',
              height: '4px',
              width: `${Math.min(progress, 100)}%`,
              background: 'linear-gradient(90deg, #06b6d4, #10b981)',
              boxShadow: '0 0 8px rgba(6,182,212,0.5)',
            }}
          />
          <div
            className="absolute transition-all duration-1000"
            style={{
              left: `${Math.min(progress, 100)}%`,
              top: '50%',
              transform: 'translate(-50%, -50%)',
            }}
          >
            <div className="flex flex-col items-center gap-1">
              <div className="bg-slate-800 border border-cyan-500/50 px-1.5 py-0.5 rounded text-[10px] text-cyan-400 font-semibold whitespace-nowrap">
                БЛОК 8821
              </div>
              <div className="w-10 h-6 bg-gradient-to-r from-cyan-500 to-blue-500 rounded flex items-center justify-center shadow-lg shadow-cyan-500/50">
                <span className="text-[10px] font-bold text-white">8821</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-slate-800">
        <div>
          <div className="text-xs text-slate-500 mb-1">СЛЕД. СТАНЦИЯ</div>
          <div className="text-sm font-bold text-white">42 КМ</div>
        </div>
        <div>
          <div className="text-xs text-slate-500 mb-1">ETA</div>
          <div className="text-sm font-bold text-white">15:44 (UTC+6)</div>
        </div>
        <div>
          <div className="text-xs text-slate-500 mb-1 flex items-center gap-1">
            УКЛОН <TrendingDown className="w-3 h-3" />
          </div>
          <div className="text-sm font-bold text-white">{gradient}%</div>
        </div>
      </div>
    </div>
  );
}
