/**
 * IAuthRepository
 * Repository interface for Authentication operations
 * Following Clean Architecture - this is in the Application layer
 */

export interface AuthUser {
  id: string;
  email: string;
  emailVerified: boolean;
  phone?: string;
  createdAt: string;
  lastLoginAt?: string;
}

export interface AuthProfile {
  id: string;
  authId: string;
  username?: string;
  fullName?: string;
  phone?: string;
  avatarUrl?: string;
  dateOfBirth?: string;
  gender?: 'male' | 'female' | 'other';
  address?: string;
  bio?: string;
  preferences: {
    language: string;
    notifications: boolean;
    theme: 'light' | 'dark' | 'auto';
  };
  socialLinks?: Record<string, string>;
  verificationStatus: 'pending' | 'verified' | 'rejected';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthSession {
  user: AuthUser;
  profile: AuthProfile | null;
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

export interface SignUpData {
  email: string;
  password: string;
  fullName?: string;
  phone?: string;
}

export interface SignInData {
  email: string;
  password: string;
}

export interface OTPSignInData {
  phone: string;
}

export interface VerifyOTPData {
  phone: string;
  token: string;
}

export interface ResetPasswordData {
  email: string;
}

export interface UpdatePasswordData {
  newPassword: string;
}

export interface UpdateProfileData {
  username?: string;
  fullName?: string;
  phone?: string;
  avatarUrl?: string;
  dateOfBirth?: string;
  gender?: 'male' | 'female' | 'other';
  address?: string;
  bio?: string;
  preferences?: {
    language?: string;
    notifications?: boolean;
    theme?: 'light' | 'dark' | 'auto';
  };
  socialLinks?: Record<string, string>;
}

export interface AuthResult {
  success: boolean;
  user?: AuthUser;
  session?: AuthSession;
  error?: string;
  message?: string;
  needsEmailVerification?: boolean;
  needsPhoneVerification?: boolean;
}

export interface IAuthRepository {
  /**
   * Sign up with email and password
   */
  signUp(data: SignUpData): Promise<AuthResult>;

  /**
   * Sign in with email and password
   */
  signIn(data: SignInData): Promise<AuthResult>;

  /**
   * Sign in with OTP (phone)
   */
  signInWithOTP(data: OTPSignInData): Promise<AuthResult>;

  /**
   * Verify OTP
   */
  verifyOTP(data: VerifyOTPData): Promise<AuthResult>;

  /**
   * Sign in with OAuth provider
   */
  signInWithOAuth(provider: 'google' | 'facebook' | 'github' | 'line'): Promise<AuthResult>;

  /**
   * Sign out
   */
  signOut(): Promise<AuthResult>;

  /**
   * Get current session
   */
  getSession(): Promise<AuthSession | null>;

  /**
   * Get current user
   */
  getCurrentUser(): Promise<AuthUser | null>;

  /**
   * Get user profile
   */
  getProfile(): Promise<AuthProfile | null>;

  /**
   * Update user profile
   */
  updateProfile(data: UpdateProfileData): Promise<AuthProfile>;

  /**
   * Send password reset email
   */
  resetPassword(data: ResetPasswordData): Promise<AuthResult>;

  /**
   * Update password (when authenticated)
   */
  updatePassword(data: UpdatePasswordData): Promise<AuthResult>;

  /**
   * Resend email verification
   */
  resendEmailVerification(email: string): Promise<AuthResult>;

  /**
   * Verify email with token
   */
  verifyEmail(token: string): Promise<AuthResult>;

  /**
   * Refresh session
   */
  refreshSession(): Promise<AuthSession | null>;

  /**
   * Subscribe to auth state changes
   */
  onAuthStateChange(callback: (session: AuthSession | null) => void): () => void;
}
