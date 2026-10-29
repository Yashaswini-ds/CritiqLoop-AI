import React from 'react';
import { ShieldCheck, ShieldAlert, CheckCircle2, XCircle } from 'lucide-react';

interface QualityGateProps {
  threshold: number;
  overallQuality: number;
  reviewerApproved: boolean;
  status: string;
}

export const QualityGate: React.FC<QualityGateProps> = ({
  threshold,
  overallQuality,
  reviewerApproved,
  status,
}) => {
  const scorePass = overallQuality >= threshold;
  const approvedPass = reviewerApproved === true;
  const isPassed = scorePass && approvedPass;

  return (
    <div
      className={`p-5 rounded-xl border transition-all ${
        isPassed
          ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
          : 'bg-amber-950/30 border-amber-500/40 text-amber-300'
      }`}
    >
      <div className="flex items-center gap-3 mb-4">
        {isPassed ? (
          <ShieldCheck className="w-6 h-6 text-emerald-400 shrink-0" />
        ) : (
          <ShieldAlert className="w-6 h-6 text-amber-400 shrink-0" />
        )}
        <div>
          <h3 className="font-bold text-slate-100 text-base flex items-center gap-2">
            Quality Gate Decision
            <span
              className={`px-2 py-0.5 text-xs font-bold rounded ${
                isPassed ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              }`}
            >
              {isPassed ? 'PASS (APPROVED)' : status === 'MAX_ITERATIONS_REACHED' ? 'MAX ITERATIONS REACHED' : 'REFINEMENT REQUIRED'}
            </span>
          </h3>
          <p className="text-xs text-slate-400">
            Enforced Rule: Overall Quality &ge; {threshold}/10 AND Reviewer Approved == True
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
        {/* Condition 1: Numeric Score Threshold */}
        <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-slate-400 font-medium mb-0.5">Condition 1: Quality Threshold</div>
            <div className="text-slate-200 font-semibold">
              Score: <span className="text-slate-100 font-bold">{overallQuality}/10</span> (Req: &ge;{threshold}/10)
            </div>
          </div>
          {scorePass ? (
            <span className="flex items-center gap-1 px-2 py-0.5 bg-emerald-500/10 text-emerald-400 rounded font-semibold border border-emerald-500/20">
              <CheckCircle2 className="w-3.5 h-3.5" /> PASS
            </span>
          ) : (
            <span className="flex items-center gap-1 px-2 py-0.5 bg-rose-500/10 text-rose-400 rounded font-semibold border border-rose-500/20">
              <XCircle className="w-3.5 h-3.5" /> FAIL
            </span>
          )}
        </div>

        {/* Condition 2: Reviewer Approval Flag */}
        <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-slate-400 font-medium mb-0.5">Condition 2: Reviewer Approval</div>
            <div className="text-slate-200 font-semibold">
              Flag: <span className="text-slate-100 font-bold">{reviewerApproved ? 'True' : 'False'}</span> (Req: True)
            </div>
          </div>
          {approvedPass ? (
            <span className="flex items-center gap-1 px-2 py-0.5 bg-emerald-500/10 text-emerald-400 rounded font-semibold border border-emerald-500/20">
              <CheckCircle2 className="w-3.5 h-3.5" /> PASS
            </span>
          ) : (
            <span className="flex items-center gap-1 px-2 py-0.5 bg-rose-500/10 text-rose-400 rounded font-semibold border border-rose-500/20">
              <XCircle className="w-3.5 h-3.5" /> FAIL
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
