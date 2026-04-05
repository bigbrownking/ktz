'use client';

import { Lightbulb, ChevronRight } from 'lucide-react';
import { Recommendation } from '@/shared/lib/mock-data';

interface Props {
  recommendations: Recommendation[];
}

const getPriorityStyle = (priority: Recommendation['priority']) => {
  switch (priority) {
    case 'high': return 'border-l-4 border-green-400 bg-green-500/5';
    case 'medium': return 'border-l-4 border-orange-400 bg-orange-500/5';
    case 'low': return 'border-l-4 border-blue-400 bg-blue-500/5';
  }
};

export function AIRecommendations({ recommendations }: Props) {
  return (
    <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-6 h-full">
      <div className="flex items-center gap-2 mb-4">
        <Lightbulb className="w-5 h-5 text-cyan-400" />
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Рекомендации ИИ</h3>
      </div>

      <div className="space-y-3">
        {recommendations.map((rec) => (
          <div
            key={rec.id}
            className={`${getPriorityStyle(rec.priority)} rounded-lg p-4 hover:bg-slate-800/50 transition-colors cursor-pointer group`}
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <h4 className="text-sm font-semibold text-white">{rec.title}</h4>
              <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 transition-colors flex-shrink-0" />
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">{rec.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
