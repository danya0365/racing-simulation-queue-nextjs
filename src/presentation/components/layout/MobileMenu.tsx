'use client';

import { NAV_LINKS } from '@/src/config/navigation.config';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthPresenter } from '../../presenters/auth/useAuthPresenter';
import { ThemeToggle } from '../ui/ThemeToggle';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileMenu({ isOpen, onClose }: MobileMenuProps) {
  const router = useRouter();
  const [authState, authActions] = useAuthPresenter();

  const handleLogout = async () => {
    await authActions.signOut();
    onClose();
    router.push('/');
  };

  // Get display name - prefer fullName from profile, fallback to email
  const displayName = authState.profile?.fullName || authState.user?.email?.split('@')[0] || 'ผู้ใช้';
  const userInitial = displayName.charAt(0).toUpperCase();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-backdrop-in"
        onClick={onClose}
      />

      {/* Menu Panel */}
      <div
        className="absolute right-0 top-0 h-full w-72 bg-surface border-l border-border shadow-2xl flex flex-col animate-slide-in-right"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <span className="font-bold text-foreground">เมนู</span>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-background flex items-center justify-center text-muted hover:text-foreground transition-colors"
          >
            ✕
          </button>
        </div>

        {/* User Section */}
        {authState.isLoading ? (
          <div className="p-4 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-muted-light animate-pulse" />
              <div className="flex-1">
                <div className="h-4 w-24 bg-muted-light animate-pulse rounded" />
                <div className="h-3 w-32 bg-muted-light animate-pulse rounded mt-1" />
              </div>
            </div>
          </div>
        ) : authState.isAuthenticated ? (
          <div className="p-4 border-b border-border bg-muted-light/20">
            <div className="flex items-center gap-3">
              {/* Avatar */}
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-semibold shadow-lg shadow-cyan-500/20">
                {userInitial}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground truncate">{displayName}</p>
                <p className="text-xs text-muted truncate">{authState.user?.email}</p>
              </div>
            </div>
          </div>
        ) : null}

        {/* Navigation Links */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto border-b border-border">
          <div className="pb-2 mb-2 border-b border-border/50">
            <p className="text-[10px] font-bold text-muted uppercase px-4 mb-2 tracking-wider">เมนูหลัก</p>
            {NAV_LINKS.map((link) => (
              <MobileNavLink 
                key={link.href} 
                href={link.href} 
                onClick={onClose} 
                icon={link.icon}
              >
                {link.label}
              </MobileNavLink>
            ))}
          </div>
 
          {/* Logged in user links */}
          {authState.isAuthenticated && (
            <div>
              <p className="text-[10px] font-bold text-muted uppercase px-4 mb-2 tracking-wider">บัญชีของฉัน</p>
              <MobileNavLink href="/customer/queue-status" onClick={onClose} icon="⚡">
                สถานะคิวปัจจุบัน
              </MobileNavLink>
              <MobileNavLink href="/customer/queue-history" onClick={onClose} icon="🕒">
                ประวัติคิว
              </MobileNavLink>
              <MobileNavLink href="/profile" onClick={onClose} icon="👤">
                โปรไฟล์
              </MobileNavLink>
            </div>
          )}
        </nav>

        {/* Bottom Section */}
        <div className="p-4 border-t border-border space-y-3">
          {/* Theme Toggle */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted">เปลี่ยนธีม</span>
            <ThemeToggle />
          </div>

          {/* Logout Button - Only when logged in */}
          {authState.isAuthenticated && (
            <button
              onClick={handleLogout}
              disabled={authState.isSubmitting}
              className="flex items-center justify-center gap-2 w-full px-4 py-2.5 text-sm font-medium text-red-400 bg-red-500/10 rounded-xl hover:bg-red-500/20 transition-colors disabled:opacity-50"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              {authState.isSubmitting ? 'กำลังออกจากระบบ...' : 'ออกจากระบบ'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

interface MobileNavLinkProps {
  href: string;
  onClick: () => void;
  icon: string;
  children: React.ReactNode;
}

function MobileNavLink({ href, onClick, icon, children }: MobileNavLinkProps) {
  return (
    <Link href={href} onClick={onClick}>
      <div className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-muted-light transition-colors">
        <span className="text-xl">{icon}</span>
        <span className="font-medium text-foreground">{children}</span>
      </div>
    </Link>
  );
}
