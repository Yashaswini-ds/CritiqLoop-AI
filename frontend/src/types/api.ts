export interface IterationHistoryItem {
  iteration: number;
  draft: string;
  relevance: number;
  clarity: number;
  completeness: number;
  overall_quality: number;
  strengths: string[];
  weaknesses: string[];
  feedback: string;
  approved: boolean;
}

export interface RunRequest {
  task_prompt: string;
  max_iterations: number;
  quality_threshold: number;
  model?: string;
  initial_draft?: string;
}

export interface RunResponse {
  status: 'APPROVED' | 'MAX_ITERATIONS_REACHED' | 'FAILED' | 'IN_PROGRESS';
  iterations_used: number;
  final_quality: number | null;
  quality_threshold: number;
  reviewer_approved: boolean;
  final_draft: string;
  history: IterationHistoryItem[];
  error_message: string | null;
}
