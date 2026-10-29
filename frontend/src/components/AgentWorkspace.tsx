import React from 'react';
import { OrchestratorAgent, type OrchestratorStatus } from './OrchestratorAgent';
import { CreatorAgent, type CreatorStatus } from './CreatorAgent';
import { ReviewerAgent, type ReviewerStatus } from './ReviewerAgent';
import type { IterationHistoryItem } from '../types/api';
import { GitBranch } from 'lucide-react';

interface AgentWorkspaceProps {
  status: 'IDLE' | 'RUNNING' | 'APPROVED' | 'MAX_ITERATIONS_REACHED' | 'FAILED' | 'IN_PROGRESS';
  currentDraft?: string;
  latestReview: IterationHistoryItem | null;
  iteration: number;
  maxIterations: number;
  qualityThreshold: number;
  hasHumanFeedback?: boolean;
}

export const AgentWorkspace: React.FC<AgentWorkspaceProps> = ({
  status,
  currentDraft,
  latestReview,
  iteration,
  maxIterations,
  qualityThreshold,
  hasHumanFeedback = false,
}) => {
  // Determine Orchestrator Status
  const getOrchestratorStatus = (): OrchestratorStatus => {
    if (status === 'RUNNING' || status === 'IN_PROGRESS') return 'ROUTING';
    if (status === 'FAILED') return 'FAILED';
    if (status === 'APPROVED' || status === 'MAX_ITERATIONS_REACHED') return 'COMPLETE';
    return 'IDLE';
  };

  // Determine Creator Status
  const getCreatorStatus = (): CreatorStatus => {
    if (status === 'RUNNING' || status === 'IN_PROGRESS') {
      return iteration > 1 ? 'REFINING' : 'GENERATING';
    }
    if (status === 'FAILED') return 'FAILED';
    if (status === 'APPROVED' || status === 'MAX_ITERATIONS_REACHED') return 'COMPLETE';
    return 'READY';
  };

  // Determine Reviewer Status
  const getReviewerStatus = (): ReviewerStatus => {
    if (status === 'RUNNING' || status === 'IN_PROGRESS') return 'ANALYZING';
    if (status === 'FAILED') return 'FAILED';
    if (status === 'APPROVED') return 'APPROVED';
    if (status === 'MAX_ITERATIONS_REACHED') return 'REJECTED';
    if (latestReview) return latestReview.approved ? 'APPROVED' : 'REJECTED';
    return 'READY';
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-1">
        <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
          <span>🤖 Multi-Agent Collaboration Workspace</span>
        </h2>
        <span className="text-xs text-slate-400 font-mono">
          {iteration > 0 ? `Loop Cycle ${iteration} of ${maxIterations}` : 'Workspace Ready'}
        </span>
      </div>

      {/* Visual Agentic Routing Flow Diagram */}
      <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-2xl shadow-lg">
        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2.5 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <GitBranch className="w-3.5 h-3.5 text-indigo-400" /> Multi-Agent Execution Flow
          </span>
          <span className="text-[10px] text-slate-500 font-normal">Includes Human-in-the-Loop Governance</span>
        </div>

        {hasHumanFeedback ? (
          <div className="flex flex-wrap items-center justify-center gap-2 text-xs font-mono py-1">
            <span className="px-2.5 py-1 bg-amber-950/80 text-amber-300 rounded-lg border border-amber-500/40 font-sans font-bold">
              👤 HUMAN
            </span>
            <span className="text-amber-400">&rarr;</span>
            <span className="px-2.5 py-1 bg-indigo-950/80 text-indigo-300 rounded-lg border border-indigo-500/40 font-sans font-bold flex items-center gap-1">
              👨‍💻 CREATOR
            </span>
            <span className="text-indigo-400">&rarr;</span>
            <span className="px-2.5 py-1 bg-purple-950/80 text-purple-300 rounded-lg border border-purple-500/40 font-sans font-bold flex items-center gap-1">
              🔍 REVIEWER
            </span>
            <span className="text-purple-400">&rarr;</span>
            <span className="px-2.5 py-1 bg-amber-950/80 text-amber-300 rounded-lg border border-amber-500/40 font-sans font-bold flex items-center gap-1">
              🛑 HUMAN REVIEW
            </span>
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-center gap-2 text-xs font-mono py-1">
            <span className="px-2.5 py-1 bg-slate-800 text-slate-300 rounded-lg border border-slate-700 font-sans font-semibold">
              USER
            </span>
            <span className="text-indigo-400">&rarr;</span>
            <span className="px-2.5 py-1 bg-blue-950/80 text-blue-300 rounded-lg border border-blue-500/40 font-sans font-bold flex items-center gap-1">
              🧠 ORCHESTRATOR
            </span>
            <span className="text-indigo-400">&rarr;</span>
            <span className="px-2.5 py-1 bg-indigo-950/80 text-indigo-300 rounded-lg border border-indigo-500/40 font-sans font-bold flex items-center gap-1">
              👨‍💻 CREATOR
            </span>
            <span className="text-indigo-400">&rarr;</span>
            <span className="px-2.5 py-1 bg-purple-950/80 text-purple-300 rounded-lg border border-purple-500/40 font-sans font-bold flex items-center gap-1">
              🔍 REVIEWER
            </span>
            <span className="text-indigo-400">&rarr;</span>
            <span className="px-2.5 py-1 bg-amber-950/80 text-amber-300 rounded-lg border border-amber-500/40 font-sans font-bold flex items-center gap-1">
              🛑 HUMAN REVIEW
            </span>
            <span className="text-indigo-400">&rarr;</span>
            <span className="px-2.5 py-1 bg-emerald-950/80 text-emerald-300 rounded-lg border border-emerald-500/40 font-sans font-bold">
              DECISION
            </span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-stretch">
        {/* Card 1: Orchestrator Agent */}
        <OrchestratorAgent
          status={getOrchestratorStatus()}
          currentIteration={iteration}
          maxIterations={maxIterations}
          qualityThreshold={qualityThreshold}
          finalStatus={status}
        />

        {/* Card 2: Content Creator Agent */}
        <CreatorAgent
          status={getCreatorStatus()}
          currentDraft={currentDraft}
          iteration={iteration}
          maxIterations={maxIterations}
        />

        {/* Card 3: Reviewer Agent */}
        <ReviewerAgent
          status={getReviewerStatus()}
          latestReview={latestReview}
          qualityThreshold={qualityThreshold}
        />
      </div>
    </div>
  );
};
