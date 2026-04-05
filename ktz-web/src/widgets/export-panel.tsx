'use client';

import { useState } from 'react';
import { Download, FileText, Table2, Clock } from 'lucide-react';
import { useTelemetryContext } from '@/shared/lib/telemetry-context';
import { useAuth } from '@/shared/lib/auth-context';
import { isAdmin } from '@/shared/lib/auth-store';
import { exportCSV, exportPDF } from '@/shared/lib/export-utils';

type ExportPanelProps = { variant?: 'default' | 'header' };

export function ExportPanel({ variant = 'default' }: ExportPanelProps) {
  const { buffer, locomotiveNumber: bufferLoco } = useTelemetryContext();
  const { session } = useAuth();
  const [exporting, setExporting] = useState<'csv' | 'pdf' | null>(null);
  const compact = variant === 'header';

  /** Для машиниста в подписи файла — номер из сессии, если есть (совпадает с ktz_loco_number) */
  const locomotiveNumber =
    session && !isAdmin(session) && session.locomotiveNumber
      ? session.locomotiveNumber
      : bufferLoco;

  const from15min = buffer.filter(s => s.ts > Date.now() - 15 * 60 * 1000);
  const count = from15min.length;

  const doCSV = async () => {
    setExporting('csv');
    try { exportCSV(from15min, locomotiveNumber); }
    finally { setExporting(null); }
  };

  const doPDF = async () => {
    setExporting('pdf');
    try { await exportPDF(from15min, locomotiveNumber); }
    finally { setExporting(null); }
  };

  return (
    <div
      className={
        compact
          ? 'flex flex-row flex-wrap items-center gap-2'
          : 'flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3 flex-wrap'
      }
    >
      <div className={compact ? 'flex items-center gap-1.5 min-w-0' : 'flex flex-col gap-0.5'}>
        {!compact && (
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Экспорт · последние 15 мин</span>
        )}
        <div className={`flex items-center gap-1.5 ${compact ? 'text-[11px] text-slate-500' : 'text-xs text-slate-500'}`}>
          <Clock className={`shrink-0 ${compact ? 'w-3 h-3' : 'w-3.5 h-3.5'}`} />
          <span className="truncate">
            {compact ? (
              <>
                <span className="text-slate-400 hidden md:inline">Экспорт 15 мин · </span>
                {count > 0 ? `${count} запис.` : 'буфер…'}
              </>
            ) : (
              <>{count > 0 ? `${count} записей в буфере` : 'Накапливаются данные…'}</>
            )}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-1.5 sm:gap-2">
        <button
          type="button"
          onClick={doCSV}
          disabled={count === 0 || exporting !== null}
          className={`flex items-center gap-1 rounded-lg font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
            compact ? 'px-2 py-1 text-[11px]' : 'gap-1.5 px-3 py-1.5 text-sm'
          }`}
          style={{ background: '#1e1e1e', border: '1px solid #333', color: '#10b981' }}
        >
          <Table2 className={compact ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
          {exporting === 'csv' ? '…' : 'CSV'}
        </button>
        <button
          type="button"
          onClick={doPDF}
          disabled={count === 0 || exporting !== null}
          className={`flex items-center gap-1 rounded-lg font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
            compact ? 'px-2 py-1 text-[11px]' : 'gap-1.5 px-3 py-1.5 text-sm'
          }`}
          style={{ background: '#1e1e1e', border: '1px solid #333', color: '#06b6d4' }}
        >
          {exporting === 'pdf' ? <Download className={`animate-spin ${compact ? 'w-3 h-3' : 'w-3.5 h-3.5'}`} /> : <FileText className={compact ? 'w-3 h-3' : 'w-3.5 h-3.5'} />}
          {exporting === 'pdf' ? '…' : 'PDF'}
        </button>
      </div>
    </div>
  );
}
