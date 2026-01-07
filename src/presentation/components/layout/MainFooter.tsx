'use client';

import { animated, config, useSpring } from '@react-spring/web';
import Link from 'next/link';
import { useState } from 'react';

export function MainFooter() {
  return (
    <footer className="h-14 bg-surface/80 backdrop-blur-lg border-t border-border/50 flex items-center justify-between px-4 md:px-8">
      {/* Copyright */}
      <div className="flex items-center gap-2 text-sm text-muted">
        <span>© 2025</span>
        <AnimatedBrand />
      </div>

      {/* Quick Links */}
      <div className="flex items-center gap-4">
        <FooterLink href="/customer">จองคิว</FooterLink>
        <span className="text-border">|</span>
        <FooterLink href="/backend">แอดมิน</FooterLink>
      </div>

      {/* Status Indicator */}
      <div className="hidden sm:flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
        <span className="text-xs text-muted">ระบบพร้อมใช้งาน</span>
      </div>
    </footer>
  );
}

function AnimatedBrand() {
  const [isHovered, setIsHovered] = useState(false);

  const spring = useSpring({
    transform: isHovered ? 'scale(1.1)' : 'scale(1)',
    config: config.wobbly,
  });

  return (
    <animated.span
      style={spring}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="font-semibold bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent cursor-default"
    >
      Racing Queue System
    </animated.span>
  );
}

interface FooterLinkProps {
  href: string;
  children: React.ReactNode;
}

function FooterLink({ href, children }: FooterLinkProps) {
  const [isHovered, setIsHovered] = useState(false);

  const spring = useSpring({
    color: isHovered ? 'rgb(0, 212, 255)' : 'rgb(107, 114, 128)',
    config: config.gentle,
  });

  return (
    <Link href={href}>
      <animated.span
        style={spring}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="text-xs font-medium cursor-pointer"
      >
        {children}
      </animated.span>
    </Link>
  );
}
