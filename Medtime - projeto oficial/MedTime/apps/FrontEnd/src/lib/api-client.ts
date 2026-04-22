import { AUTH_ENABLED, authConfig } from '../config/auth-config';
import { AUTH_CODE } from '@/constants/auth';

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  errorMessage?: string;
  errorCode?: string;
}

class ApiError extends Error {
  constructor(public status: number, public errorMessage: string, public errorCode?: string) {
    super(errorMessage);
    this.name = 'ApiError';
  }
}

// ============ Auth-enabled helpers ============
let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

async function safeParseJson<T>(response: Response): Promise<T> {
  const text = await response.text();
  if (!text || text.trim() === '') {
    return { success: false, errorMessage: 'Resposta vazia da API' } as T;
  }
  try {
    return JSON.parse(text) as T;
  } catch {
    return { success: false, errorMessage: 'Resposta inválida da API (não é JSON)' } as T;
  }
}

async function refreshToken(): Promise<boolean> {
  try {
    const response = await fetch(authConfig.refreshPath, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      return false;
    }

    const result: ApiResponse = await safeParseJson<ApiResponse>(response);
    return result.success === true;
  } catch (error) {
    return false;
  }
}

function redirectToLogin() {
  if (typeof window !== 'undefined') {
    const currentPath = window.location.pathname;
    if (currentPath === authConfig.loginPath || currentPath === `${authConfig.loginPath}/`) {
      return;
    }
    const loginUrl = `${authConfig.loginPath}?redirect=${encodeURIComponent(currentPath)}`;
    window.location.href = loginUrl;
  }
}

// ============ API Request with conditional auth ============
async function apiRequest<T = any>(
  endpoint: string,
  options?: RequestInit,
  isRetry = false
): Promise<T> {
  try {
    const response = await fetch(`/next_api${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    });

    const result: ApiResponse<T> = await safeParseJson<ApiResponse<T>>(response);

    // Auth-enabled: handle token missing
    if (AUTH_ENABLED && [AUTH_CODE.TOKEN_MISSING].includes(result.errorCode || '')) {
      // Unauthorized, need login
      throw new ApiError(401, "need login", AUTH_CODE.TOKEN_MISSING);
    }

    // Auth-enabled: handle token expired with refresh
    if (
      AUTH_ENABLED &&
      response.status === 401 &&
      result.errorCode === AUTH_CODE.TOKEN_EXPIRED &&
      !isRetry
    ) {
      if (isRefreshing && refreshPromise) {
        const refreshSuccess = await refreshPromise;
        if (refreshSuccess) {
          return apiRequest<T>(endpoint, options, true);
        } else {
          throw new ApiError(401, "need login", AUTH_CODE.TOKEN_EXPIRED);
        }
      }

      if (!isRefreshing) {
        isRefreshing = true;
        refreshPromise = refreshToken();

        try {
          const refreshSuccess = await refreshPromise;

          if (refreshSuccess) {
            return apiRequest<T>(endpoint, options, true);
          } else {
            throw new ApiError(401, "need login", AUTH_CODE.TOKEN_EXPIRED);
          }
        } finally {
          isRefreshing = false;
          refreshPromise = null;
        }
      }
    }

    if (!response.ok || !result.success) {
      throw new ApiError(response.status, result.errorMessage || 'API request failed', result.errorCode);
    }

    return result.data as T;
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.status === 401 && typeof window !== 'undefined' && window.location.pathname !== authConfig.loginPath) {
        // toast opcional para need login
      }
      throw error;
    }
    const message = error instanceof SyntaxError ? error.message : 'Network error or invalid response';
    console.error('API request error:', error);
    throw new ApiError(500, message);
  }
}

export const api = {
  get: <T = any>(endpoint: string, params?: Record<string, string>) => {
    const url = params
      ? `${endpoint}?${new URLSearchParams(params).toString()}`
      : endpoint;
    return apiRequest<T>(url, { method: 'GET' });
  },

  post: <T = any>(endpoint: string, data?: any) =>
    apiRequest<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    }),

  put: <T = any>(endpoint: string, data?: any) =>
    apiRequest<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    }),

  delete: <T = any>(endpoint: string) =>
    apiRequest<T>(endpoint, { method: 'DELETE' }),
};

export { ApiError };
export type { ApiResponse };
