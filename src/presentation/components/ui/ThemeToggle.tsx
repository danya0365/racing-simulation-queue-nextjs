'use client';

import { useTheme } from 'next-themes';
import { useSyncExternalStore } from 'react';

// Subscription function that never triggers updates
const emptySubscribe = () => () => {};

// Server always returns false
const getServerSnapshot = () => false;

// Client returns true after hydration
const getClientSnapshot = () => true;

/**
 * ThemeToggle - Uses CSS transitions for better performance
 * Replaced react-spring with CSS to avoid render blocking issues
 */
export function ThemeToggle() {
  const { setTheme, resolvedTheme } = useTheme();
  
  // useSyncExternalStore is the recommended way to handle client-only rendering
  const mounted = useSyncExternalStore(emptySubscribe, getClientSnapshot, getServerSnapshot);

  const isDark = resolvedTheme === 'dark';

  const toggleTheme = () => {
    setTheme(isDark ? 'light' : 'dark');
  };

  if (!mounted) {
    return (
      <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
    );
  }

  return (
    <button
      onClick={toggleTheme}
      className={`
        relative w-10 h-10 rounded-full 
        flex items-center justify-center 
        transition-all duration-300 ease-out
        hover:scale-110 
        focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2 focus:ring-offset-background
        ${isDark 
          ? 'bg-gradient-to-br from-purple-500 to-indigo-600 shadow-lg shadow-purple-500/40' 
          : 'bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg shadow-amber-500/40'
        }
      `}
      aria-label={isDark ? 'เปลี่ยนเป็นโหมดสว่าง' : 'เปลี่ยนเป็นโหมดมืด'}
    >
      <span 
        className={`
          text-white text-lg transition-transform duration-300
          ${isDark ? 'rotate-180' : 'rotate-0'}
        `}
      >
        {isDark ? '🌙' : '☀️'}
      </span>
      
      {/* Animated ring */}
      <span className="absolute inset-0 rounded-full border-2 border-white/20 animate-pulse" />
    </button>
  );
}
