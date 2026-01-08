'use client';

import { animated, config, useSpring } from '@react-spring/web';
import { ReactNode, useState } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
type ButtonSize = 'sm' | 'md' | 'lg';

interface AnimatedButtonProps {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:from-cyan-400 hover:to-blue-500 shadow-lg shadow-cyan-500/25',
  secondary: 'bg-gradient-to-r from-purple-500 to-pink-600 text-white hover:from-purple-400 hover:to-pink-500 shadow-lg shadow-purple-500/25',
  ghost: 'bg-transparent border border-border text-foreground hover:bg-surface hover:border-cyan-500',
  danger: 'bg-gradient-to-r from-red-500 to-rose-600 text-white hover:from-red-400 hover:to-rose-500 shadow-lg shadow-red-500/25',
  success: 'bg-gradient-to-r from-emerald-500 to-green-600 text-white hover:from-emerald-400 hover:to-green-500 shadow-lg shadow-emerald-500/25',
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-sm rounded-lg',
  md: 'px-5 py-2.5 text-base rounded-xl',
  lg: 'px-8 py-3.5 text-lg rounded-2xl',
};

export function AnimatedButton({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  onClick,
  className = '',
  type = 'button',
}: AnimatedButtonProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);

  const spring = useSpring({
    transform: isPressed 
      ? 'scale(0.95) translateY(0px)' 
      : isHovered 
        ? 'scale(1.05) translateY(-2px)' 
        : 'scale(1) translateY(0px)',
    config: config.wobbly,
  });

  const glowSpring = useSpring({
    boxShadow: isHovered && !disabled
      ? '0 0 30px rgba(0, 212, 255, 0.4), 0 10px 30px rgba(0, 0, 0, 0.2)'
      : '0 0 0px rgba(0, 212, 255, 0), 0 4px 15px rgba(0, 0, 0, 0.1)',
    config: config.slow,
  });

  return (
    <animated.button
      type={type}
      style={{ ...spring, ...glowSpring }}
      onClick={onClick}
      disabled={disabled || loading}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setIsPressed(false);
      }}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      className={`
        font-semibold transition-all duration-200 
        ${variantStyles[variant]} 
        ${sizeStyles[size]}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${className}
      `}
    >
      {loading ? (
        <span className="flex items-center gap-2">
          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          <span>กำลังโหลด...</span>
        </span>
      ) : (
        children
      )}
    </animated.button>
  );
}
