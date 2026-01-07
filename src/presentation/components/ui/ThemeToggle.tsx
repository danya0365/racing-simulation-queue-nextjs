'use client';

import { animated, config, useSpring } from '@react-spring/web';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = resolvedTheme === 'dark';

  // Animation for the toggle button
  const springProps = useSpring({
    transform: isDark ? 'rotate(180deg)' : 'rotate(0deg)',
    config: config.wobbly,
  });

  // Animation for the icon
  const iconSpring = useSpring({
    opacity: mounted ? 1 : 0,
    scale: mounted ? 1 : 0.5,
    config: config.gentle,
  });

  // Glow animation
  const glowSpring = useSpring({
    boxShadow: isDark 
      ? '0 0 20px rgba(168, 85, 247, 0.4), 0 0 40px rgba(168, 85, 247, 0.2)'
      : '0 0 20px rgba(251, 191, 36, 0.4), 0 0 40px rgba(251, 191, 36, 0.2)',
    config: config.slow,
  });

  const toggleTheme = () => {
    setTheme(isDark ? 'light' : 'dark');
  };

  if (!mounted) {
    return (
      <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
    );
  }

  return (
    <animated.button
      onClick={toggleTheme}
      style={{ ...springProps, ...glowSpring }}
      className="relative w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 dark:from-purple-500 dark:to-indigo-600 flex items-center justify-center transition-colors duration-300 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2 focus:ring-offset-background"
      aria-label={isDark ? 'เปลี่ยนเป็นโหมดสว่าง' : 'เปลี่ยนเป็นโหมดมืด'}
    >
      <animated.span style={iconSpring} className="text-white text-lg">
        {isDark ? '🌙' : '☀️'}
      </animated.span>
      
      {/* Animated ring */}
      <span className="absolute inset-0 rounded-full border-2 border-white/20 animate-pulse" />
    </animated.button>
  );
}
