'use client';

import { animated, config, useSpring } from '@react-spring/web';
import { ReactNode, useRef, useState } from 'react';

interface AnimatedCardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  glowColor?: string;
  disabled?: boolean;
}

export function AnimatedCard({
  children,
  className = '',
  onClick,
  glowColor = 'rgba(0, 212, 255, 0.3)',
  disabled = false,
}: AnimatedCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);

  const spring = useSpring({
    transform: isHovered
      ? `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(20px)`
      : 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateZ(0px)',
    boxShadow: isHovered
      ? `0 25px 50px -12px rgba(0, 0, 0, 0.4), 0 0 40px 0px ${glowColor}`
      : '0 10px 25px -5px rgba(0, 0, 0, 0.2), 0 0 0px 0px rgba(0, 0, 0, 0)',
    config: config.gentle,
  });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current || disabled) return;

    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateXValue = ((y - centerY) / centerY) * -5;
    const rotateYValue = ((x - centerX) / centerX) * 5;

    setRotateX(rotateXValue);
    setRotateY(rotateYValue);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setRotateX(0);
    setRotateY(0);
  };

  return (
    <animated.div
      ref={cardRef}
      style={spring}
      onMouseEnter={() => !disabled && setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      onMouseMove={handleMouseMove}
      onClick={!disabled ? onClick : undefined}
      className={`
        relative overflow-hidden rounded-2xl 
        bg-surface/80 backdrop-blur-xl 
        border border-border/50
        transition-colors duration-300
        ${onClick && !disabled ? 'cursor-pointer' : ''}
        ${disabled ? 'opacity-50' : ''}
        ${className}
      `}
    >
      {/* Gradient overlay on hover */}
      <div 
        className={`
          absolute inset-0 opacity-0 transition-opacity duration-300
          bg-gradient-to-br from-cyan-500/10 via-transparent to-purple-500/10
          ${isHovered ? 'opacity-100' : ''}
        `}
      />
      
      {/* Shine effect */}
      <div 
        className={`
          absolute inset-0 opacity-0 transition-opacity duration-500
          bg-gradient-to-r from-transparent via-white/10 to-transparent
          -translate-x-full
          ${isHovered ? 'opacity-100 translate-x-full' : ''}
        `}
        style={{ transition: 'transform 0.6s ease-out, opacity 0.3s' }}
      />

      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </animated.div>
  );
}
