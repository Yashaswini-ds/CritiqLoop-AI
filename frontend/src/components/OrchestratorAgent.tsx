import React from 'react';
import { RefreshCw, CheckCircle2, AlertTriangle, XCircle, GitBranch } from 'lucide-react';

export type OrchestratorStatus = 'IDLE' | 'ROUTING' | 'DECIDING' | 'EVALUATING_RETRIES' | 'COMPLETE' | 'FAILED';

interface OrchestratorAgentProps {
  status: OrchestratorStatus;
  currentIteration: number;
  maxIterations: number;
  qualityThreshold: number;
  finalStatus?: string;
}

export const OrchestratorAgent: React.FC<OrchestratorAgentProps> = ({
  status,
  currentIteration,
  maxIterations,
  qualityThreshold,
  finalStatus,
}) => {
  const currentRetry = currentIteration > 0 ? currentIteration : 0;
  const canRetry = currentRetry < maxIterations;

  const getStatusBadge = () => {
    switch (status) {
      case 'ROUTING':
      case 'DECIDING':
      case 'EVALUATING_RETRIES':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 rounded-full text-xs font-semibold animate-pulse">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Orchestrating Loop...
          </span>
        );
      case 'COMPLETE':
        if (finalStatus === 'APPROVED') {
          return (
            <span className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-full text-xs font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5" /> Workflow Approved
            </span>
          );
        }
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded-full text-xs font-semibold">
            <AlertTriangle className="w-3.5 h-3.5" /> Max Retries Reached
          </span>
        );
      case 'FAILED':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 bg-rose-500/10 text-rose-400 border border-rose-500/30 rounded-full text-xs font-semibold">
            <XCircle className="w-3.5 h-3.5" /> Workflow Terminated
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-800 text-slate-400 border border-slate-700 rounded-full text-xs font-semibold">
            ● System Standby
          </span>
        );
    }
  };

  return (
    <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl flex flex-col justify-between space-y-4 shadow-xl">
      {/* Header */}
      <div className="flex items-start justify-between border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-xl shadow-inner">
            🧠
          </div>
          <div>
            <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2">
              Orchestrator Agent
            </h3>
            <p className="text-[11px] text-blue-400 font-medium">Coordinates Content Creator and Reviewer and decides the next workflow step.</p>
          </div>
        </div>
        {getStatusBadge()}
      </div>

      {/* Orchestration Rules & Retry Bound Evaluator */}
      <div className="space-y-3 flex-1 text-xs">
        <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-xl space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="flex items-center gap-1.5 font-semibold text-slate-300">
              <GitBranch className="w-3.5 h-3.5 text-blue-400" /> Retry Limit Condition Check
            </span>
            <span className="font-mono text-slate-400">
              current_retry &lt; max_retries
            </span>
          </div>

          <div className="flex items-center justify-between bg-slate-900/90 p-2 rounded-lg border border-slate-800 font-mono text-[11px]">
            <span className="text-slate-400">
              {currentRetry} &lt; {maxIterations}
            </span>
            <span
              className={`font-semibold px-2 py-0.5 rounded text-[10px] ${
                status === 'COMPLETE' && finalStatus === 'MAX_ITERATIONS_REACHED'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : canRetry
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
              }`}
            >
              {status === 'COMPLETE' && finalStatus === 'MAX_ITERATIONS_REACHED'
                ? 'STOP (MAX RETRIES)'
                : canRetry
                ? 'ALLOW RETRY'
                : 'HALT WORKFLOW'}
            </span>
          </div>
        </div>

        <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 space-y-1.5 text-[11px]">
          <div className="text-slate-400 font-semibold flex items-center justify-between">
            <span>Workflow Decision Policy:</span>
          </div>
          <p className="text-slate-300">
            Routes state between Content Creator and Reviewer until <span className="text-emerald-400 font-semibold">Overall Quality &ge; {qualityThreshold}/10 AND Approved == True</span>, or max retry cap ({maxIterations}) is reached.
          </p>
        </div>
      </div>
    </div>
  );
};
