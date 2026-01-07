'use client';

import type { Customer, CustomerStats } from '@/src/application/repositories/ICustomerRepository';
import { MockCustomerRepository } from '@/src/infrastructure/repositories/mock/MockCustomerRepository';
import { AnimatedButton } from '@/src/presentation/components/ui/AnimatedButton';
import { AnimatedCard } from '@/src/presentation/components/ui/AnimatedCard';
import { GlowButton } from '@/src/presentation/components/ui/GlowButton';
import { animated, config, useSpring } from '@react-spring/web';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';

const customerRepository = new MockCustomerRepository();

export function CustomersView() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [stats, setStats] = useState<CustomerStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [customersData, statsData] = await Promise.all([
        customerRepository.getAll(),
        customerRepository.getStats(),
      ]);
      setCustomers(customersData);
      setStats(statsData);
    } catch (err) {
      console.error('Error loading customers:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      const results = await customerRepository.search(query);
      setCustomers(results);
    } else {
      const all = await customerRepository.getAll();
      setCustomers(all);
    }
  };

  const handleToggleVip = async (customer: Customer) => {
    await customerRepository.update(customer.id, { isVip: !customer.isVip });
    await loadData();
  };

  const handleDelete = async (id: string) => {
    if (confirm('ต้องการลบลูกค้านี้?')) {
      await customerRepository.delete(id);
      await loadData();
    }
  };

  const pageSpring = useSpring({
    from: { opacity: 0, transform: 'translateY(20px)' },
    to: { opacity: 1, transform: 'translateY(0px)' },
    config: config.gentle,
  });

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('th-TH', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(new Date(dateString));
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-400/30 border-t-purple-400 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  return (
    <animated.div style={pageSpring} className="h-full overflow-auto scrollbar-thin">
      {/* Header */}
      <section className="px-4 md:px-8 py-6 bg-gradient-to-br from-amber-500/10 via-background to-orange-500/10 border-b border-border">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <Link href="/backend" className="text-muted hover:text-amber-400 transition-colors">
              ← กลับหน้าแอดมิน
            </Link>
          </div>

          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-3xl shadow-lg">
                👥
              </div>
              <div>
                <h1 className="text-3xl font-bold">
                  <span className="bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
                    จัดการลูกค้า
                  </span>
                </h1>
                <p className="text-muted">ดูประวัติและจัดการข้อมูลลูกค้า</p>
              </div>
            </div>

            <GlowButton color="orange" onClick={() => setIsAddModalOpen(true)}>
              ➕ เพิ่มลูกค้า
            </GlowButton>
          </div>
        </div>
      </section>

      {/* Stats */}
      {stats && (
        <section className="px-4 md:px-8 py-6">
          <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatsCard icon="👥" label="ลูกค้าทั้งหมด" value={stats.totalCustomers} color="from-blue-500 to-cyan-500" />
            <StatsCard icon="⭐" label="VIP" value={stats.vipCustomers} color="from-amber-500 to-orange-500" />
            <StatsCard icon="🆕" label="ใหม่วันนี้" value={stats.newCustomersToday} color="from-emerald-500 to-green-500" />
            <StatsCard icon="🔄" label="ลูกค้าประจำ" value={stats.returningCustomers} color="from-purple-500 to-pink-500" />
          </div>
        </section>
      )}

      {/* Search */}
      <section className="px-4 md:px-8 py-4">
        <div className="max-w-7xl mx-auto">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="🔍 ค้นหาชื่อหรือเบอร์โทร..."
              className="w-full px-6 py-4 bg-surface border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-foreground placeholder-muted text-lg"
            />
          </div>
        </div>
      </section>

      {/* Customer List */}
      <section className="px-4 md:px-8 py-4 pb-8">
        <div className="max-w-7xl mx-auto">
          {customers.length === 0 ? (
            <AnimatedCard className="p-12 text-center">
              <div className="text-6xl mb-4">👥</div>
              <p className="text-muted text-lg">ไม่พบลูกค้า</p>
            </AnimatedCard>
          ) : (
            <div className="grid gap-4">
              {customers.map((customer) => (
                <CustomerCard
                  key={customer.id}
                  customer={customer}
                  onView={() => {
                    setSelectedCustomer(customer);
                    setIsModalOpen(true);
                  }}
                  onToggleVip={() => handleToggleVip(customer)}
                  onDelete={() => handleDelete(customer.id)}
                  formatDate={formatDate}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Customer Detail Modal */}
      {isModalOpen && selectedCustomer && (
        <CustomerDetailModal
          customer={selectedCustomer}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedCustomer(null);
          }}
          formatDate={formatDate}
        />
      )}

      {/* Add Customer Modal */}
      {isAddModalOpen && (
        <AddCustomerModal
          onClose={() => setIsAddModalOpen(false)}
          onSave={async (data) => {
            await customerRepository.create(data);
            await loadData();
            setIsAddModalOpen(false);
          }}
        />
      )}
    </animated.div>
  );
}

// Stats Card
function StatsCard({ icon, label, value, color }: { icon: string; label: string; value: number; color: string }) {
  return (
    <div className={`relative overflow-hidden rounded-xl p-4 bg-gradient-to-br ${color} shadow-lg`}>
      <div className="absolute inset-0 bg-black/20" />
      <div className="relative z-10 text-white">
        <div className="text-2xl mb-1">{icon}</div>
        <div className="text-3xl font-bold">{value}</div>
        <div className="text-sm opacity-80">{label}</div>
      </div>
    </div>
  );
}

// Customer Card
interface CustomerCardProps {
  customer: Customer;
  onView: () => void;
  onToggleVip: () => void;
  onDelete: () => void;
  formatDate: (date: string) => string;
}

function CustomerCard({ customer, onView, onToggleVip, onDelete, formatDate }: CustomerCardProps) {
  return (
    <AnimatedCard className="p-4 md:p-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          {/* Avatar */}
          <div className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl ${
            customer.isVip 
              ? 'bg-gradient-to-br from-amber-400 to-orange-500' 
              : 'bg-gradient-to-br from-gray-400 to-gray-600'
          }`}>
            {customer.isVip ? '⭐' : '👤'}
          </div>

          {/* Info */}
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-lg text-foreground">{customer.name}</h3>
              {customer.isVip && (
                <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 text-xs font-bold rounded-full">
                  VIP
                </span>
              )}
            </div>
            <p className="text-muted">{customer.phone}</p>
            <div className="flex gap-4 mt-1 text-sm text-muted">
              <span>🎮 {customer.visitCount} ครั้ง</span>
              <span>⏱️ {customer.totalPlayTime} นาที</span>
              {customer.lastVisit && (
                <span>📅 {formatDate(customer.lastVisit)}</span>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <AnimatedButton variant="ghost" size="sm" onClick={onView}>
            👁️ ดู
          </AnimatedButton>
          <AnimatedButton 
            variant={customer.isVip ? 'secondary' : 'primary'} 
            size="sm" 
            onClick={onToggleVip}
          >
            {customer.isVip ? '⭐ ยกเลิก VIP' : '⭐ ตั้งเป็น VIP'}
          </AnimatedButton>
          <AnimatedButton variant="danger" size="sm" onClick={onDelete}>
            🗑️
          </AnimatedButton>
        </div>
      </div>
    </AnimatedCard>
  );
}

// Customer Detail Modal
interface CustomerDetailModalProps {
  customer: Customer;
  onClose: () => void;
  formatDate: (date: string) => string;
}

function CustomerDetailModal({ customer, onClose, formatDate }: CustomerDetailModalProps) {
  const modalSpring = useSpring({
    from: { opacity: 0, transform: 'scale(0.9)' },
    to: { opacity: 1, transform: 'scale(1)' },
    config: config.gentle,
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <animated.div
        style={modalSpring}
        className="relative w-full max-w-lg bg-surface border border-border rounded-2xl shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-amber-500/20 to-orange-500/20 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center text-3xl ${
                customer.isVip 
                  ? 'bg-gradient-to-br from-amber-400 to-orange-500' 
                  : 'bg-gradient-to-br from-gray-400 to-gray-600'
              }`}>
                {customer.isVip ? '⭐' : '👤'}
              </div>
              <div>
                <h3 className="font-bold text-xl text-foreground">{customer.name}</h3>
                <p className="text-muted">{customer.phone}</p>
              </div>
            </div>
            <button onClick={onClose} className="text-muted hover:text-foreground text-xl">✕</button>
          </div>
        </div>

        {/* Stats */}
        <div className="p-6 grid grid-cols-2 gap-4">
          <div className="bg-background rounded-xl p-4 text-center">
            <div className="text-3xl font-bold text-cyan-400">{customer.visitCount}</div>
            <div className="text-sm text-muted">ครั้งที่มาเล่น</div>
          </div>
          <div className="bg-background rounded-xl p-4 text-center">
            <div className="text-3xl font-bold text-purple-400">{customer.totalPlayTime}</div>
            <div className="text-sm text-muted">นาทีรวม</div>
          </div>
        </div>

        {/* Details */}
        <div className="px-6 pb-6 space-y-3">
          {customer.email && (
            <div className="flex justify-between py-2 border-b border-border">
              <span className="text-muted">อีเมล</span>
              <span className="text-foreground">{customer.email}</span>
            </div>
          )}
          <div className="flex justify-between py-2 border-b border-border">
            <span className="text-muted">สมาชิกตั้งแต่</span>
            <span className="text-foreground">{formatDate(customer.createdAt)}</span>
          </div>
          {customer.lastVisit && (
            <div className="flex justify-between py-2 border-b border-border">
              <span className="text-muted">มาเล่นล่าสุด</span>
              <span className="text-foreground">{formatDate(customer.lastVisit)}</span>
            </div>
          )}
          {customer.notes && (
            <div className="py-2">
              <span className="text-muted block mb-1">หมายเหตุ</span>
              <span className="text-foreground">{customer.notes}</span>
            </div>
          )}
        </div>

        <div className="p-6 pt-0">
          <AnimatedButton variant="ghost" onClick={onClose} className="w-full">
            ปิด
          </AnimatedButton>
        </div>
      </animated.div>
    </div>
  );
}

// Add Customer Modal
interface AddCustomerModalProps {
  onClose: () => void;
  onSave: (data: { name: string; phone: string; email?: string; notes?: string }) => Promise<void>;
}

function AddCustomerModal({ onClose, onSave }: AddCustomerModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    notes: '',
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.phone.trim()) return;

    setSaving(true);
    try {
      await onSave({
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim() || undefined,
        notes: formData.notes.trim() || undefined,
      });
    } finally {
      setSaving(false);
    }
  };

  const modalSpring = useSpring({
    from: { opacity: 0, transform: 'scale(0.9)' },
    to: { opacity: 1, transform: 'scale(1)' },
    config: config.gentle,
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <animated.div
        style={modalSpring}
        className="relative w-full max-w-md bg-surface border border-border rounded-2xl shadow-2xl overflow-hidden"
      >
        <div className="p-6 bg-gradient-to-r from-amber-500/20 to-orange-500/20 border-b border-border">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-xl text-foreground">➕ เพิ่มลูกค้าใหม่</h3>
            <button onClick={onClose} className="text-muted hover:text-foreground text-xl">✕</button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">ชื่อ-นามสกุล *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-foreground"
              placeholder="กรอกชื่อ-นามสกุล"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">เบอร์โทร *</label>
            <input
              type="tel"
              required
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-foreground"
              placeholder="08X-XXX-XXXX"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">อีเมล</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-foreground"
              placeholder="email@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">หมายเหตุ</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={2}
              className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-foreground resize-none"
              placeholder="เช่น ลูกค้าจากการแนะนำ"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <AnimatedButton variant="ghost" onClick={onClose} className="flex-1" disabled={saving}>
              ยกเลิก
            </AnimatedButton>
            <AnimatedButton variant="primary" type="submit" disabled={saving} className="flex-1">
              {saving ? '⏳ กำลังบันทึก...' : '💾 บันทึก'}
            </AnimatedButton>
          </div>
        </form>
      </animated.div>
    </div>
  );
}
