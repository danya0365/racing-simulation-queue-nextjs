/**
 * ProfilePresenter
 * Handles business logic for Profile page
 * Receives repository via dependency injection
 */

import {
  AuthProfile,
  AuthSession,
  AuthUser,
  IAuthRepository,
  UpdateProfileData,
} from '@/src/application/repositories/IAuthRepository';
import { Metadata } from 'next';

export interface ProfileViewModel {
  user: AuthUser | null;
  profile: AuthProfile | null;
  session: AuthSession | null;
  isAuthenticated: boolean;
}

/**
 * Presenter for Profile page
 * ✅ Receives repository via constructor injection
 */
export class ProfilePresenter {
  constructor(private readonly authRepository: IAuthRepository) {}

  /**
   * Helper to wrap promise with timeout
   */
  private async withTimeout<T>(promise: Promise<T>, ms: number = 15000): Promise<T> {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error(`Connection timed out (${ms}ms)`)), ms)
      )
    ]);
  }

  /**
   * Get view model for the page
   */
  async getViewModel(): Promise<ProfileViewModel> {
    try {
      const session = await this.withTimeout(this.authRepository.getSession());
      
      if (!session) {
        return {
          user: null,
          profile: null,
          session: null,
          isAuthenticated: false,
        };
      }

      return {
        user: session.user,
        profile: session.profile,
        session,
        isAuthenticated: true,
      };
    } catch (error) {
      console.error('Error getting profile view model:', error);
      return {
        user: null,
        profile: null,
        session: null,
        isAuthenticated: false,
      };
    }
  }

  /**
   * Generate metadata for the page
   */
  generateMetadata(): Metadata {
    return {
      title: 'โปรไฟล์ | Racing Queue',
      description: 'จัดการข้อมูลส่วนตัวและการตั้งค่าบัญชีของคุณ',
    };
  }

  /**
   * Update user profile
   */
  async updateProfile(data: UpdateProfileData): Promise<AuthProfile> {
    try {
      return await this.withTimeout(this.authRepository.updateProfile(data));
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  }

  /**
   * Sign out user
   */
  async signOut(): Promise<void> {
    try {
      await this.withTimeout(this.authRepository.signOut());
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  }
}
