import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Award, AlertCircle, Copy, Check, FileText } from 'lucide-react';

interface FinalDraftProps {
  draft: string;
  status: 'APPROVED' | 'MAX_ITERATIONS_REACHED' | 'FAILED' | 'IN_PROGRESS';
  iterationsUsed: number;
}

export const FinalDraft: React.FC<FinalDraftProps> = ({ draft, status, iterationsUsed }) => {
  const [copied, setCopied] = React.useState(false);

  if (!draft || status === 'FAILED') return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(draft);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isApproved = status === 'APPROVED';

  return (
    <div
      id="final-draft-container"
      className={`rounded-2xl border p-6 space-y-6 shadow-2xl ${
        isApproved
          ? 'bg-slate-900/90 border-emerald-500/40 shadow-emerald-500/10'
          : 'bg-slate-900/90 border-amber-500/40 shadow-amber-500/10'
      }`}
    >
      {/* Header Bar */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div
            className={`p-2.5 rounded-xl border ${
              isApproved
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
            }`}
          >
            {isApproved ? <Award className="w-6 h-6" /> : <AlertCircle className="w-6 h-6" />}
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
              {isApproved ? '🟢 Final Approved Content' : '🟠 Candidate Draft (Max Retries Reached)'}
            </h2>
            <p className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
              <span>
                {isApproved
                  ? `Passed all quality gates in ${iterationsUsed} iteration ${iterationsUsed === 1 ? 'cycle' : 'cycles'}.`
                  : `Terminated after ${iterationsUsed} iterations.`}
              </span>
              <span className="text-[10px] font-mono bg-slate-800 px-2 py-0.5 rounded text-indigo-300 border border-slate-700">
                {draft.length} characters
              </span>
            </p>
          </div>
        </div>

        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition-all border border-slate-700 shadow-md cursor-pointer shrink-0"
        >
          {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-indigo-400" />}
          {copied ? 'Copied!' : 'Copy Draft'}
        </button>
      </div>

      {/* Structured Document Content Container */}
      <div className="bg-slate-950 p-6 md:p-8 rounded-xl border border-slate-800/90 leading-relaxed overflow-x-auto text-slate-200 space-y-4">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            h1: ({ children }) => (
              <h1 className="text-lg font-bold text-indigo-300 border-b border-indigo-500/30 pb-2 mt-8 mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-400 shrink-0" />
                {children}
              </h1>
            ),
            h2: ({ children }) => (
              <h2 className="text-base font-bold text-slate-100 mt-6 mb-3 border-b border-slate-800 pb-1.5">
                {children}
              </h2>
            ),
            h3: ({ children }) => (
              <h3 className="text-sm font-semibold text-indigo-400 mt-4 mb-2">
                {children}
              </h3>
            ),
            p: ({ children }) => (
              <p className="text-xs text-slate-300 leading-relaxed my-2">
                {children}
              </p>
            ),
            ul: ({ children }) => (
              <ul className="list-disc pl-5 my-3 space-y-1.5 text-xs text-slate-300">
                {children}
              </ul>
            ),
            ol: ({ children }) => (
              <ol className="list-decimal pl-5 my-3 space-y-1.5 text-xs text-slate-300">
                {children}
              </ol>
            ),
            li: ({ children }) => (
              <li className="text-xs text-slate-300 leading-relaxed">
                {children}
              </li>
            ),
            table: ({ children }) => (
              <div className="my-5 overflow-x-auto rounded-xl border border-slate-800 shadow-lg">
                <table className="w-full text-xs text-left border-collapse">
                  {children}
                </table>
              </div>
            ),
            thead: ({ children }) => (
              <thead className="bg-slate-900 text-indigo-300 border-b border-slate-800 text-xs font-semibold uppercase tracking-wider">
                {children}
              </thead>
            ),
            tbody: ({ children }) => (
              <tbody className="divide-y divide-slate-800/60 bg-slate-950">
                {children}
              </tbody>
            ),
            th: ({ children }) => (
              <th className="px-4 py-3 font-semibold text-slate-200 border-r border-slate-800/80 last:border-r-0">
                {children}
              </th>
            ),
            td: ({ children }) => (
              <td className="px-4 py-3 text-slate-300 border-r border-slate-800/60 last:border-r-0 font-sans">
                {children}
              </td>
            ),
            tr: ({ children }) => (
              <tr className="hover:bg-slate-900/60 transition-colors">
                {children}
              </tr>
            ),
            code: ({ inline, children, className }: any) => {
              if (inline) {
                return (
                  <code className="bg-slate-900 text-indigo-300 border border-slate-800 px-1.5 py-0.5 rounded text-[11px] font-mono">
                    {children}
                  </code>
                );
              }
              return (
                <div className="my-4 rounded-xl border border-slate-800 bg-slate-900/90 overflow-hidden shadow-xl">
                  <div className="bg-slate-900 px-4 py-2 border-b border-slate-800 flex items-center justify-between text-[10px] font-mono text-slate-400">
                    <span>Code Snippet</span>
                    <span className="text-indigo-400">{className?.replace('language-', '') || 'text'}</span>
                  </div>
                  <pre className="p-4 font-mono text-[11px] text-slate-200 overflow-x-auto leading-relaxed whitespace-pre">
                    <code>{children}</code>
                  </pre>
                </div>
              );
            },
            blockquote: ({ children }) => (
              <blockquote className="border-l-4 border-indigo-500 bg-indigo-950/30 p-4 rounded-r-xl italic text-slate-300 text-xs my-4 shadow-inner">
                {children}
              </blockquote>
            ),
          }}
        >
          {draft}
        </ReactMarkdown>
      </div>
    </div>
  );
};
