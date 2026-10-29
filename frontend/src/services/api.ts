import type { RunRequest, RunResponse } from '../types/api';

const CANDIDATE_URLS = [
  import.meta.env.VITE_API_BASE_URL,
  'http://localhost:8000',
  'http://127.0.0.1:8000',
  'http://localhost:8001',
  'http://127.0.0.1:8001',
].filter(Boolean) as string[];

async function findActiveBackendUrl(): Promise<string> {
  for (const url of CANDIDATE_URLS) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);
      const res = await fetch(`${url}/api/health`, { signal: controller.signal });
      clearTimeout(timeoutId);
      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        if (data.status === 'ok') {
          return url;
        }
      }
    } catch {
      continue;
    }
  }
  return CANDIDATE_URLS[0] || 'http://localhost:8000';
}

export async function runCritiqLoop(request: RunRequest): Promise<RunResponse> {
  try {
    const activeBaseUrl = await findActiveBackendUrl();
    const response = await fetch(`${activeBaseUrl}/api/run`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      let message = 'API request failed';
      if (typeof errorData.detail === 'string') {
        message = errorData.detail;
      } else if (Array.isArray(errorData.detail)) {
        message = errorData.detail.map((err: any) => `${err.loc?.join('.') || 'field'}: ${err.msg}`).join(', ');
      } else if (errorData.error_message) {
        message = errorData.error_message;
      }
      return {
        status: 'FAILED',
        iterations_used: 0,
        final_quality: null,
        quality_threshold: request.quality_threshold,
        reviewer_approved: false,
        final_draft: '',
        history: [],
        error_message: message,
      };
    }

    const data: RunResponse = await response.json();
    return data;
  } catch (err: any) {
    if (err.message?.includes('Failed to fetch') || err.message?.includes('NetworkError') || err.name === 'AbortError') {
      return {
        status: 'FAILED',
        iterations_used: 0,
        final_quality: null,
        quality_threshold: request.quality_threshold,
        reviewer_approved: false,
        final_draft: '',
        history: [],
        error_message: 'Unable to connect to CritiqLoop API backend server. Please start FastAPI using: python -m uvicorn src.api.main:app --port 8000',
      };
    }

    return {
      status: 'FAILED',
      iterations_used: 0,
      final_quality: null,
      quality_threshold: request.quality_threshold,
      reviewer_approved: false,
      final_draft: '',
      history: [],
      error_message: err.message || 'An unexpected client-side error occurred.',
    };
  }
}
