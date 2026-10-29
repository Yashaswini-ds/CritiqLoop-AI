import React from 'react';

interface ScoreCardsProps {
  relevance: number;
  clarity: number;
  completeness: number;
  overallQuality: number;
}

export const ScoreCards: React.FC<ScoreCardsProps> = ({
  relevance,
  clarity,
  completeness,
  overallQuality,
}) => {
  const getBadgeColor = (score: number) => {
    if (score >= 8) return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
    if (score >= 6) return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
    return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
  };

  const getLabel = (score: number) => {
    if (score >= 9) return 'Excellent';
    if (score >= 8) return 'Pass';
    if (score >= 6) return 'Acceptable';
    return 'Needs Work';
  };

  const cards = [
    { name: 'Relevance', score: relevance },
    { name: 'Clarity', score: clarity },
    { name: 'Completeness', score: completeness },
    { name: 'Overall Quality', score: overallQuality, highlight: true },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((c) => (
        <div
          key={c.name}
          className={`p-4 rounded-xl border ${
            c.highlight
              ? 'bg-slate-800/80 border-indigo-500/50 shadow-lg shadow-indigo-500/10'
              : 'bg-slate-900/60 border-slate-800'
          }`}
        >
          <div className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">
            {c.name}
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-100">
              {c.score} <span className="text-xs font-normal text-slate-500">/ 10</span>
            </span>
            <span
              className={`px-2 py-0.5 text-xs font-semibold rounded-full border ${getBadgeColor(
                c.score
              )}`}
            >
              {getLabel(c.score)}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};
