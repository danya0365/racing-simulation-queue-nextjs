'use client';

import { animated, config, useSpring } from '@react-spring/web';
import Link from 'next/link';
import { useState } from 'react';
import { Portal } from '../ui/Portal';
import { ThemeToggle } from '../ui/ThemeToggle';
import { MobileMenu } from './MobileMenu';

export function MainHeader() {
  const [isHovered, setIsHovered] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
          <div className="hidden md:block">
            <ThemeToggle />
          </div>
          
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
