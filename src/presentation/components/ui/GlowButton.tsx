'use client';

import { ReactNode } from 'react';

type GlowColor = 'cyan' | 'purple' | 'pink' | 'green' | 'red' | 'orange';

interface GlowButtonProps {
  children: ReactNode;
  color?: GlowColor;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const glowColors: Record<GlowColor, { base: string; glow: string; hover: string }> = {
  cyan: {
    base: 'from-cyan-400 to-cyan-600',
    glow: 'shadow-cyan-500/50 hover:shadow-cyan-400/60',
    hover: 'hover:from-cyan-300 hover:to-cyan-500',
  },
  purple: {
    base: 'from-purple-400 to-purple-600',
    glow: 'shadow-purple-500/50 hover:shadow-purple-400/60',
    hover: 'hover:from-purple-300 hover:to-purple-500',
  },
  pink: {
    base: 'from-pink-400 to-pink-600',
    glow: 'shadow-pink-500/50 hover:shadow-pink-400/60',
    hover: 'hover:from-pink-300 hover:to-pink-500',
  },
  green: {
    base: 'from-emerald-400 to-emerald-600',
    glow: 'shadow-emerald-500/50 hover:shadow-emerald-400/60',
    hover: 'hover:from-emerald-300 hover:to-emerald-500',
  },
  red: {
    base: 'from-red-400 to-red-600',
    glow: 'shadow-red-500/50 hover:shadow-red-400/60',
    hover: 'hover:from-red-300 hover:to-red-500',
  },
  orange: {
    base: 'from-orange-400 to-orange-600',
    glow: 'shadow-orange-500/50 hover:shadow-orange-400/60',
    hover: 'hover:from-orange-300 hover:to-orange-500',
  },
};

const sizeStyles = {
  sm: 'px-4 py-2 text-sm',
  md: 'px-6 py-3 text-base',
  lg: 'px-8 py-4 text-lg',
};

/**
 * GlowButton - Uses CSS transitions for better performance
 * Replaced react-spring with CSS to avoid render blocking issues
 */
export function GlowButton({
  children,
  color = 'cyan',
  onClick,
  disabled = false,
  className = '',
  size = 'md',
}: GlowButtonProps) {
  const colorConfig = glowColors[color];

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        relative overflow-hidden rounded-xl
        bg-gradient-to-r ${colorConfig.base} ${colorConfig.hover}
        border-2 border-white/20 hover:border-white/40
        font-bold text-white
        shadow-lg ${colorConfig.glow}
        hover:shadow-xl
        transform transition-all duration-200 ease-out
        hover:scale-105 hover:-translate-y-0.5
        active:scale-95 active:translate-y-0
        ${sizeStyles[size]}
        ${disabled ? 'opacity-50 cursor-not-allowed hover:scale-100 hover:translate-y-0' : 'cursor-pointer'}
        ${className}
      `}
    >
      {/* Inner glow effect */}
      <span className="absolute inset-0 bg-gradient-to-t from-black/20 to-white/20" />
      
      {/* Shine effect on hover - using CSS animation */}
      <span 
        className="
          absolute inset-0 opacity-0 
          bg-gradient-to-r from-transparent via-white/30 to-transparent
          transition-opacity duration-300
          hover:opacity-100
        "
      />

      {/* Text content */}
      <span className="relative z-10 font-semibold tracking-wide">
        {children}
      </span>
    </button>
  );
}
