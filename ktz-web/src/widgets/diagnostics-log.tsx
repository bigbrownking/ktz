'use client';

import { FileText } from 'lucide-react';
import { DiagnosticLog } from '@/shared/lib/mock-data';

interface Props {
  logs: DiagnosticLog[];
}

export function DiagnosticsLog({ logs }: Props) {
  return (
    <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-6 h-full">
      <div className="flex items-center gap-2 mb-4">
        <FileText className="w-5 h-5 text-slate-500" />
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
          Журнал диагностики
        </h3>
      </div>

      <div className="space-y-3">
        {logs.map((log) => (
          <div key={log.id} className="flex items-start gap-3 text-sm">
            <div className="w-2 h-2 bg-green-400 rounded-full mt-1.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-slate-300">{log.message}</p>
              <p className="text-xs text-slate-500 mt-1">
                {log.timestamp} • {log.source}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
