import React from 'react';
import { ArrowRight, ArrowLeft, RefreshCw } from 'lucide-react';

interface WorkflowConnectorProps {
  status: 'IDLE' | 'RUNNING' | 'APPROVED' | 'MAX_ITERATIONS_REACHED' | 'FAILED' | 'IN_PROGRESS';
  activeDirection: 'FORWARD' | 'BACKWARD' | 'IDLE';
  iteration: number;
}

export const WorkflowConnector: React.FC<WorkflowConnectorProps> = ({
  status,
  activeDirection,
  iteration,
}) => {
  const isRunning = status === 'RUNNING' || status === 'IN_PROGRESS';

  return (
    <div className="hidden lg:flex flex-col items-center justify-center space-y-6 px-4 py-8 self-center">
      {/* Draft Transmission (Left -> Right) */}
      <div
        className={`flex flex-col items-center p-3 rounded-xl border transition-all ${
          activeDirection === 'FORWARD' || isRunning
            ? 'bg-indigo-600/20 border-indigo-500/50 text-indigo-300 shadow-lg shadow-indigo-500/10 animate-pulse'
            : 'bg-slate-900/50 border-slate-800 text-slate-500'
        }`}
      >
        <span className="text-[10px] font-bold uppercase tracking-wider mb-1">
          {isRunning ? `Draft #${iteration || 1}` : 'Draft'}
        </span>
        <div className="flex items-center gap-1">
          <ArrowRight className={`w-5 h-5 ${isRunning ? 'text-indigo-400 animate-bounce' : 'text-slate-600'}`} />
        </div>
      </div>

      {/* Center Loop Indicator */}
      <div className="flex flex-col items-center text-center">
        <div className="w-10 h-10 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center shadow-inner">
          <RefreshCw className={`w-4 h-4 ${isRunning ? 'text-indigo-400 animate-spin' : 'text-slate-600'}`} />
        </div>
        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-1">
          Iterate
        </span>
      </div>

      {/* Feedback Transmission (Right -> Left) */}
      <div
        className={`flex flex-col items-center p-3 rounded-xl border transition-all ${
          activeDirection === 'BACKWARD'
            ? 'bg-amber-600/20 border-amber-500/50 text-amber-300 shadow-lg shadow-amber-500/10 animate-pulse'
            : 'bg-slate-900/50 border-slate-800 text-slate-500'
        }`}
      >
        <div className="flex items-center gap-1">
          <ArrowLeft className={`w-5 h-5 ${activeDirection === 'BACKWARD' ? 'text-amber-400 animate-bounce' : 'text-slate-600'}`} />
        </div>
        <span className="text-[10px] font-bold uppercase tracking-wider mt-1">
          Feedback
        </span>
      </div>
    </div>
  );
};
