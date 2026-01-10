'use client';

import { ProfileViewModel } from '@/src/presentation/presenters/profile/ProfilePresenter';
import { useProfilePresenter } from '@/src/presentation/presenters/profile/useProfilePresenter';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface ProfileViewProps {
  initialViewModel?: ProfileViewModel;
}

export function ProfileView({ initialViewModel }: ProfileViewProps) {
  const router = useRouter();
  const [state, actions] = useProfilePresenter(initialViewModel);
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
  });

  const viewModel = state.viewModel;

  // Initialize form when starting edit
  const handleStartEditing = () => {
    setFormData({
      fullName: viewModel?.profile?.fullName || '',
      phone: viewModel?.profile?.phone || '',
    });
    actions.startEditing();
  };

  const handleSaveProfile = async () => {
    const success = await actions.updateProfile({
      fullName: formData.fullName || undefined,
      phone: formData.phone || undefined,
    });
    
    if (success) {
      // Form data will be updated on next render from viewModel
    }
  };

  const handleLogout = async () => {
    await actions.signOut();
    router.push('/');
  };

  // Loading state
  if (state.loading && !viewModel) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  // Error state without data
  if (state.error && !viewModel) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-surface border border-border rounded-2xl p-8 text-center animate-modal-in">
          <div className="text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-foreground mb-2">เกิดข้อผิดพลาด</h1>
          <p className="text-muted mb-6">{state.error}</p>
          <button
            onClick={actions.loadData}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-medium rounded-xl shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 hover:scale-105 transition-all"
          >
            <span>🔄</span>
            <span>ลองใหม่อีกครั้ง</span>
          </button>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!viewModel?.isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-surface border border-border rounded-2xl p-8 text-center animate-modal-in">
          <div className="text-6xl mb-4">🔒</div>
          <h1 className="text-2xl font-bold text-foreground mb-2">ต้องเข้าสู่ระบบ</h1>
          <p className="text-muted mb-6">กรุณาเข้าสู่ระบบเพื่อดูโปรไฟล์ของคุณ</p>
          <Link 
            href="/auth/login?redirectTo=/profile"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-medium rounded-xl shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 hover:scale-105 transition-all"
          >
            <span>🚀</span>
            <span>เข้าสู่ระบบ</span>
          </Link>
        </div>
      </div>
    );
  }

  const displayName = viewModel.profile?.fullName || viewModel.user?.email?.split('@')[0] || 'ผู้ใช้';
  const userInitial = displayName.charAt(0).toUpperCase();

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-cyan-500/20 via-blue-500/10 to-purple-500/20 py-12">
        <div className="absolute inset-0 bg-[url('/styles/grid-pattern.svg')] opacity-10" />
        <div className="relative z-10 max-w-4xl mx-auto px-4">
          <div className="text-center animate-hero-in">
            {/* Avatar */}
            <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-4xl font-bold text-white shadow-2xl shadow-cyan-500/30 mb-4">
              {userInitial}
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-1">{displayName}</h1>
            <p className="text-muted">{viewModel.user?.email}</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Success/Error Messages */}
        {state.successMessage && (
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400">
            ✅ {state.successMessage}
          </div>
        )}
        {state.error && (
          <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400">
            ❌ {state.error}
          </div>
        )}

        {/* Profile Info Card */}
        <div className="bg-surface border border-border rounded-2xl overflow-hidden animate-section-in">
          <div className="p-4 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border-b border-border flex items-center justify-between">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <span>👤</span>
              <span>ข้อมูลส่วนตัว</span>
            </h2>
            {!state.isEditing && (
              <button
                onClick={handleStartEditing}
                className="px-4 py-2 bg-cyan-500/20 text-cyan-400 rounded-lg text-sm font-medium hover:bg-cyan-500/30 transition-colors"
              >
                ✏️ แก้ไข
              </button>
            )}
          </div>

          <div className="p-6 space-y-4">
            {state.isEditing ? (
              <>
                <div>
                  <label className="block text-sm font-medium text-muted mb-2">ชื่อ-นามสกุล</label>
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 text-foreground"
                    placeholder="กรอกชื่อ-นามสกุล"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted mb-2">เบอร์โทรศัพท์</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 text-foreground"
                    placeholder="กรอกเบอร์โทรศัพท์"
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={actions.cancelEditing}
                    className="flex-1 px-4 py-3 bg-background border border-border rounded-xl text-muted hover:bg-muted-light transition-colors"
                    disabled={state.isSubmitting}
                  >
                    ยกเลิก
                  </button>
                  <button
                    onClick={handleSaveProfile}
                    disabled={state.isSubmitting}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-medium rounded-xl shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 transition-all disabled:opacity-50"
                  >
                    {state.isSubmitting ? '⏳ กำลังบันทึก...' : '💾 บันทึก'}
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center justify-between py-3 border-b border-border/50">
                  <span className="text-muted">อีเมล</span>
                  <span className="text-foreground font-medium">{viewModel.user?.email}</span>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-border/50">
                  <span className="text-muted">ชื่อ-นามสกุล</span>
                  <span className="text-foreground font-medium">
                    {viewModel.profile?.fullName || '-'}
                  </span>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-border/50">
                  <span className="text-muted">เบอร์โทรศัพท์</span>
                  <span className="text-foreground font-medium">
                    {viewModel.profile?.phone || '-'}
                  </span>
                </div>
                <div className="flex items-center justify-between py-3">
                  <span className="text-muted">สถานะ</span>
                  <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-sm font-medium">
                    ✓ ยืนยันแล้ว
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Quick Actions Card */}
        <div className="bg-surface border border-border rounded-2xl overflow-hidden animate-section-in">
          <div className="p-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-b border-border">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <span>⚡</span>
              <span>ทางลัด</span>
            </h2>
          </div>

          <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-3">
            <Link 
              href="/customer"
              className="flex flex-col items-center gap-2 p-4 bg-background rounded-xl border border-border hover:border-cyan-500/50 hover:bg-cyan-500/5 transition-all text-center"
            >
              <span className="text-3xl">🎮</span>
              <span className="text-sm font-medium text-foreground">จองคิว</span>
            </Link>
            <Link 
              href="/customer/queue-status"
              className="flex flex-col items-center gap-2 p-4 bg-background rounded-xl border border-border hover:border-purple-500/50 hover:bg-purple-500/5 transition-all text-center"
            >
              <span className="text-3xl">📋</span>
              <span className="text-sm font-medium text-foreground">สถานะคิว</span>
            </Link>
            <Link 
              href="/customer/queue-history"
              className="flex flex-col items-center gap-2 p-4 bg-background rounded-xl border border-border hover:border-amber-500/50 hover:bg-amber-500/5 transition-all text-center"
            >
              <span className="text-3xl">📜</span>
              <span className="text-sm font-medium text-foreground">ประวัติ</span>
            </Link>
            <Link 
              href="/quick-booking"
              className="flex flex-col items-center gap-2 p-4 bg-background rounded-xl border border-border hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all text-center"
            >
              <span className="text-3xl">⚡</span>
              <span className="text-sm font-medium text-foreground">จองด่วน</span>
            </Link>
          </div>
        </div>

        {/* Logout Button */}
        <div>
          <button
            onClick={handleLogout}
            disabled={state.isSubmitting}
            className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-red-500/10 border border-red-500/30 text-red-400 font-medium rounded-xl hover:bg-red-500/20 transition-colors disabled:opacity-50"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span>{state.isSubmitting ? 'กำลังออกจากระบบ...' : 'ออกจากระบบ'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
