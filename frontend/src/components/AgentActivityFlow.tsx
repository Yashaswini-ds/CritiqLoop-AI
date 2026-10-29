import React from 'react';
import { Activity, CheckCircle2, AlertTriangle, ArrowDown, RefreshCw, XCircle } from 'lucide-react';
import type { IterationHistoryItem } from '../types/api';

interface AgentActivityFlowProps {
  status: 'IDLE' | 'RUNNING' | 'APPROVED' | 'MAX_ITERATIONS_REACHED' | 'FAILED' | 'IN_PROGRESS';
  history: IterationHistoryItem[];
  maxIterations: number;
  qualityThreshold: number;
  errorMessage?: string | null;
  humanFeedback?: string | null;
  humanDecision?: 'APPROVE' | 'REJECT' | 'REQUEST_CHANGES' | 'PENDING' | null;
}

export const AgentActivityFlow: React.FC<AgentActivityFlowProps> = ({
  status,
  history,
  maxIterations,
  qualityThreshold,
  errorMessage,
  humanFeedback,
  humanDecision,
}) => {
  if (status === 'IDLE' && history.length === 0) {
    return (
      <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-300 uppercase tracking-wider">
          <Activity className="w-4 h-4 text-indigo-400" /> Multi-Agent Activity Sequence
        </div>
        <div className="text-xs text-slate-500 italic p-4 text-center border border-dashed border-slate-800 rounded-xl">
          Enter a task goal prompt above and click "Run CritiqLoop" to initiate the Orchestrator &rarr; Content Creator &rarr; Reviewer collaboration flow.
        </div>
      </div>
    );
  }

  const events: { id: string; role: 'ORCHESTRATOR' | 'CREATOR' | 'REVIEWER'; text: string; status: 'SUCCESS' | 'WARNING' | 'INFO' | 'ERROR' }[] = [];

  // Initial Orchestrator receipt
  events.push({
    id: 'orch-received',
    role: 'ORCHESTRATOR',
    text: 'Orchestrator Agent received user task goal prompt and initialized State Graph.',
    status: 'SUCCESS',
  });

  if (status === 'RUNNING' && history.length === 0) {
    events.push({
      id: 'active-loading',
      role: 'ORCHESTRATOR',
      text: 'Orchestrator is coordinating... Content Creator generating... Reviewer evaluating...',
      status: 'INFO',
    });
  }

  // Loop through history cycles
  history.forEach((item, index) => {
    const isLast = index === history.length - 1;
    const isApproved = item.overall_quality >= qualityThreshold && item.approved;

    // Creator generation/refinement
    events.push({
      id: `creator-draft-${item.iteration}`,
      role: 'CREATOR',
      text: item.iteration === 1
        ? `Content Creator Agent generated Draft #${item.iteration}.`
        : `Content Creator Agent refined Draft #${item.iteration} using Reviewer critique.`,
      status: 'SUCCESS',
    });

    // Orchestrator routing to Reviewer
    events.push({
      id: `orch-route-rev-${item.iteration}`,
      role: 'ORCHESTRATOR',
      text: `Orchestrator Agent dispatched Draft #${item.iteration} to Reviewer Agent for critique.`,
      status: 'INFO',
    });

    // Reviewer evaluation
    events.push({
      id: `reviewer-eval-${item.iteration}`,
      role: 'REVIEWER',
      text: `Reviewer Agent evaluated Draft #${item.iteration} (Overall Quality: ${item.overall_quality}/10, Approved: ${item.approved ? 'True' : 'False'}).`,
      status: isApproved ? 'SUCCESS' : 'WARNING',
    });

    // Orchestrator decision
    if (isApproved) {
      events.push({
        id: `orch-decision-${item.iteration}`,
        role: 'ORCHESTRATOR',
        text: `Orchestrator Agent confirmed Quality Gate PASSED (Overall Quality ${item.overall_quality} \u2265 ${qualityThreshold} AND Approved == True). Terminating loop successfully.`,
        status: 'SUCCESS',
      });
    } else if (isLast && status === 'MAX_ITERATIONS_REACHED') {
      events.push({
        id: `orch-decision-max-${item.iteration}`,
        role: 'ORCHESTRATOR',
        text: `Orchestrator Agent evaluated retry condition (${item.iteration} \u2265 ${maxIterations}): Max retries reached without satisfying quality threshold. Halting workflow.`,
        status: 'WARNING',
      });
    } else if (!isLast || status === 'RUNNING' || status === 'IN_PROGRESS') {
      events.push({
        id: `orch-decision-retry-${item.iteration}`,
        role: 'ORCHESTRATOR',
        text: `Orchestrator Agent evaluated retry condition (${item.iteration} < ${maxIterations}): Refinement required. Routing state back to Content Creator Agent.`,
        status: 'INFO',
      });
    }
  });

  if (humanDecision === 'REQUEST_CHANGES' && humanFeedback) {
    events.push({
      id: 'human-review-request',
      role: 'ORCHESTRATOR',
      text: `🛑 Human Reviewer requested changes: "${humanFeedback}". Routing feedback to Content Creator Agent.`,
      status: 'WARNING',
    });
  } else if (humanDecision === 'APPROVE') {
    events.push({
      id: 'human-review-approve',
      role: 'ORCHESTRATOR',
      text: '🟢 Human Reviewer confirmed final approval of generated content.',
      status: 'SUCCESS',
    });
  } else if (humanDecision === 'REJECT') {
    events.push({
      id: 'human-review-reject',
      role: 'ORCHESTRATOR',
      text: '🔴 Human Reviewer rejected candidate draft.',
      status: 'ERROR',
    });
  }

  if (status === 'FAILED' || errorMessage) {
    events.push({
      id: 'failed-event',
      role: 'ORCHESTRATOR',
      text: `Orchestrator Agent captured runtime exception: ${errorMessage || 'Workflow Execution Failed'}.`,
      status: 'ERROR',
    });
  }

  return (
    <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl space-y-4 shadow-xl">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
          <Activity className="w-4 h-4 text-indigo-400" /> Multi-Agent Activity Sequence
        </h3>
        <span className="text-[11px] text-slate-400 font-mono">
          {events.length} Workflow Events Logged
        </span>
      </div>

      <div className="space-y-2.5">
        {events.map((evt, idx) => {
          const getRoleBadge = () => {
            switch (evt.role) {
              case 'ORCHESTRATOR':
                return <span className="bg-blue-600/20 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded text-[10px] font-bold">🧠 ORCHESTRATOR</span>;
              case 'CREATOR':
                return <span className="bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 px-2 py-0.5 rounded text-[10px] font-bold">👨‍💻 CREATOR</span>;
              case 'REVIEWER':
                return <span className="bg-purple-600/20 text-purple-400 border border-purple-500/30 px-2 py-0.5 rounded text-[10px] font-bold">🔍 REVIEWER</span>;
            }
          };

          const getStatusIcon = () => {
            switch (evt.status) {
              case 'SUCCESS':
                return <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />;
              case 'WARNING':
                return <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />;
              case 'ERROR':
                return <XCircle className="w-4 h-4 text-rose-400 shrink-0" />;
              default:
                return <RefreshCw className="w-4 h-4 text-indigo-400 shrink-0" />;
            }
          };

          return (
            <React.Fragment key={evt.id}>
              <div className="bg-slate-950/70 border border-slate-800/90 rounded-xl p-3 flex items-start gap-3 text-xs">
                {getStatusIcon()}
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    {getRoleBadge()}
                  </div>
                  <p className="text-slate-200 font-medium leading-relaxed">{evt.text}</p>
                </div>
              </div>

              {idx < events.length - 1 && (
                <div className="flex justify-center my-0.5">
                  <ArrowDown className="w-3.5 h-3.5 text-slate-600" />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
