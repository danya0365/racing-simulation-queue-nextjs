/**
 * Auth Configuration
 * Controls which authentication methods are enabled
 * Uses environment variables for configuration
 */

export interface AuthConfig {
  // Login methods
  email: {
    enabled: boolean;
    allowRegistration: boolean;
  };
  phone: {
    enabled: boolean;
  };
  oauth: {
    enabled: boolean;
    providers: {
      google: boolean;
      facebook: boolean;
      github: boolean;
      line: boolean;
    };
  };
  // Features
  features: {
    forgotPassword: boolean;
    emailVerification: boolean;
    rememberMe: boolean;
  };
}

/**
 * Parse boolean from environment variable
 */
function parseBoolean(value: string | undefined, defaultValue: boolean): boolean {
  if (value === undefined) return defaultValue;
  return value === 'true' || value === '1';
}

/**
 * Get auth configuration from environment variables
 */
export function getAuthConfig(): AuthConfig {
  return {
    email: {
      enabled: parseBoolean(process.env.NEXT_PUBLIC_AUTH_EMAIL_ENABLED, true),
      allowRegistration: parseBoolean(process.env.NEXT_PUBLIC_AUTH_REGISTRATION_ENABLED, true),
    },
    phone: {
      enabled: parseBoolean(process.env.NEXT_PUBLIC_AUTH_PHONE_ENABLED, false),
    },
    oauth: {
      enabled: parseBoolean(process.env.NEXT_PUBLIC_AUTH_OAUTH_ENABLED, false),
      providers: {
        google: parseBoolean(process.env.NEXT_PUBLIC_AUTH_GOOGLE_ENABLED, false),
        facebook: parseBoolean(process.env.NEXT_PUBLIC_AUTH_FACEBOOK_ENABLED, false),
        github: parseBoolean(process.env.NEXT_PUBLIC_AUTH_GITHUB_ENABLED, false),
        line: parseBoolean(process.env.NEXT_PUBLIC_AUTH_LINE_ENABLED, false),
      },
    },
    features: {
      forgotPassword: parseBoolean(process.env.NEXT_PUBLIC_AUTH_FORGOT_PASSWORD_ENABLED, true),
      emailVerification: parseBoolean(process.env.NEXT_PUBLIC_AUTH_EMAIL_VERIFICATION_ENABLED, true),
      rememberMe: parseBoolean(process.env.NEXT_PUBLIC_AUTH_REMEMBER_ME_ENABLED, true),
    },
  };
}

/**
 * Check if any OAuth provider is enabled
 */
export function hasAnyOAuthProvider(config: AuthConfig): boolean {
  if (!config.oauth.enabled) return false;
  const providers = config.oauth.providers;
  return providers.google || providers.facebook || providers.github || providers.line;
}

/**
 * Get enabled OAuth providers
 */
export function getEnabledOAuthProviders(config: AuthConfig): Array<'google' | 'facebook' | 'github' | 'line'> {
  if (!config.oauth.enabled) return [];
  
  const providers: Array<'google' | 'facebook' | 'github' | 'line'> = [];
  const p = config.oauth.providers;
  
  if (p.google) providers.push('google');
  if (p.facebook) providers.push('facebook');
  if (p.github) providers.push('github');
  if (p.line) providers.push('line');
  
  return providers;
}

// Export singleton instance
export const authConfig = getAuthConfig();
