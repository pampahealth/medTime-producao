/**
 * Auth Configuration
 *
 * Set AUTH_ENABLED to true to enable authentication features
 * Set to false for public/anonymous access mode
 */

export const AUTH_ENABLED = process.env.NEXT_PUBLIC_ENABLE_AUTH === 'true';

export interface AuthConfig {
  enabled: boolean;
  loginPath: string;
  refreshPath: string;
  tokenCookieName: string;
  refreshCookieName: string;
}

export const authConfig: AuthConfig = {
  enabled: AUTH_ENABLED,
  loginPath: '/login',
  refreshPath: '/next_api/auth/refresh',
  tokenCookieName: 'auth-token',
  refreshCookieName: 'refresh-token',
};
