'use client';

import { animated, config, useSpring } from '@react-spring/web';
import Link from 'next/link';
import { ThemeToggle } from '../ui/ThemeToggle';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileMenu({ isOpen, onClose }: MobileMenuProps) {
  const backdropSpring = useSpring({
    opacity: isOpen ? 1 : 0,
    config: config.gentle,
  });

  const menuSpring = useSpring({
    transform: isOpen ? 'translateX(0%)' : 'translateX(100%)',
    config: config.gentle,
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      {/* Backdrop */}
      <animated.div
        style={backdropSpring}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Menu Panel */}
      <animated.div
        style={menuSpring}
        className="absolute right-0 top-0 h-full w-72 bg-surface border-l border-border shadow-2xl"
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

        {/* Navigation Links */}
        <nav className="p-4 space-y-2">
          <MobileNavLink href="/" onClick={onClose} icon="🏠">
            หน้าแรก
          </MobileNavLink>
          <MobileNavLink href="/customer" onClick={onClose} icon="🎮">
            จองคิว
          </MobileNavLink>
          <MobileNavLink href="/backend" onClick={onClose} icon="⚙️">
            แอดมิน
          </MobileNavLink>
        </nav>

        {/* Theme Toggle */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted">เปลี่ยนธีม</span>
            <ThemeToggle />
          </div>
        </div>
      </animated.div>
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
