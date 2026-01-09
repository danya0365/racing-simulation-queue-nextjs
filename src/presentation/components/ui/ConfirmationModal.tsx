'use client';

import { AnimatedButton } from '@/src/presentation/components/ui/AnimatedButton';
import { Portal } from '@/src/presentation/components/ui/Portal';
import { useEffect, useState } from 'react';

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  onConfirm: () => void | Promise<void>;
  onClose: () => void;
  isLoading?: boolean;
}

export function ConfirmationModal({
  isOpen,
  title,
  description,
  confirmText = 'ยืนยัน',
  cancelText = 'ยกเลิก',
  variant = 'danger',
  onConfirm,
  onClose,
  isLoading = false,
}: ConfirmationModalProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
    } else {
      const timer = setTimeout(() => setIsVisible(false), 300); // Wait for exit animation
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isVisible && !isOpen) return null;

  const getIcon = () => {
    switch (variant) {
      case 'danger': return '🗑️';
      case 'warning': return '⚠️';
      case 'info': return 'ℹ️';
      default: return '❓';
    }
  };

  const getGradient = () => {
    switch (variant) {
      case 'danger': return 'from-red-500/20 to-orange-500/20 border-red-500/30';
      case 'warning': return 'from-amber-500/20 to-yellow-500/20 border-amber-500/30';
      case 'info': return 'from-blue-500/20 to-cyan-500/20 border-blue-500/30';
      default: return 'from-gray-500/20 to-gray-500/20 border-gray-500/30';
    }
  };

  const getConfirmButtonVariant = () => {
    switch (variant) {
      case 'danger': return 'danger';
      case 'warning': return 'secondary'; // Or a warning variant if available
      default: return 'primary';
    }
  };

  return (
    <Portal>
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
        {/* Backdrop */}
        <div 
          className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
            isOpen ? 'opacity-100' : 'opacity-0'
          }`} 
          onClick={!isLoading ? onClose : undefined} 
        />
        
        {/* Modal */}
        <div 
          className={`
            relative w-full max-w-sm bg-surface 
            border rounded-2xl shadow-2xl overflow-hidden 
            transform transition-all duration-300
            ${getGradient()}
            ${isOpen ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 translate-y-4'}
          `}
        >
          <div className="p-6 text-center">
            {/* Icon Bubble */}
            <div className="mb-4 flex justify-center">
              <div className={`
                w-16 h-16 rounded-full flex items-center justify-center text-4xl
                bg-gradient-to-br ${variant === 'danger' ? 'from-red-500 to-orange-500' : 'from-amber-500 to-yellow-500'}
                text-white shadow-lg animate-bounce-slow
              `}>
                {getIcon()}
              </div>
            </div>

            <h3 className="text-xl font-bold text-foreground mb-2">{title}</h3>
            {description && (
              <p className="text-muted text-sm mb-6 leading-relaxed">
                {description}
              </p>
            )}

            <div className="flex gap-3">
              <AnimatedButton 
                variant="ghost" 
                onClick={onClose} 
                className="flex-1"
                disabled={isLoading}
              >
                {cancelText}
              </AnimatedButton>
              <AnimatedButton 
                variant={getConfirmButtonVariant()} 
                onClick={onConfirm} 
                className="flex-1"
                disabled={isLoading}
              >
                {isLoading ? '⏳ กำลังดำเนินการ...' : confirmText}
              </AnimatedButton>
            </div>
          </div>
        </div>
      </div>
    </Portal>
  );
}
