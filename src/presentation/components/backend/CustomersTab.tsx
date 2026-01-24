'use client';

import { Customer, UpdateCustomerData } from '@/src/application/repositories/ICustomerRepository';
import { CUSTOMER_CONFIG } from '@/src/config/customerConfig';
import { AnimatedButton } from '@/src/presentation/components/ui/AnimatedButton';
import { AnimatedCard } from '@/src/presentation/components/ui/AnimatedCard';
import { ConfirmationModal } from '@/src/presentation/components/ui/ConfirmationModal';
import { GlowButton } from '@/src/presentation/components/ui/GlowButton';
import { Portal } from '@/src/presentation/components/ui/Portal';
import { CustomersTabSkeleton } from '@/src/presentation/components/ui/Skeleton';
import { useCustomersPresenter } from '@/src/presentation/presenters/customers/useCustomersPresenter';
import dayjs from 'dayjs';
import { useState } from 'react';

export function CustomersTab() {
  const [state, actions] = useCustomersPresenter();
  const { viewModel, loading, searchQuery, isAddModalOpen } = state;
  
  // Filter and pagination state
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [customerToDelete, setCustomerToDelete] = useState<{ id: string; name: string } | null>(null);
  const itemsPerPage = 10;

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('th-TH', {
      day: 'numeric',
      month: 'short',
    }).format(dayjs(dateString).toDate());
  };

  if (loading && !viewModel) {
    return <CustomersTabSkeleton />;
  }

  // Error state
  if (state.error && !viewModel) {
    return (
      <div className="text-center py-16">
        <div className="text-6xl mb-4">⚠️</div>
        <p className="text-error mb-4">{state.error}</p>
        <AnimatedButton onClick={actions.loadData}>
          🔄 ลองใหม่อีกครั้ง
        </AnimatedButton>
      </div>
    );
  }

  const allCustomers = viewModel?.customers || [];
  const stats = viewModel?.stats;

  // Calculate today date for "new today" filter
  const today = dayjs().startOf('day');

  // Filter customers based on active filter
  const getFilteredCustomers = () => {
    let filtered = allCustomers;
    
    // Apply search first
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(c => 
        c.name.toLowerCase().includes(query) || 
        c.phone.includes(query)
      );
    }
    
    // Apply filter
    switch (activeFilter) {
      case 'vip':
        return filtered.filter(c => c.isVip);
      case 'new':
        return filtered.filter(c => {
          return dayjs(c.createdAt).startOf('day').isSame(today);
        });
      case 'regular':
        return filtered.filter(c => c.visitCount >= CUSTOMER_CONFIG.REGULAR_CUSTOMER_MIN_VISITS);
      default:
        return filtered;
    }
  };

  const filteredCustomers = getFilteredCustomers();
  
  // Pagination
  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedCustomers = filteredCustomers.slice(startIndex, startIndex + itemsPerPage);

  // Reset page when filter/search changes
  const handleFilterChange = (filter: string) => {
    setActiveFilter(filter);
    setCurrentPage(1);
  };

  const handleSearch = (query: string) => {
    actions.searchCustomers(query);
    setCurrentPage(1);
  };

  // Count by filter for badges
  const filterCounts = {
    all: allCustomers.length,
    vip: allCustomers.filter(c => c.isVip).length,
    new: allCustomers.filter(c => {
      return dayjs(c.createdAt).startOf('day').isSame(today);
    }).length,
    regular: allCustomers.filter(c => c.visitCount >= CUSTOMER_CONFIG.REGULAR_CUSTOMER_MIN_VISITS).length,
  };

  const filterButtons = [
    { key: 'all', label: 'ทั้งหมด', icon: '👥', color: 'from-gray-500 to-gray-600' },
    { key: 'vip', label: 'VIP', icon: '⭐', color: 'from-amber-500 to-orange-600' },
    { key: 'new', label: 'ใหม่วันนี้', icon: '🆕', color: 'from-emerald-500 to-green-600' },
    { key: 'regular', label: 'ลูกค้าประจำ', icon: '🔄', color: 'from-purple-500 to-pink-600' },
  ];

  return (
    <div className="space-y-6">
      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <CustomerStatsCard icon="👥" label="ลูกค้าทั้งหมด" value={stats.totalCustomers} color="from-blue-500 to-cyan-500" />
          <CustomerStatsCard icon="⭐" label="VIP" value={stats.vipCustomers} color="from-amber-500 to-orange-500" />
          <CustomerStatsCard icon="🆕" label="ใหม่วันนี้" value={stats.newCustomersToday} color="from-emerald-500 to-green-500" />
          <CustomerStatsCard icon="🔄" label="ลูกค้าประจำ" value={stats.returningCustomers} color="from-purple-500 to-pink-500" />
        </div>
      )}

      {/* Filter Buttons */}
      <div className="flex flex-wrap gap-2">
        {filterButtons.map((btn) => (
          <button
            key={btn.key}
            onClick={() => handleFilterChange(btn.key)}
            className={`relative flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              activeFilter === btn.key
                ? `bg-gradient-to-r ${btn.color} text-white shadow-lg`
                : 'bg-surface border border-border text-muted hover:text-foreground hover:border-amber-500/50'
            }`}
          >
            <span>{btn.icon}</span>
            <span>{btn.label}</span>
            <span className={`px-2 py-0.5 rounded-full text-xs ${
              activeFilter === btn.key 
                ? 'bg-white/20' 
                : 'bg-muted-light'
            }`}>
              {filterCounts[btn.key as keyof typeof filterCounts]}
            </span>
          </button>
        ))}
      </div>

      {/* Search & Add */}
      <div className="flex gap-3">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="🔍 ค้นหาชื่อหรือเบอร์โทร..."
          className="flex-1 px-4 py-3 bg-surface border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-foreground placeholder-muted"
        />
        <GlowButton color="orange" onClick={actions.openAddModal}>
          ➕ เพิ่ม
        </GlowButton>
      </div>

      {/* Results info */}
      <div className="flex justify-between items-center text-sm text-muted">
        <span>
          แสดง {paginatedCustomers.length} จาก {filteredCustomers.length} รายการ
          {activeFilter !== 'all' && ` (กรอง: ${filterButtons.find(b => b.key === activeFilter)?.label})`}
        </span>
        {totalPages > 1 && (
          <span>หน้า {currentPage} / {totalPages}</span>
        )}
      </div>

      {/* Customer List */}
      {paginatedCustomers.length === 0 ? (
        <AnimatedCard className="p-8 text-center">
          <div className="text-4xl mb-4">👥</div>
          <p className="text-muted">
            {searchQuery 
              ? `ไม่พบลูกค้าที่ตรงกับ "${searchQuery}"` 
              : activeFilter !== 'all'
                ? `ไม่มีลูกค้าในหมวด "${filterButtons.find(b => b.key === activeFilter)?.label}"`
                : 'ยังไม่มีลูกค้า'}
          </p>
        </AnimatedCard>
      ) : (
        <div className="space-y-3">
          {paginatedCustomers.map((customer) => (
            <AnimatedCard key={customer.id} className="p-4">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl ${
                    customer.isVip 
                      ? 'bg-gradient-to-br from-amber-400 to-orange-500' 
                      : 'bg-gradient-to-br from-gray-400 to-gray-600'
                  }`}>
                    {customer.isVip ? '⭐' : '👤'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-foreground">{customer.name}</span>
                      {customer.isVip && (
                        <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 text-xs font-bold rounded-full">VIP</span>
                      )}
                      {customer.visitCount >= CUSTOMER_CONFIG.REGULAR_CUSTOMER_MIN_VISITS && !customer.isVip && (
                        <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 text-xs font-bold rounded-full">ประจำ</span>
                      )}
                    </div>
                    <span className="text-sm text-muted">{customer.phone}</span>
                    <div className="flex gap-3 text-xs text-muted mt-1">
                      <span>🎮 {customer.visitCount} ครั้ง</span>
                      <span>⏱️ {customer.totalPlayTime} นาที</span>
                      {customer.lastVisit && <span>📅 {formatDate(customer.lastVisit)}</span>}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <AnimatedButton 
                    variant="secondary" 
                    size="sm" 
                    onClick={() => actions.openDetailModal(customer)}
                  >
                    ✏️ แก้ไข
                  </AnimatedButton>
                  <AnimatedButton 
                    variant={customer.isVip ? 'secondary' : 'primary'} 
                    size="sm" 
                    onClick={() => actions.toggleVipStatus(customer)}
                  >
                    {customer.isVip ? '⭐ ยกเลิก' : '⭐ VIP'}
                  </AnimatedButton>
                  <AnimatedButton variant="danger" size="sm" onClick={() => setCustomerToDelete({ id: customer.id, name: customer.name })}>
                    🗑️
                  </AnimatedButton>
                </div>
              </div>
            </AnimatedCard>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 pt-4">
          <button
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 bg-surface border border-border rounded-lg text-foreground hover:bg-muted-light disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ← ก่อนหน้า
          </button>
          
          <div className="flex gap-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum: number;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }
              
              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`w-10 h-10 rounded-lg text-sm font-medium transition-all ${
                    currentPage === pageNum
                      ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg'
                      : 'bg-surface border border-border text-muted hover:text-foreground hover:border-amber-500/50'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
            {totalPages > 5 && currentPage < totalPages - 2 && (
              <>
                <span className="px-2 text-muted">...</span>
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  className="w-10 h-10 rounded-lg text-sm font-medium bg-surface border border-border text-muted hover:text-foreground"
                >
                  {totalPages}
                </button>
              </>
            )}
          </div>
          
          <button
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 bg-surface border border-border rounded-lg text-foreground hover:bg-muted-light disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ถัดไป →
          </button>
        </div>
      )}

      {/* Edit Modal */}
      {state.isDetailModalOpen && state.selectedCustomer && (
        <Portal>
          <EditCustomerModal 
            customer={state.selectedCustomer}
            onClose={actions.closeDetailModal}
            onSave={async (data) => {
              await actions.updateCustomer(state.selectedCustomer!.id, data);
              actions.closeDetailModal();
            }}
          />
        </Portal>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={!!customerToDelete}
        title="ลบข้อมูลลูกค้า?"
        description={`คุณแน่ใจหรือไม่ว่าต้องการลบข้อมูลของ "${customerToDelete?.name}"? การกระทำนี้ไม่สามารถย้อนกลับได้`}
        confirmText="🗑️ ลบข้อมูล"
        cancelText="ยกเลิก"
        variant="danger"
        onConfirm={async () => {
          if (customerToDelete) {
            await actions.deleteCustomer(customerToDelete.id);
            setCustomerToDelete(null);
          }
        }}
        onClose={() => setCustomerToDelete(null)}
        isLoading={state.loading}
      />

      {/* Add Modal */}
      {isAddModalOpen && (
        <Portal>
          <EditCustomerModal
            onClose={actions.closeAddModal}
            onSave={async (data) => {
              await actions.createCustomer(data as Omit<Customer, 'id' | 'visitCount' | 'totalPlayTime' | 'createdAt' | 'updatedAt'>);
              actions.closeAddModal();
            }}
          />
        </Portal>
      )}
    </div>
  );
}

// Sub-components
function CustomerStatsCard({ icon, label, value, color }: { icon: string; label: string; value: number; color: string }) {
  return (
    <div
      className={`relative overflow-hidden rounded-xl p-4 bg-gradient-to-br ${color} shadow-lg cursor-default transition-transform duration-200 hover:scale-105`}
    >
      <div className="absolute inset-0 bg-black/20" />
      <div className="relative z-10 text-white">
        <div className="text-2xl mb-1">{icon}</div>
        <div className="text-3xl font-bold">{value}</div>
        <div className="text-sm opacity-80">{label}</div>
      </div>
    </div>
  );
}

interface EditCustomerModalProps {
  customer?: Customer;
  onClose: () => void;
  onSave: (data: UpdateCustomerData) => Promise<void>;
}

function EditCustomerModal({ customer, onClose, onSave }: EditCustomerModalProps) {
  const [formData, setFormData] = useState({
    name: customer?.name || '',
    phone: customer?.phone || '',
    isVip: customer?.isVip || false,
    notes: customer?.notes || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave(formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-backdrop-in" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-surface border border-border rounded-2xl shadow-2xl overflow-hidden animate-modal-in">
        <div className="p-4 bg-gradient-to-r from-amber-500/20 to-orange-500/20 border-b border-border flex justify-between items-center">
          <h3 className="font-bold text-lg text-foreground">
            {customer ? '✏️ แก้ไขลูกค้า' : '➕ เพิ่มลูกค้าใหม่'}
          </h3>
          <button onClick={onClose} className="text-muted hover:text-foreground" type="button">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm text-muted mb-1">ชื่อ-นามสกุล</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-amber-500 text-foreground"
              placeholder="เช่น นายใจดี มีความสุข"
            />
          </div>

          <div>
            <label className="block text-sm text-muted mb-1">เบอร์โทรศัพท์</label>
            <input
              type="tel"
              required
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-amber-500 text-foreground"
              placeholder="เช่น 0812345678"
            />
          </div>

          <div>
             <label className="block text-sm text-muted mb-1">หมายเหตุ</label>
             <textarea
               value={formData.notes}
               onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
               className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-amber-500 text-foreground resize-none"
               rows={3}
               placeholder="ระบุข้อมูลเพิ่มเติม..."
             />
          </div>

          <div className="flex items-center justify-between p-3 bg-background rounded-xl border border-border">
            <div>
              <p className="font-medium text-foreground">สถานะ VIP</p>
              <p className="text-xs text-muted">VIP จะได้รับสิทธิพิเศษและส่วนลด</p>
            </div>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, isVip: !formData.isVip })}
              className={`relative w-14 h-8 rounded-full transition-colors ${
                formData.isVip ? 'bg-amber-500' : 'bg-gray-500'
              }`}
            >
              <span className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow transition-transform ${
                formData.isVip ? 'left-7' : 'left-1'
              }`} />
            </button>
          </div>

          <div className="flex gap-3 pt-2">
            <AnimatedButton variant="ghost" onClick={onClose} className="flex-1">
              ยกเลิก
            </AnimatedButton>
            <AnimatedButton variant="primary" type="submit" className="flex-1">
              💾 บันทึกข้อมูล
            </AnimatedButton>
          </div>
        </form>
      </div>
    </div>
  );
}
