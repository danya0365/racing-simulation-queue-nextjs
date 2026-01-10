'use client';

import { ReactNode } from 'react';

interface AnimatedCardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  glowColor?: string;
  disabled?: boolean;
}

/**
 * AnimatedCard - Uses CSS transitions for better performance
 * Replaced react-spring with CSS to avoid render blocking issues
 */
export function AnimatedCard({
  children,
  className = '',
  onClick,
  disabled = false,
}: AnimatedCardProps) {
  return (
    <div
      onClick={!disabled ? onClick : undefined}
      className={`
        relative overflow-hidden rounded-2xl 
        bg-surface/80 backdrop-blur-xl 
        border border-border/50
        transition-all duration-300 ease-out
        hover:shadow-xl hover:shadow-cyan-500/10
        hover:border-cyan-500/30
        hover:-translate-y-1
        ${onClick && !disabled ? 'cursor-pointer' : ''}
        ${disabled ? 'opacity-50 hover:translate-y-0 hover:shadow-none' : ''}
        ${className}
      `}
    >
      {/* Gradient overlay on hover - using CSS group hover */}
      <div 
        className="
          absolute inset-0 opacity-0 transition-opacity duration-300
          bg-gradient-to-br from-cyan-500/5 via-transparent to-purple-500/5
          group-hover:opacity-100
        "
      />

      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}
