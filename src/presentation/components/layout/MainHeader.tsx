'use client';

import { animated, config, useSpring } from '@react-spring/web';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useAuthPresenter } from '../../presenters/auth/useAuthPresenter';
import { Portal } from '../ui/Portal';
import { ThemeToggle } from '../ui/ThemeToggle';
import { MobileMenu } from './MobileMenu';

export function MainHeader() {
  const router = useRouter();
  const [authState, authActions] = useAuthPresenter();
  const [isHovered, setIsHovered] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  // Logo animation on hover
  const logoSpring = useSpring({
    transform: isHovered ? 'scale(1.05) rotate(-2deg)' : 'scale(1) rotate(0deg)',
    config: config.wobbly,
  });

  // Glow effect for logo
  const glowSpring = useSpring({
    textShadow: isHovered 
      ? '0 0 20px rgba(0, 212, 255, 0.8), 0 0 40px rgba(0, 212, 255, 0.4)'
      : '0 0 10px rgba(0, 212, 255, 0.4)',
    config: config.slow,
  });

  // User dropdown animation
  const userMenuSpring = useSpring({
    opacity: isUserMenuOpen ? 1 : 0,
    transform: isUserMenuOpen ? 'translateY(0px) scale(1)' : 'translateY(-10px) scale(0.95)',
    config: config.stiff,
  });

  const handleLogout = async () => {
    await authActions.signOut();
    setIsUserMenuOpen(false);
    router.push('/');
  };

  // Get display name - prefer fullName from profile, fallback to email
  const displayName = authState.profile?.fullName || authState.user?.email?.split('@')[0] || 'ผู้ใช้';
  const userInitial = displayName.charAt(0).toUpperCase();

  return (
    <>
      <header className="h-16 bg-surface/80 backdrop-blur-lg border-b border-border/50 flex items-center justify-between px-4 md:px-8 z-50">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3">
          <animated.div
            style={logoSpring}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className="flex items-center gap-3"
          >
            {/* Racing Icon */}
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shadow-lg">
              <span className="text-2xl">🏎️</span>
            </div>
            
            <animated.span 
              style={glowSpring}
              className="text-xl font-bold bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 bg-clip-text text-transparent hidden sm:block"
            >
              Racing Queue
            </animated.span>
          </animated.div>
        </Link>

        {/* Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          <NavLink href="/">หน้าแรก</NavLink>
          <NavLink href="/customer">จองคิว</NavLink>
          <NavLink href="/customer/queue-status">สถานะคิว</NavLink>
          <NavLink href="/customer/queue-history">ประวัติคิว</NavLink>
          <NavLink href="/backend">แอดมิน</NavLink>
        </nav>

        {/* Right Section */}
        <div className="flex items-center gap-4">
          {/* Quick Booking Button */}
          <Link 
            href="/quick-booking"
            className="hidden sm:flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-sm font-medium rounded-xl shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 hover:scale-105 transition-all"
          >
            <span>⚡</span>
            <span>จองด่วน</span>
          </Link>

          <div className="hidden md:block">
            <ThemeToggle />
          </div>

          {/* Auth Section */}
          {authState.isLoading ? (
            <div className="w-8 h-8 rounded-full bg-muted-light animate-pulse" />
          ) : authState.isAuthenticated ? (
            /* User Menu - Logged In */
            <div className="relative">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-2 px-2 py-1 rounded-xl hover:bg-muted-light/50 transition-all"
              >
                {/* Avatar */}
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-semibold text-sm shadow-lg shadow-cyan-500/20">
                  {userInitial}
                </div>
                {/* Name - Desktop only */}
                <span className="hidden lg:block text-sm font-medium text-text-primary max-w-[120px] truncate">
                  {displayName}
                </span>
                {/* Dropdown Arrow */}
                <svg 
                  className={`w-4 h-4 text-text-muted transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Dropdown Menu */}
              {isUserMenuOpen && (
                <>
                  {/* Backdrop */}
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setIsUserMenuOpen(false)}
                  />
                  
                  <animated.div
                    style={userMenuSpring}
                    className="absolute right-0 top-full mt-2 w-56 bg-surface border border-border rounded-xl shadow-xl shadow-black/20 z-50 overflow-hidden"
                  >
                    {/* User Info */}
                    <div className="px-4 py-3 border-b border-border bg-muted-light/30">
                      <p className="text-sm font-medium text-text-primary truncate">{displayName}</p>
                      <p className="text-xs text-text-muted truncate">{authState.user?.email}</p>
                    </div>

                    {/* Menu Items */}
                    <div className="py-2">
                      <Link
                        href="/profile"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2 text-sm text-text-secondary hover:bg-muted-light/50 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        โปรไฟล์
                      </Link>
                      <Link
                        href="/customer/queue-history"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2 text-sm text-text-secondary hover:bg-muted-light/50 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        ประวัติการจอง
                      </Link>
                    </div>

                    {/* Logout */}
                    <div className="py-2 border-t border-border">
                      <button
                        onClick={handleLogout}
                        disabled={authState.isSubmitting}
                        className="flex items-center gap-3 w-full px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        {authState.isSubmitting ? 'กำลังออกจากระบบ...' : 'ออกจากระบบ'}
                      </button>
                    </div>
                  </animated.div>
                </>
              )}
            </div>
          ) : null}
          
          {/* Mobile Menu Button */}
          <button 
            onClick={() => setIsMobileMenuOpen(true)}
            className="md:hidden w-10 h-10 rounded-lg bg-surface border border-border flex items-center justify-center hover:bg-muted-light transition-colors"
          >
            <span className="text-xl">☰</span>
          </button>
        </div>
      </header>

      {/* Mobile Menu */}
      <Portal>
        <MobileMenu 
          isOpen={isMobileMenuOpen} 
          onClose={() => setIsMobileMenuOpen(false)} 
        />
      </Portal>
    </>
  );
}

interface NavLinkProps {
  href: string;
  children: React.ReactNode;
}

function NavLink({ href, children }: NavLinkProps) {
  const [isHovered, setIsHovered] = useState(false);

  const spring = useSpring({
    transform: isHovered ? 'translateY(-2px)' : 'translateY(0px)',
    color: isHovered ? 'rgb(0, 212, 255)' : 'rgb(156, 163, 175)',
    config: config.gentle,
  });

  return (
    <Link href={href}>
      <animated.span
        style={spring}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="text-sm font-medium transition-colors cursor-pointer inline-block"
      >
        {children}
      </animated.span>
    </Link>
  );
}
