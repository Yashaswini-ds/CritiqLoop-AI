import React, { useState } from 'react';
import { UserCheck, CheckCircle2, MessageSquarePlus, XCircle, Send, CornerDownRight } from 'lucide-react';

interface HumanReviewProps {
  draft: string;
  onApprove: () => void;
  onRequestChanges: (feedback: string) => void;
  onReject: () => void;
  disabled?: boolean;
}

export const HumanReview: React.FC<HumanReviewProps> = ({
  draft,
  onApprove,
  onRequestChanges,
  onReject,
  disabled = false,
}) => {
  const [showFeedbackInput, setShowFeedbackInput] = useState(false);
  const [feedback, setFeedback] = useState('');

  const handleSendBack = (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedback.trim()) return;
    onRequestChanges(feedback.trim());
  };

  return (
    <div className="bg-slate-900/90 border-2 border-indigo-500/50 p-6 rounded-2xl space-y-6 shadow-2xl shadow-indigo-500/10">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-600/20 border border-indigo-500/30 rounded-xl text-indigo-400">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              🛑 HUMAN REVIEW
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono">
                Awaiting Human Decision
              </span>
            </h3>
            <p className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
              Review candidate draft output ({draft ? `${draft.length} chars` : 'Ready'}) and choose next workflow action.
            </p>
          </div>
        </div>
      </div>

      {/* Decision Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Button 1: Approve */}
        <button
          onClick={onApprove}
          disabled={disabled}
          className="flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-emerald-600/20 disabled:opacity-50 cursor-pointer"
        >
          <CheckCircle2 className="w-4 h-4" />
          Approve Content
        </button>

        {/* Button 2: Request Changes */}
        <button
          onClick={() => setShowFeedbackInput(!showFeedbackInput)}
          disabled={disabled}
          className={`flex items-center justify-center gap-2 px-4 py-3 text-xs font-bold rounded-xl transition-all border shadow-lg cursor-pointer ${
            showFeedbackInput
              ? 'bg-amber-600 border-amber-500 text-white shadow-amber-600/20'
              : 'bg-slate-800 hover:bg-slate-700 border-amber-500/50 text-amber-300 shadow-slate-900/50'
          }`}
        >
          <MessageSquarePlus className="w-4 h-4 text-amber-400" />
          Request Changes
        </button>

        {/* Button 3: Reject */}
        <button
          onClick={onReject}
          disabled={disabled}
          className="flex items-center justify-center gap-2 px-4 py-3 bg-rose-950/60 hover:bg-rose-900/80 border border-rose-500/50 text-rose-300 text-xs font-bold rounded-xl transition-all shadow-lg disabled:opacity-50 cursor-pointer"
        >
          <XCircle className="w-4 h-4 text-rose-400" />
          Reject Draft
        </button>
      </div>

      {/* Human Feedback Input Form */}
      {showFeedbackInput && (
        <form onSubmit={handleSendBack} className="bg-slate-950 border border-amber-500/40 p-4 rounded-xl space-y-3">
          <div className="flex items-center justify-between text-xs font-semibold text-amber-300">
            <span className="flex items-center gap-1.5">
              <CornerDownRight className="w-4 h-4 text-amber-400" /> Human Feedback Instructions
            </span>
            <span className="text-[10px] text-slate-400 font-mono">Feedback will guide Creator Agent refinement</span>
          </div>

          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            disabled={disabled}
            rows={3}
            placeholder="Add more real-world examples and improve conclusion..."
            className="w-full bg-slate-900 border border-slate-800 rounded-lg p-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 leading-relaxed font-sans"
          />

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={disabled || !feedback.trim()}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition-all shadow-lg shadow-indigo-600/20 disabled:opacity-50 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              [ SEND BACK TO AGENT ]
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
