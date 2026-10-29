import React, { useState } from 'react';
import type { IterationHistoryItem } from '../types/api';
import { ScoreCards } from './ScoreCards';
import { ChevronDown, ChevronUp, FileText, MessageSquare, ThumbsUp, ThumbsDown } from 'lucide-react';

interface IterationTimelineProps {
  history: IterationHistoryItem[];
  qualityThreshold: number;
}

export const IterationTimeline: React.FC<IterationTimelineProps> = ({
  history,
  qualityThreshold,
}) => {
  const [expandedDrafts, setExpandedDrafts] = useState<Record<number, boolean>>({});

  const toggleDraft = (iteration: number) => {
    setExpandedDrafts((prev) => ({ ...prev, [iteration]: !prev[iteration] }));
  };

  if (!history || history.length === 0) return null;

  return (
    <div className="space-y-6">
      <h3 className="text-base font-semibold text-slate-200 flex items-center gap-2">
        <MessageSquare className="w-5 h-5 text-indigo-400" /> Iteration Audit Timeline ({history.length} {history.length === 1 ? 'Cycle' : 'Cycles'})
      </h3>

      <div className="relative border-l-2 border-slate-800 ml-3 pl-6 space-y-8">
        {history.map((item) => {
          const isPassed = item.overall_quality >= qualityThreshold && item.approved;
          const isDraftOpen = expandedDrafts[item.iteration];

          return (
            <div key={item.iteration} className="relative">
              {/* Circle Marker */}
              <div
                className={`absolute -left-[31px] top-1.5 w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold ${
                  isPassed
                    ? 'bg-emerald-950 border-emerald-500 text-emerald-400'
                    : 'bg-slate-900 border-amber-500 text-amber-400'
                }`}
              >
                {item.iteration}
              </div>

              <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-100 text-sm">
                    Iteration {item.iteration} Evaluation
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                      isPassed
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                    }`}
                  >
                    {isPassed ? 'Approved' : 'Refinement Required'}
                  </span>
                </div>

                {/* Score Cards */}
                <ScoreCards
                  relevance={item.relevance}
                  clarity={item.clarity}
                  completeness={item.completeness}
                  overallQuality={item.overall_quality}
                />

                {/* Strengths & Weaknesses */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="bg-slate-950/40 p-3 rounded-lg border border-slate-800/80">
                    <div className="flex items-center gap-1.5 text-emerald-400 font-semibold mb-2">
                      <ThumbsUp className="w-3.5 h-3.5" /> Strengths
                    </div>
                    {item.strengths && item.strengths.length > 0 ? (
                      <ul className="space-y-1 text-slate-300">
                        {item.strengths.map((s, idx) => (
                          <li key={idx} className="flex items-start gap-1.5">
                            <span className="text-emerald-400 font-bold">✓</span> {s}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-slate-500 italic">None specified</p>
                    )}
                  </div>

                  <div className="bg-slate-950/40 p-3 rounded-lg border border-slate-800/80">
                    <div className="flex items-center gap-1.5 text-rose-400 font-semibold mb-2">
                      <ThumbsDown className="w-3.5 h-3.5" /> Weaknesses
                    </div>
                    {item.weaknesses && item.weaknesses.length > 0 ? (
                      <ul className="space-y-1 text-slate-300">
                        {item.weaknesses.map((w, idx) => (
                          <li key={idx} className="flex items-start gap-1.5">
                            <span className="text-rose-400 font-bold">✗</span> {w}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-slate-500 italic">None specified</p>
                    )}
                  </div>
                </div>

                {/* Actionable Feedback */}
                <div className="bg-indigo-950/20 border border-indigo-500/20 p-3 rounded-lg text-xs">
                  <span className="font-semibold text-indigo-300">Actionable Guidance: </span>
                  <span className="text-slate-300">{item.feedback}</span>
                </div>

                {/* Draft Expandable Panel */}
                <div className="border-t border-slate-800 pt-3">
                  <button
                    onClick={() => toggleDraft(item.iteration)}
                    className="flex items-center justify-between w-full text-xs text-slate-400 hover:text-slate-200 transition-colors"
                  >
                    <span className="flex items-center gap-1.5 font-medium">
                      <FileText className="w-3.5 h-3.5 text-slate-400" />
                      {isDraftOpen ? 'Hide Iteration Draft' : 'View Iteration Candidate Draft'}
                    </span>
                    {isDraftOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>

                  {isDraftOpen && (
                    <div className="mt-3 p-4 bg-slate-950 rounded-lg text-xs text-slate-300 font-mono whitespace-pre-wrap border border-slate-800 max-h-96 overflow-y-auto">
                      {item.draft}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
