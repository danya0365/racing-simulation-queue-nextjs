'use client';

import { animated, config, useSpring } from '@react-spring/web';
import { ReactNode, useState } from 'react';

type GlowColor = 'cyan' | 'purple' | 'pink' | 'green' | 'red' | 'orange';

interface GlowButtonProps {
  children: ReactNode;
  color?: GlowColor;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const glowColors: Record<GlowColor, { base: string; glow: string; text: string }> = {
  cyan: {
    base: 'from-cyan-400 to-cyan-600',
    glow: 'rgba(0, 212, 255, 0.6)',
    text: 'text-cyan-400',
  },
  purple: {
    base: 'from-purple-400 to-purple-600',
    glow: 'rgba(168, 85, 247, 0.6)',
    text: 'text-purple-400',
  },
  pink: {
    base: 'from-pink-400 to-pink-600',
    glow: 'rgba(236, 72, 153, 0.6)',
    text: 'text-pink-400',
  },
  green: {
    base: 'from-emerald-400 to-emerald-600',
    glow: 'rgba(16, 185, 129, 0.6)',
    text: 'text-emerald-400',
  },
  red: {
    base: 'from-red-400 to-red-600',
    glow: 'rgba(239, 68, 68, 0.6)',
    text: 'text-red-400',
  },
  orange: {
    base: 'from-orange-400 to-orange-600',
    glow: 'rgba(251, 146, 60, 0.6)',
    text: 'text-orange-400',
  },
};

const sizeStyles = {
  sm: 'px-4 py-2 text-sm',
  md: 'px-6 py-3 text-base',
  lg: 'px-8 py-4 text-lg',
};

export function GlowButton({
  children,
  color = 'cyan',
  onClick,
  disabled = false,
  className = '',
  size = 'md',
}: GlowButtonProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);

  const colorConfig = glowColors[color];

  const spring = useSpring({
    scale: isPressed ? 0.95 : isHovered ? 1.05 : 1,
    config: config.wobbly,
  });

  const glowSpring = useSpring({
    boxShadow: isHovered
      ? `0 0 40px ${colorConfig.glow}, 0 0 80px ${colorConfig.glow}, inset 0 0 20px rgba(255, 255, 255, 0.1)`
      : `0 0 15px ${colorConfig.glow}, 0 0 30px rgba(0, 0, 0, 0.3)`,
    config: config.slow,
  });

  const borderSpring = useSpring({
    borderColor: isHovered ? 'rgba(255, 255, 255, 0.5)' : 'rgba(255, 255, 255, 0.2)',
    config: config.gentle,
  });

  return (
    <animated.button
      style={{
        transform: spring.scale.to((s) => `scale(${s})`),
        ...glowSpring,
        ...borderSpring,
      }}
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => !disabled && setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setIsPressed(false);
      }}
      onMouseDown={() => !disabled && setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      className={`
        relative overflow-hidden rounded-xl
        bg-gradient-to-r ${colorConfig.base}
        border-2 font-bold
        transition-all duration-200
        ${sizeStyles[size]}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${className}
      `}
    >
      {/* Inner glow effect */}
      <span className="absolute inset-0 bg-gradient-to-t from-black/20 to-white/20" />
      
      {/* Animated shine */}
      <span 
        className={`
          absolute inset-0 opacity-0 
          bg-gradient-to-r from-transparent via-white/30 to-transparent
          transition-opacity duration-300
          ${isHovered ? 'opacity-100 animate-shine' : ''}
        `}
      />

      {/* Text content */}
      <span className="relative z-10 text-white font-semibold tracking-wide">
        {children}
      </span>
    </animated.button>
  );
}
