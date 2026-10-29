import React from 'react';
import { Search, RefreshCw, CheckCircle2, AlertTriangle, XCircle, ThumbsUp, ThumbsDown, MessageSquare } from 'lucide-react';
import type { IterationHistoryItem } from '../types/api';

export type ReviewerStatus = 'READY' | 'ANALYZING' | 'APPROVED' | 'REJECTED' | 'FAILED';

interface ReviewerAgentProps {
  status: ReviewerStatus;
  latestReview: IterationHistoryItem | null;
  qualityThreshold: number;
}

export const ReviewerAgent: React.FC<ReviewerAgentProps> = ({
  status,
  latestReview,
  qualityThreshold,
}) => {
  const getStatusBadge = () => {
    switch (status) {
      case 'ANALYZING':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 rounded-full text-xs font-semibold animate-pulse">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Evaluating Candidate Draft...
          </span>
        );
      case 'APPROVED':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-full text-xs font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5" /> Quality Approved
          </span>
        );
      case 'REJECTED':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded-full text-xs font-semibold">
            <AlertTriangle className="w-3.5 h-3.5" /> Refinement Requested
          </span>
        );
      case 'FAILED':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 bg-rose-500/10 text-rose-400 border border-rose-500/30 rounded-full text-xs font-semibold">
            <XCircle className="w-3.5 h-3.5" /> Critique Failed
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-800 text-slate-400 border border-slate-700 rounded-full text-xs font-semibold">
            ● Ready
          </span>
        );
    }
  };

  return (
    <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl flex flex-col justify-between space-y-4 shadow-xl">
      {/* Agent Header */}
      <div className="flex items-start justify-between border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-xl shadow-inner">
            🔍
          </div>
          <div>
            <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2">
              Reviewer Agent
            </h3>
            <p className="text-[11px] text-purple-400 font-medium">Evaluates the candidate against relevance, clarity, completeness and quality.</p>
          </div>
        </div>
        {getStatusBadge()}
      </div>

      {/* Agent Evaluation Output Area */}
      <div className="space-y-3 flex-1 text-xs">
        <div className="flex items-center justify-between text-slate-400">
          <span className="flex items-center gap-1.5 font-semibold text-slate-300">
            <Search className="w-3.5 h-3.5 text-purple-400" /> Evaluation Critique Container
          </span>
          <span className="text-[10px] text-slate-500 font-sans">
            Req: &ge;{qualityThreshold}/10
          </span>
        </div>

        <div className="bg-slate-950/80 border border-slate-800/90 rounded-xl p-3.5 min-h-[160px] max-h-[220px] overflow-y-auto text-[11px] text-slate-300 leading-relaxed space-y-3">
          {status === 'ANALYZING' ? (
            <div className="flex flex-col items-center justify-center h-32 space-y-2 text-slate-400">
              <RefreshCw className="w-5 h-5 animate-spin text-purple-400" />
              <p className="italic">Scoring relevance, clarity, and completeness...</p>
            </div>
          ) : latestReview ? (
            <div className="space-y-3">
              {/* Metric Scores Grid */}
              <div className="grid grid-cols-4 gap-1.5 text-center">
                <div className="bg-slate-900/80 p-1.5 rounded-lg border border-slate-800">
                  <div className="text-slate-500 text-[9px] uppercase font-semibold">Rel</div>
                  <div className="text-xs font-bold text-indigo-400">{latestReview.relevance}/10</div>
                </div>
                <div className="bg-slate-900/80 p-1.5 rounded-lg border border-slate-800">
                  <div className="text-slate-500 text-[9px] uppercase font-semibold">Cla</div>
                  <div className="text-xs font-bold text-indigo-400">{latestReview.clarity}/10</div>
                </div>
                <div className="bg-slate-900/80 p-1.5 rounded-lg border border-slate-800">
                  <div className="text-slate-500 text-[9px] uppercase font-semibold">Com</div>
                  <div className="text-xs font-bold text-indigo-400">{latestReview.completeness}/10</div>
                </div>
                <div className="bg-slate-900/80 p-1.5 rounded-lg border border-slate-800">
                  <div className="text-slate-500 text-[9px] uppercase font-semibold">Overall</div>
                  <div
                    className={`text-xs font-bold ${
                      latestReview.overall_quality >= qualityThreshold
                        ? 'text-emerald-400'
                        : 'text-amber-400'
                    }`}
                  >
                    {latestReview.overall_quality}/10
                  </div>
                </div>
              </div>

              {/* Strengths & Weaknesses */}
              <div className="space-y-1.5 text-[10px]">
                {latestReview.strengths && latestReview.strengths.length > 0 && (
                  <div className="bg-emerald-950/20 border border-emerald-500/20 p-2 rounded-lg">
                    <div className="flex items-center gap-1 text-emerald-400 font-semibold mb-0.5">
                      <ThumbsUp className="w-3 h-3" /> Strengths
                    </div>
                    <ul className="space-y-0.5 text-slate-300">
                      {latestReview.strengths.map((s, i) => (
                        <li key={i}>✓ {s}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {latestReview.weaknesses && latestReview.weaknesses.length > 0 && (
                  <div className="bg-rose-950/20 border border-rose-500/20 p-2 rounded-lg">
                    <div className="flex items-center gap-1 text-rose-400 font-semibold mb-0.5">
                      <ThumbsDown className="w-3 h-3" /> Needs Improvement
                    </div>
                    <ul className="space-y-0.5 text-slate-300">
                      {latestReview.weaknesses.map((w, i) => (
                        <li key={i}>✗ {w}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {latestReview.feedback && (
                  <div className="bg-purple-950/20 border border-purple-500/20 p-2 rounded-lg">
                    <div className="flex items-center gap-1 text-purple-300 font-semibold mb-0.5">
                      <MessageSquare className="w-3 h-3" /> Actionable Feedback
                    </div>
                    <p className="text-slate-300 italic">"{latestReview.feedback}"</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-32 text-slate-600 italic">
              Awaiting candidate draft from Content Creator Agent.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
