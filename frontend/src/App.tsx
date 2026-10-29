import { useState } from 'react';
import type { RunResponse } from './types/api';
import { runCritiqLoop } from './services/api';
import { PromptInput } from './components/PromptInput';
import { ConfigurationPanel } from './components/ConfigurationPanel';
import { AgentWorkspace } from './components/AgentWorkspace';
import { AgentActivityFlow } from './components/AgentActivityFlow';
import { QualityGate } from './components/QualityGate';
import { HumanReview } from './components/HumanReview';
import { IterationTimeline } from './components/IterationTimeline';
import { FinalDraft } from './components/FinalDraft';
import { ErrorPanel } from './components/ErrorPanel';
import { Bot, Sparkles, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';

export function App() {
  const [prompt, setPrompt] = useState(
    'Write a professional technical overview explaining Agentic AI loops and LangGraph state machines for software engineers.'
  );
  const [maxIterations, setMaxIterations] = useState(3);
  const [qualityThreshold, setQualityThreshold] = useState(8);
  const [model, setModel] = useState('openai/gpt-oss-120b');

  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<RunResponse | null>(null);

  // Human-in-the-loop Governance State
  const [humanDecision, setHumanDecision] = useState<'PENDING' | 'APPROVE' | 'REJECT' | 'REQUEST_CHANGES' | null>(null);
  const [humanFeedbackText, setHumanFeedbackText] = useState<string>('');

  const handleRun = async () => {
    setIsLoading(true);
    setResult(null);
    setHumanDecision(null);
    setHumanFeedbackText('');

    const res = await runCritiqLoop({
      task_prompt: prompt,
      max_iterations: maxIterations,
      quality_threshold: qualityThreshold,
      model,
    });

    setResult(res);
    setIsLoading(false);
    if (res.status !== 'FAILED') {
      setHumanDecision('PENDING');
    }
  };

  const handleHumanApprove = () => {
    setHumanDecision('APPROVE');
  };

  const handleHumanReject = () => {
    setHumanDecision('REJECT');
  };

  const handleHumanRequestChanges = async (feedback: string) => {
    setHumanDecision('REQUEST_CHANGES');
    setHumanFeedbackText(feedback);
    setIsLoading(true);

    const currentDraft = result?.final_draft || (latestReview ? latestReview.draft : '');
    const updatedPrompt = `${prompt}\n\n[HUMAN REVIEWER FEEDBACK INSTRUCTION]:\nPlease refine the existing candidate draft to incorporate the following human reviewer instructions:\n"${feedback}"`;

    const res = await runCritiqLoop({
      task_prompt: updatedPrompt,
      max_iterations: maxIterations,
      quality_threshold: qualityThreshold,
      model,
      initial_draft: currentDraft,
    });

    setResult(res);
    setIsLoading(false);
    if (res.status !== 'FAILED') {
      setHumanDecision('PENDING');
    }
  };

  const latestReview = result && result.history && result.history.length > 0
    ? result.history[result.history.length - 1]
    : null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased">
      {/* Top Header Navbar */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600/20 border border-indigo-500/30 rounded-xl text-indigo-400 shadow-inner">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-100 flex items-center gap-2">
                CRITIQLOOP AI <span className="text-xs font-normal text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">Multi-Agent System</span>
              </h1>
              <p className="text-xs text-slate-400">Multi-Agent Content Quality & Human-in-the-Loop Feedback Platform</p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-full font-medium">
              ● SYSTEM READY
            </span>
            <span className="hidden md:flex items-center gap-1.5 text-slate-400">
              <Sparkles className="w-4 h-4 text-amber-400" /> Orchestrator &bull; Creator &bull; Reviewer &bull; Human
            </span>
          </div>
        </div>
      </header>

      {/* Main Multi-Agent Control Room Dashboard */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Task Input & Configuration Controls */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7">
            <PromptInput
              prompt={prompt}
              setPrompt={setPrompt}
              onSubmit={handleRun}
              isLoading={isLoading}
            />
          </div>

          <div className="lg:col-span-5">
            <ConfigurationPanel
              maxIterations={maxIterations}
              setMaxIterations={setMaxIterations}
              qualityThreshold={qualityThreshold}
              setQualityThreshold={setQualityThreshold}
              model={model}
              setModel={setModel}
              disabled={isLoading}
            />
          </div>
        </div>

        {/* 3-Agent Control Panel (Orchestrator 🧠, Content Creator 👨‍💻, Reviewer 🔍) */}
        <AgentWorkspace
          status={isLoading ? 'RUNNING' : result ? (result.status as any) : 'IDLE'}
          currentDraft={result ? result.final_draft : undefined}
          latestReview={latestReview}
          iteration={result ? result.iterations_used : 0}
          maxIterations={maxIterations}
          qualityThreshold={qualityThreshold}
          hasHumanFeedback={Boolean(humanFeedbackText)}
        />

        {/* Agent Activity Sequence Flow Panel */}
        <AgentActivityFlow
          status={isLoading ? 'RUNNING' : result ? (result.status as any) : 'IDLE'}
          history={result ? result.history : []}
          maxIterations={maxIterations}
          qualityThreshold={qualityThreshold}
          errorMessage={result ? result.error_message : null}
          humanFeedback={humanFeedbackText}
          humanDecision={humanDecision}
        />

        {/* Programmatic Quality Gate Decision Card */}
        {result && result.status !== 'FAILED' && (
          <QualityGate
            threshold={qualityThreshold}
            overallQuality={result.final_quality || (latestReview ? latestReview.overall_quality : 0)}
            reviewerApproved={result.reviewer_approved}
            status={result.status}
          />
        )}

        {/* Human Feedback Refinement Banner */}
        {humanFeedbackText && result && result.status !== 'FAILED' && (
          <div className="bg-indigo-950/40 border border-indigo-500/40 p-4 rounded-xl flex items-center gap-3 text-indigo-300">
            <Sparkles className="w-6 h-6 text-indigo-400 shrink-0" />
            <div>
              <h4 className="font-bold text-sm text-slate-100">🟢 HUMAN REFINEMENT APPLIED</h4>
              <p className="text-xs text-slate-300">
                Content Creator Agent refined the candidate draft using your human instructions: <span className="text-amber-300 italic font-semibold">"{humanFeedbackText}"</span>.
              </p>
            </div>
          </div>
        )}

        {/* Human Review Stage (Human-in-the-Loop) */}
        {result && result.status !== 'FAILED' && humanDecision === 'PENDING' && (
          <HumanReview
            draft={result.final_draft || (latestReview ? latestReview.draft : '')}
            onApprove={handleHumanApprove}
            onRequestChanges={handleHumanRequestChanges}
            onReject={handleHumanReject}
            disabled={isLoading}
          />
        )}

        {/* Human Decision Outcome Banners */}
        {humanDecision === 'APPROVE' && (
          <div className="bg-emerald-950/40 border border-emerald-500/40 p-4 rounded-xl flex items-center gap-3 text-emerald-300">
            <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
            <div>
              <h4 className="font-bold text-sm text-slate-100">🟢 HUMAN DECISION: APPROVED</h4>
              <p className="text-xs text-slate-300">
                Human reviewer confirmed final approval of the generated content draft. Workflow completed.
              </p>
            </div>
          </div>
        )}

        {humanDecision === 'REJECT' && (
          <div className="bg-rose-950/40 border border-rose-500/40 p-4 rounded-xl flex items-center gap-3 text-rose-300">
            <XCircle className="w-6 h-6 text-rose-400 shrink-0" />
            <div>
              <h4 className="font-bold text-sm text-slate-100">🔴 HUMAN DECISION: REJECTED</h4>
              <p className="text-xs text-slate-300">
                Human reviewer rejected candidate draft. Workflow halted.
              </p>
            </div>
          </div>
        )}

        {/* Execution Result Banner */}
        {result && result.status === 'APPROVED' && humanDecision !== 'REJECT' && (
          <div className="bg-emerald-950/40 border border-emerald-500/40 p-4 rounded-xl flex items-center gap-3 text-emerald-300">
            <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
            <div>
              <h4 className="font-bold text-sm text-slate-100">🟢 QUALITY GATE: PASSED</h4>
              <p className="text-xs text-slate-300">
                Orchestrator confirmed that both quality score threshold (&ge; {qualityThreshold}/10) and Reviewer approval requirement were satisfied in {result.iterations_used} iteration {result.iterations_used === 1 ? 'cycle' : 'cycles'}.
              </p>
            </div>
          </div>
        )}

        {result && result.status === 'MAX_ITERATIONS_REACHED' && humanDecision !== 'REJECT' && (
          <div className="bg-amber-950/40 border border-amber-500/40 p-4 rounded-xl flex items-center gap-3 text-amber-300">
            <AlertTriangle className="w-6 h-6 text-amber-400 shrink-0" />
            <div>
              <h4 className="font-bold text-sm text-slate-100">🟠 ITERATION LIMIT REACHED</h4>
              <p className="text-xs text-slate-300">
                The Orchestrator evaluated retry bounds ({result.iterations_used} &ge; {maxIterations}) and halted the workflow. Below is the final candidate draft.
              </p>
            </div>
          </div>
        )}

        {result && result.status === 'FAILED' && (
          <div className="bg-rose-950/40 border border-rose-500/40 p-4 rounded-xl flex items-center gap-3 text-rose-300">
            <XCircle className="w-6 h-6 text-rose-400 shrink-0" />
            <div>
              <h4 className="font-bold text-sm text-slate-100">🔴 WORKFLOW FAILED</h4>
              <p className="text-xs text-slate-300">
                The workflow encountered a runtime error. Sanitized diagnostics are displayed below.
              </p>
            </div>
          </div>
        )}

        {/* Diagnostic Error Panel */}
        {result && result.error_message && (
          <ErrorPanel errorMessage={result.error_message} />
        )}

        {/* Final Approved Output */}
        {result && result.status !== 'FAILED' && (result.final_draft || (latestReview && latestReview.draft)) && (
          <FinalDraft
            draft={result.final_draft || (latestReview ? latestReview.draft : '')}
            status={result.status}
            iterationsUsed={result.iterations_used}
          />
        )}

        {/* Iteration Audit Timeline */}
        {result && result.history && result.history.length > 0 && (
          <IterationTimeline
            history={result.history}
            qualityThreshold={qualityThreshold}
          />
        )}
      </main>
    </div>
  );
}

export default App;
