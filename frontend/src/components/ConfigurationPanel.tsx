import React from 'react';
import { Sliders, Cpu } from 'lucide-react';

interface ConfigurationPanelProps {
  maxIterations: number;
  setMaxIterations: (val: number) => void;
  qualityThreshold: number;
  setQualityThreshold: (val: number) => void;
  model: string;
  setModel: (val: string) => void;
  disabled: boolean;
}

export const ConfigurationPanel: React.FC<ConfigurationPanelProps> = ({
  maxIterations,
  setMaxIterations,
  qualityThreshold,
  setQualityThreshold,
  model,
  setModel,
  disabled,
}) => {
  const models = [
    { id: 'openai/gpt-oss-120b', name: 'OpenAI GPT OSS 120B (Recommended)' },
    { id: 'qwen/qwen3.6-27b', name: 'Qwen 3.6 27B' },
    { id: 'openai/gpt-oss-20b', name: 'OpenAI GPT OSS 20B' },
  ];

  return (
    <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-xl space-y-4">
      <div className="flex items-center gap-2 text-xs font-semibold text-slate-300 uppercase tracking-wider">
        <Sliders className="w-4 h-4 text-indigo-400" /> Graph Configuration
      </div>

      <div className="space-y-4 text-xs">
        <div>
          <label className="block font-medium text-slate-300 mb-1.5 flex justify-between">
            <span>Max Iteration Cap</span>
            <span className="font-bold text-indigo-400">{maxIterations} Cycles</span>
          </label>
          <select
            value={maxIterations}
            onChange={(e) => setMaxIterations(Number(e.target.value))}
            disabled={disabled}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500 disabled:opacity-50"
          >
            <option value={1}>1 Cycle (No Refinement)</option>
            <option value={2}>2 Cycles</option>
            <option value={3}>3 Cycles (Recommended)</option>
            <option value={4}>4 Cycles</option>
            <option value={5}>5 Cycles</option>
          </select>
        </div>

        <div>
          <label className="block font-medium text-slate-300 mb-1.5 flex justify-between">
            <span>Quality Score Threshold</span>
            <span className="font-bold text-indigo-400">{qualityThreshold} / 10</span>
          </label>
          <input
            type="range"
            min={1}
            max={10}
            value={qualityThreshold}
            onChange={(e) => setQualityThreshold(Number(e.target.value))}
            disabled={disabled}
            className="w-full accent-indigo-500 cursor-pointer disabled:opacity-50"
          />
        </div>

        <div>
          <label className="block font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-slate-400" /> Groq Model Provider
          </label>
          <select
            value={model}
            onChange={(e) => setModel(e.target.value)}
            disabled={disabled}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500 disabled:opacity-50"
          >
            {models.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};
