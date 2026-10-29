import React from 'react';
import { Terminal, RefreshCw, CheckCircle2, AlertTriangle, XCircle, FileText } from 'lucide-react';

export type CreatorStatus = 'READY' | 'GENERATING' | 'REFINING' | 'COMPLETE' | 'WAITING' | 'FAILED';

interface CreatorAgentProps {
  status: CreatorStatus;
  currentDraft?: string;
  iteration: number;
  maxIterations: number;
}

export const CreatorAgent: React.FC<CreatorAgentProps> = ({
  status,
  currentDraft,
  iteration,
  maxIterations,
}) => {
  const getStatusBadge = () => {
    switch (status) {
      case 'GENERATING':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 rounded-full text-xs font-semibold animate-pulse">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Generating Initial Draft...
          </span>
        );
      case 'REFINING':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded-full text-xs font-semibold animate-pulse">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Refining Content...
          </span>
        );
      case 'COMPLETE':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-full text-xs font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5" /> Generation Complete
          </span>
        );
      case 'WAITING':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-800 text-slate-400 border border-slate-700 rounded-full text-xs font-semibold">
            <AlertTriangle className="w-3.5 h-3.5" /> Awaiting Reviewer Critique
          </span>
        );
      case 'FAILED':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 bg-rose-500/10 text-rose-400 border border-rose-500/30 rounded-full text-xs font-semibold">
            <XCircle className="w-3.5 h-3.5" /> Generation Failed
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
          <div className="w-11 h-11 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-xl shadow-inner">
            👨‍💻
          </div>
          <div>
            <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2">
              Content Creator Agent
            </h3>
            <p className="text-[11px] text-indigo-400 font-medium">Generates and refines candidate content based on task and feedback.</p>
          </div>
        </div>
        {getStatusBadge()}
      </div>

      {/* Agent Workspace Content */}
      <div className="space-y-3 flex-1 text-xs">
        <div className="flex items-center justify-between text-slate-400">
          <span className="flex items-center gap-1.5 font-semibold text-slate-300">
            <Terminal className="w-3.5 h-3.5 text-indigo-400" /> Active Candidate Draft
          </span>
          {iteration > 0 && (
            <span className="bg-indigo-950/60 border border-indigo-500/30 text-indigo-300 px-2 py-0.5 rounded text-[10px] font-semibold">
              Draft #{iteration} / {maxIterations}
            </span>
          )}
        </div>

        <div className="bg-slate-950/80 border border-slate-800/90 rounded-xl p-3.5 min-h-[160px] max-h-[220px] overflow-y-auto font-mono text-[11px] text-slate-300 leading-relaxed space-y-2">
          {status === 'GENERATING' ? (
            <div className="flex flex-col items-center justify-center h-32 space-y-2 text-slate-400">
              <RefreshCw className="w-5 h-5 animate-spin text-indigo-400" />
              <p className="italic">Generating initial candidate draft...</p>
            </div>
          ) : status === 'REFINING' ? (
            <div className="flex flex-col items-center justify-center h-32 space-y-2 text-slate-400">
              <RefreshCw className="w-5 h-5 animate-spin text-amber-400" />
              <p className="italic">Refining draft using Reviewer feedback...</p>
            </div>
          ) : currentDraft ? (
            <div>
              <div className="text-[10px] text-slate-500 font-sans mb-1.5 pb-1 border-b border-slate-800/50 flex items-center gap-1">
                <FileText className="w-3 h-3" /> Candidate Content
              </div>
              <div className="whitespace-pre-wrap">{currentDraft}</div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-32 text-slate-600 italic">
              Awaiting Orchestrator task assignment.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
