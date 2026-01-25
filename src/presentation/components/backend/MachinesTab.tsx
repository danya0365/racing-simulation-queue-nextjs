'use client';

import { MachineStatus } from '@/src/application/repositories/IMachineRepository';
import { AnimatedButton } from '@/src/presentation/components/ui/AnimatedButton';
import { AnimatedCard } from '@/src/presentation/components/ui/AnimatedCard';
import { Portal } from '@/src/presentation/components/ui/Portal';
import { useState } from 'react';

interface MachinesTabProps {
  machines: Array<{
    id: string;
    name: string;
    description: string;
    status: string;
    position: number;
    isActive: boolean;
    imageUrl?: string;
  }>;
  isUpdating: boolean;
  onUpdateStatus: (id: string, status: MachineStatus) => Promise<void>;
  onUpdateMachine: (id: string, data: {
    name?: string;
    description?: string;
    position?: number;
    imageUrl?: string;
    isActive?: boolean;
    status?: MachineStatus;
  }) => Promise<void>;
}

export function MachinesTab({ machines, isUpdating, onUpdateStatus, onUpdateMachine }: MachinesTabProps) {
  const [editingMachine, setEditingMachine] = useState<typeof machines[0] | null>(null);

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'available':
        return { label: 'ว่าง', color: 'bg-emerald-500', textColor: 'text-emerald-400' };
      case 'occupied':
        return { label: 'กำลังเล่น', color: 'bg-orange-500', textColor: 'text-orange-400' };
      case 'maintenance':
        return { label: 'ซ่อมบำรุง', color: 'bg-gray-500', textColor: 'text-gray-400' };
      default:
        return { label: status, color: 'bg-gray-500', textColor: 'text-gray-400' };
    }
  };

  const handleToggleActive = async (machine: typeof machines[0]) => {
    await onUpdateMachine(machine.id, { isActive: !machine.isActive });
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {machines.map((machine) => {
          const statusConfig = getStatusConfig(machine.status);
          return (
            <AnimatedCard 
              key={machine.id} 
              className={`p-6 ${!machine.isActive ? 'opacity-60' : ''}`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-2xl">
                    🎮
                  </div>
                  <div>
                    <h4 className="font-bold text-foreground flex items-center gap-2">
                      {machine.name}
                      {!machine.isActive && (
                        <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-xs rounded-full">
                          ซ่อน
                        </span>
                      )}
                    </h4>
                    <p className="text-sm text-muted">เครื่องที่ {machine.position}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full ${statusConfig.color} text-white text-xs font-medium`}>
                    {statusConfig.label}
                  </span>
                </div>
              </div>

              <p className="text-sm text-muted mb-4 line-clamp-2">{machine.description}</p>

              <div className="flex flex-wrap gap-2">
                {/* Toggle Active Button */}
                <AnimatedButton
                  variant={machine.isActive ? 'ghost' : 'success'}
                  size="sm"
                  onClick={() => handleToggleActive(machine)}
                  disabled={isUpdating}
                >
                  {machine.isActive ? '👁️ ซ่อน' : '👁️ แสดง'}
                </AnimatedButton>

                {/* Status Buttons */}
                {machine.status !== 'available' && (
                  <AnimatedButton
                    variant="success"
                    size="sm"
                    onClick={() => onUpdateStatus(machine.id, 'available')}
                    disabled={isUpdating}
                  >
                    ✅ เปิดใช้งาน
                  </AnimatedButton>
                )}
                {machine.status !== 'maintenance' && (
                  <AnimatedButton
                    variant="ghost"
                    size="sm"
                    onClick={() => onUpdateStatus(machine.id, 'maintenance')}
                    disabled={isUpdating}
                  >
                    🔧 ซ่อมบำรุง
                  </AnimatedButton>
                )}

                {/* Edit Button */}
                <AnimatedButton
                  variant="secondary"
                  size="sm"
                  onClick={() => setEditingMachine(machine)}
                  disabled={isUpdating}
                >
                  ✏️ แก้ไข
                </AnimatedButton>
              </div>
            </AnimatedCard>
          );
        })}
      </div>

      {/* Edit Machine Modal */}
      {editingMachine && (
        <Portal>
          <EditMachineModal
            machine={editingMachine}
            onClose={() => setEditingMachine(null)}
            onSave={async (data) => {
              await onUpdateMachine(editingMachine.id, data);
              setEditingMachine(null);
            }}
            isUpdating={isUpdating}
          />
        </Portal>
      )}
    </>
  );
}

// Edit Machine Modal
interface EditMachineModalProps {
  machine: {
    id: string;
    name: string;
    description: string;
    status: string;
    position: number;
    isActive: boolean;
    imageUrl?: string;
  };
  onClose: () => void;
  onSave: (data: {
    name?: string;
    description?: string;
    position?: number;
    imageUrl?: string;
    isActive?: boolean;
    status?: MachineStatus;
  }) => Promise<void>;
  isUpdating: boolean;
}

function EditMachineModal({ machine, onClose, onSave, isUpdating }: EditMachineModalProps) {
  const [formData, setFormData] = useState({
    name: machine.name,
    description: machine.description,
    position: machine.position,
    imageUrl: machine.imageUrl || '',
    isActive: machine.isActive,
    status: machine.status as MachineStatus,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave({
      name: formData.name,
      description: formData.description,
      position: formData.position,
      imageUrl: formData.imageUrl || undefined,
      isActive: formData.isActive,
      status: formData.status,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-backdrop-in" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-surface border border-border rounded-2xl shadow-2xl overflow-hidden animate-modal-in">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border-b border-border flex justify-between items-center">
          <h3 className="font-bold text-lg text-foreground">✏️ แก้ไขเครื่อง</h3>
          <button onClick={onClose} className="text-muted hover:text-foreground transition-colors" type="button">✕</button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm text-muted mb-1">ชื่อเครื่อง</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-cyan-500 text-foreground"
              placeholder="เช่น Racing Sim 1"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm text-muted mb-1">รายละเอียด</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-cyan-500 text-foreground resize-none"
              rows={3}
              placeholder="เช่น เครื่อง Formula Racing Simulator พร้อมพวงมาลัย..."
            />
          </div>

          {/* Position */}
          <div>
            <label className="block text-sm text-muted mb-1">ลำดับเครื่อง</label>
            <input
              type="number"
              min="1"
              required
              value={formData.position}
              onChange={(e) => setFormData({ ...formData, position: parseInt(e.target.value) || 1 })}
              className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-cyan-500 text-foreground"
            />
          </div>

          {/* Image URL */}
          <div>
            <label className="block text-sm text-muted mb-1">URL รูปภาพ (optional)</label>
            <input
              type="url"
              value={formData.imageUrl}
              onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
              className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-cyan-500 text-foreground"
              placeholder="https://..."
            />
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm text-muted mb-1">สถานะ</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as MachineStatus })}
              className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-cyan-500 text-foreground"
            >
              <option value="available">✅ ว่าง</option>
              <option value="occupied">🏁 กำลังเล่น</option>
              <option value="maintenance">🔧 ซ่อมบำรุง</option>
            </select>
          </div>

          {/* isActive Toggle */}
          <div className="flex items-center justify-between p-3 bg-background rounded-xl border border-border">
            <div>
              <p className="font-medium text-foreground">แสดงในหน้าลูกค้า</p>
              <p className="text-xs text-muted">เมื่อปิด เครื่องนี้จะไม่แสดงให้ลูกค้าเห็น</p>
            </div>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
              className={`relative w-14 h-8 rounded-full transition-colors ${
                formData.isActive ? 'bg-emerald-500' : 'bg-gray-500'
              }`}
            >
              <span className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow transition-transform ${
                formData.isActive ? 'left-7' : 'left-1'
              }`} />
            </button>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <AnimatedButton variant="ghost" onClick={onClose} className="flex-1" disabled={isUpdating}>
              ยกเลิก
            </AnimatedButton>
            <AnimatedButton variant="primary" type="submit" className="flex-1" disabled={isUpdating}>
              {isUpdating ? '⏳ กำลังบันทึก...' : '💾 บันทึก'}
            </AnimatedButton>
          </div>
        </form>
      </div>
    </div>
  );
}
