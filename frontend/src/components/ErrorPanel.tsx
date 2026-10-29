import React from 'react';
import { AlertOctagon } from 'lucide-react';

interface ErrorPanelProps {
  errorMessage: string;
}

export const ErrorPanel: React.FC<ErrorPanelProps> = ({ errorMessage }) => {
  if (!errorMessage) return null;

  return (
    <div className="bg-rose-950/40 border border-rose-500/40 p-5 rounded-xl text-rose-200 space-y-2">
      <div className="flex items-center gap-2 text-rose-400 font-semibold text-sm">
        <AlertOctagon className="w-5 h-5" /> Execution Failure Diagnostic
      </div>
      <p className="text-xs text-slate-300 bg-slate-950/60 p-3 rounded-lg border border-rose-900/50 font-mono">
        {errorMessage}
      </p>
    </div>
  );
};
