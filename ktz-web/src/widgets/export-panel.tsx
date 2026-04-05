'use client';

import { useState } from 'react';
import { Download, FileText, Table2, Clock } from 'lucide-react';
import { useTelemetryContext } from '@/shared/lib/telemetry-context';
import { exportCSV, exportPDF } from '@/shared/lib/export-utils';

export function ExportPanel() {
  const { buffer, locomotiveNumber } = useTelemetryContext();
  const [exporting, setExporting] = useState<'csv' | 'pdf' | null>(null);

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
    <div className="flex items-center gap-2 flex-wrap">
      <div className="flex items-center gap-1.5 text-xs text-slate-500">
        <Clock className="w-3.5 h-3.5" />
        <span>{count > 0 ? `${count} записей за 15 мин` : 'Накапливается данные...'}</span>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={doCSV}
          disabled={count === 0 || exporting !== null}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ background: '#1e1e1e', border: '1px solid #333', color: '#10b981' }}
        >
          <Table2 className="w-3.5 h-3.5" />
          {exporting === 'csv' ? 'Экспорт...' : 'CSV'}
        </button>
        <button
          onClick={doPDF}
          disabled={count === 0 || exporting !== null}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ background: '#1e1e1e', border: '1px solid #333', color: '#06b6d4' }}
        >
          {exporting === 'pdf' ? <Download className="w-3.5 h-3.5 animate-spin" /> : <FileText className="w-3.5 h-3.5" />}
          {exporting === 'pdf' ? 'Экспорт...' : 'PDF'}
        </button>
      </div>
    </div>
  );
}
