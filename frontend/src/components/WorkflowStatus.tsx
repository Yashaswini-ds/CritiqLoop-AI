import React from 'react';
import { Activity, CheckCircle, AlertTriangle, XCircle, RefreshCw } from 'lucide-react';

interface WorkflowStatusProps {
  status: 'IDLE' | 'RUNNING' | 'APPROVED' | 'MAX_ITERATIONS_REACHED' | 'FAILED' | 'IN_PROGRESS';
  iterationsUsed: number;
  maxIterations: number;
  finalQuality: number | null;
}

export const WorkflowStatus: React.FC<WorkflowStatusProps> = ({
  status,
  iterationsUsed,
  maxIterations,
  finalQuality,
}) => {
  const getStatusBadge = () => {
    switch (status) {
      case 'RUNNING':
      case 'IN_PROGRESS':
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 rounded-full text-xs font-medium">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Executing Loop...
          </span>
        );
      case 'APPROVED':
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-full text-xs font-medium">
            <CheckCircle className="w-3.5 h-3.5" /> Approved
          </span>
        );
      case 'MAX_ITERATIONS_REACHED':
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded-full text-xs font-medium">
            <AlertTriangle className="w-3.5 h-3.5" /> Max Iterations Reached
          </span>
        );
      case 'FAILED':
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 bg-rose-500/10 text-rose-400 border border-rose-500/30 rounded-full text-xs font-medium">
            <XCircle className="w-3.5 h-3.5" /> Failed
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 bg-slate-800 text-slate-400 border border-slate-700 rounded-full text-xs font-medium">
            <Activity className="w-3.5 h-3.5" /> Idle
          </span>
        );
    }
  };

  return (
    <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-xl">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-slate-200">Workflow Summary</h3>
        {getStatusBadge()}
      </div>

      <div className="grid grid-cols-2 gap-4 text-xs">
        <div className="bg-slate-950/40 p-3 rounded-lg border border-slate-800/80">
          <div className="text-slate-400 mb-1">Iterations Used</div>
          <div className="text-lg font-bold text-slate-100">
            {iterationsUsed} <span className="text-xs font-normal text-slate-500">/ {maxIterations}</span>
          </div>
        </div>

        <div className="bg-slate-950/40 p-3 rounded-lg border border-slate-800/80">
          <div className="text-slate-400 mb-1">Final Quality Score</div>
          <div className="text-lg font-bold text-slate-100">
            {finalQuality !== null ? `${finalQuality} / 10` : 'N/A'}
          </div>
        </div>
      </div>
    </div>
  );
};
