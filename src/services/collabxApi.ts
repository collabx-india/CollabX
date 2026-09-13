import { ProblemReport, UserRole } from '../types';
import { storageService } from './storageService';

let activeBaseUrl =
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.PROD ? 'https://collabx-api-vhog.onrender.com/api' : '/api');

export interface AuthUserResponse {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface OtpResponse {
  challenge_id: string;
  expires_at: string;
  delivery_configured: boolean;
  dev_otp?: string | null;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  user_id: string;
  role: UserRole;
}

export interface BackendFeedback {
  id: string;
  project_id: string;
  submitted_by?: string | null;
  rating?: number | null;
  comments?: string | null;
  solved_status?: 'YES' | 'PARTIALLY' | 'NO' | null;
  locality?: string | null;
  photo_proof_url?: string | null;
  created_at: string;
}

export interface BackendProject {
  id: string;
  status: string;
  pilot_metrics_json?: string | null;
  [key: string]: unknown;
}

export class ApiError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  const token = storageService.getAuthToken();
  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  let response: Response;
  try {
    response = await fetch(`${activeBaseUrl}${path}`, { ...init, headers });
  } catch {
    // Attempt IPv4 127.0.0.1 fallback if proxy or localhost resolution failed
    if (activeBaseUrl === '/api') {
      try {
        const fallbackUrl = 'http://127.0.0.1:8000/api';
        response = await fetch(`${fallbackUrl}${path}`, { ...init, headers });
        activeBaseUrl = fallbackUrl;
      } catch {
        throw new ApiError(
          0,
          `Cannot reach CollabX backend at http://127.0.0.1:8000. Please ensure the backend server is running on port 8000.`
        );
      }
    } else if (activeBaseUrl.includes('localhost:8000')) {
      try {
        const fallbackUrl = activeBaseUrl.replace('localhost:8000', '127.0.0.1:8000');
        response = await fetch(`${fallbackUrl}${path}`, { ...init, headers });
        activeBaseUrl = fallbackUrl;
      } catch {
        throw new ApiError(
          0,
          `Cannot reach CollabX backend at ${activeBaseUrl}. Please ensure the backend server is running on port 8000.`
        );
      }
    } else {
      throw new ApiError(
        0,
        `Cannot reach CollabX backend at ${activeBaseUrl}. Please ensure the backend server is running on port 8000.`
      );
    }
  }

  if (!response.ok) {
    let message = response.status === 403 ? 'You do not have permission to perform this action.' : 'Request failed.';
    try {
      const body = await response.json() as { detail?: string };
      message = body.detail || message;
    } catch {
      // Keep the status-specific fallback when the API did not return JSON.
    }
    if (response.status === 401) {
      storageService.clearAuth();
      window.dispatchEvent(new CustomEvent('collabx:auth-error'));
    }
    throw new ApiError(response.status, message);
  }
  return response.json() as Promise<T>;
}

export type ApiProblemPayload = {
  title: string;
  description: string;
  district: string;
  locality: string;
  citizen_name?: string | null;
  citizen_phone?: string | null;
  coordinates?: { lat: number; lng: number } | null;
  affected_population?: number | null;
  frequency?: string | null;
  evidence_urls?: string[];
  audio_transcript?: string | null;
  has_voice_note?: boolean;
};

export interface RegisterResponse {
  user_id: string;
  name: string;
  email: string;
  role: UserRole;
  message: string;
}

export const collabxApi = {
  registerUser(name: string, identifier: string, role: UserRole): Promise<RegisterResponse> {
    return apiRequest<RegisterResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, identifier, role }),
    });
  },

  requestOtp(identifier: string, role: UserRole, name?: string): Promise<OtpResponse> {
    return apiRequest<OtpResponse>('/auth/request-otp', {
      method: 'POST',
      body: JSON.stringify({ identifier, role, name }),
    });
  },

  verifyOtp(challengeId: string, otp: string): Promise<TokenResponse> {
    return apiRequest<TokenResponse>('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({
        challenge_id: String(challengeId).trim(),
        otp: String(otp).trim(),
      }),
    });
  },

  getCurrentUser(): Promise<AuthUserResponse> {
    return apiRequest<AuthUserResponse>('/auth/me');
  },

  getProject(projectId: string): Promise<BackendProject> {
    return apiRequest<BackendProject>(`/projects/${encodeURIComponent(projectId)}`);
  },

  getProjectFeedback(projectId: string): Promise<BackendFeedback[]> {
    return apiRequest<BackendFeedback[]>(`/projects/${encodeURIComponent(projectId)}/feedback`);
  },

  submitFeedback(projectId: string, feedback: { id?: string; rating: number; comments: string; solved_status: 'YES' | 'PARTIALLY' | 'NO'; locality?: string; photo_proof_url?: string }): Promise<BackendFeedback> {
    return apiRequest<BackendFeedback>(`/projects/${encodeURIComponent(projectId)}/feedback`, {
      method: 'POST',
      body: JSON.stringify({ ...feedback, submitted_by: undefined }),
    });
  },

  updatePilot(projectId: string, status?: string, metrics?: Record<string, unknown>): Promise<BackendProject> {
    return apiRequest<BackendProject>(`/projects/${encodeURIComponent(projectId)}/pilot`, {
      method: 'PATCH',
      body: JSON.stringify({ status, metrics }),
    });
  },

  updateMilestone(milestoneId: string, status: string): Promise<Record<string, unknown>> {
    return apiRequest<Record<string, unknown>>(`/milestones/${encodeURIComponent(milestoneId)}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },

  async healthCheck(): Promise<{ status: string; service: string }> {
    const healthUrl = `${activeBaseUrl}/health`;
    const response = await fetch(healthUrl);
    if (!response.ok) {
      throw new Error('Health check failed');
    }
    return response.json();
  },

  async createProblem(problem: ApiProblemPayload): Promise<ProblemReport> {
    return apiRequest<ProblemReport>('/reports', {
      method: 'POST',
      body: JSON.stringify(problem),
    });
  },

  async getReports(): Promise<ProblemReport[]> {
    return apiRequest<ProblemReport[]>('/reports');
  },
};
