'use client';

import { useCustomerStore } from '@/src/presentation/stores/useCustomerStore';
import { useEffect, useState } from 'react';

interface CustomerInfoCardProps {
  /** Whether to show in edit mode initially */
  editMode?: boolean;
  /** Callback when customer info is saved */
  onSave?: () => void;
  /** Compact display mode */
  compact?: boolean;
}

/**
 * CustomerInfoCard - Display and edit customer information
 * 
 * - Shows customer name, phone, and ID status
 * - Allows editing customer info
 * - Stores in localStorage via useCustomerStore
 */
export function CustomerInfoCard({ 
  editMode: initialEditMode = false, 
  onSave,
  compact = false 
}: CustomerInfoCardProps) {
  const { customerInfo, setCustomerInfo, isInitialized } = useCustomerStore();
  
  const [isEditing, setIsEditing] = useState(initialEditMode);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Sync form with store when initialized
  useEffect(() => {
    if (isInitialized) {
      setName(customerInfo.name || '');
      setPhone(customerInfo.phone || '');
      // Auto-show edit mode if no customer info
      if (!customerInfo.name && !customerInfo.phone) {
        setIsEditing(true);
      }
    }
  }, [isInitialized, customerInfo.name, customerInfo.phone]);

  const hasCustomerInfo = customerInfo.name && customerInfo.phone;
  const isVerified = !!customerInfo.id;

  const handleSave = () => {
    if (!name.trim()) {
      setError('กรุณากรอกชื่อ');
      return;
    }
    if (!phone.trim() || phone.trim().length < 9) {
      setError('กรุณากรอกเบอร์โทรให้ถูกต้อง');
      return;
    }

    setCustomerInfo({
      name: name.trim(),
      phone: phone.trim(),
      // Keep existing ID if phone hasn't changed
      id: phone.trim() === customerInfo.phone ? customerInfo.id : '',
    });

    setError(null);
    setIsEditing(false);
    onSave?.();
  };

  const handleCancel = () => {
    setName(customerInfo.name || '');
    setPhone(customerInfo.phone || '');
    setError(null);
    setIsEditing(false);
  };

  // Don't render until hydrated
  if (!isInitialized) {
    return (
      <div className="bg-surface border border-border rounded-xl p-4 animate-pulse">
        <div className="h-6 bg-border rounded w-1/3 mb-2" />
        <div className="h-4 bg-border rounded w-1/2" />
      </div>
    );
  }

  // Compact display mode (for TimeBookingView)
  if (compact && hasCustomerInfo && !isEditing) {
    return (
      <div className="bg-surface border border-border rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">👤</span>
            <div>
              <p className="font-medium text-foreground">{customerInfo.name}</p>
              <p className="text-sm text-muted">{customerInfo.phone}</p>
            </div>
            {isVerified && (
              <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded-full">
                ✓ ยืนยันแล้ว
              </span>
            )}
          </div>
          <button
            onClick={() => setIsEditing(true)}
            className="px-3 py-1.5 text-sm text-muted hover:text-foreground hover:bg-white/5 rounded-lg transition-colors"
          >
            ✏️ แก้ไข
          </button>
        </div>
      </div>
    );
  }

  // Edit mode
  if (isEditing) {
    return (
      <div className="bg-surface border border-border rounded-xl p-4">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xl">👤</span>
          <h3 className="font-semibold text-foreground">
            {hasCustomerInfo ? 'แก้ไขข้อมูล' : 'ลงทะเบียนข้อมูลลูกค้า'}
          </h3>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
            ⚠️ {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-muted mb-1.5">ชื่อ</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="กรอกชื่อของคุณ"
              className="w-full px-4 py-3 bg-background border border-border rounded-xl text-foreground placeholder:text-muted focus:border-purple-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-muted mb-1.5">เบอร์โทรศัพท์</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="08X-XXX-XXXX"
              className="w-full px-4 py-3 bg-background border border-border rounded-xl text-foreground placeholder:text-muted focus:border-purple-500 focus:outline-none"
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleSave}
              className="flex-1 py-3 bg-purple-500 hover:bg-purple-600 text-white font-medium rounded-xl transition-colors"
            >
              💾 บันทึก
            </button>
            {hasCustomerInfo && (
              <button
                onClick={handleCancel}
                className="px-6 py-3 bg-surface hover:bg-white/5 text-muted hover:text-foreground border border-border rounded-xl transition-colors"
              >
                ยกเลิก
              </button>
            )}
          </div>
        </div>

        <p className="mt-4 text-xs text-muted">
          💡 ข้อมูลนี้จะถูกเก็บในเครื่องของคุณ เพื่อใช้ในการจองครั้งต่อไป
        </p>
      </div>
    );
  }

  // Display mode (full)
  return (
    <div className="bg-surface border border-border rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-xl">👤</span>
          <h3 className="font-semibold text-foreground">ข้อมูลของฉัน</h3>
        </div>
        <button
          onClick={() => setIsEditing(true)}
          className="px-3 py-1.5 text-sm text-purple-400 hover:text-purple-300 hover:bg-purple-500/10 rounded-lg transition-colors"
        >
          ✏️ แก้ไข
        </button>
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <span className="text-muted">👤</span>
          <div>
            <p className="text-xs text-muted">ชื่อ</p>
            <p className="font-medium text-foreground">{customerInfo.name || '-'}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-muted">📱</span>
          <div>
            <p className="text-xs text-muted">เบอร์โทร</p>
            <p className="font-medium text-foreground">{customerInfo.phone || '-'}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-muted">🔐</span>
          <div>
            <p className="text-xs text-muted">สถานะ</p>
            {isVerified ? (
              <p className="text-green-400 font-medium flex items-center gap-1">
                ✓ ยืนยันแล้ว <span className="text-xs text-muted">(สามารถยกเลิกการจองได้)</span>
              </p>
            ) : (
              <p className="text-amber-400 font-medium flex items-center gap-1">
                ⚠️ ยังไม่ได้ยืนยัน <span className="text-xs text-muted">(จองเพื่อยืนยันตัวตน)</span>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
