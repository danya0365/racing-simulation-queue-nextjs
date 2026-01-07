'use client';

import type { Machine } from '@/src/application/repositories/IMachineRepository';
import { AnimatedButton } from '@/src/presentation/components/ui/AnimatedButton';
import { AnimatedCard } from '@/src/presentation/components/ui/AnimatedCard';
import { GlowButton } from '@/src/presentation/components/ui/GlowButton';
import type { MachineQueueInfo } from '@/src/presentation/presenters/customer/CustomerPresenter';
import { createClientCustomerPresenter } from '@/src/presentation/presenters/customer/CustomerPresenterClientFactory';
import { animated } from '@react-spring/web';
import Link from 'next/link';
import { useEffect, useState } from 'react';

// Step definitions
type BookingStep = 'phone' | 'machine' | 'duration' | 'confirm';

interface BookingData {
  customerPhone: string;
  customerName: string;
  machineId: string;
  machineName: string;
  duration: number;
  isExistingCustomer: boolean;
  estimatedWait: number;
  queuePosition: number;
}

export function BookingWizard() {
  const [currentStep, setCurrentStep] = useState<BookingStep>('phone');
  const [bookingData, setBookingData] = useState<BookingData>({
    customerPhone: '',
    customerName: '',
    machineId: '',
    machineName: '',
    duration: 30,
    isExistingCustomer: false,
    estimatedWait: 0,
    queuePosition: 1,
  });
  const [machines, setMachines] = useState<Machine[]>([]);
  const [machineQueueInfo, setMachineQueueInfo] = useState<Record<string, MachineQueueInfo>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<{ queueId: string; position: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const presenter = createClientCustomerPresenter();

  // Load machines - ALL machines, not just available
  useEffect(() => {
    const loadMachines = async () => {
      try {
        const viewModel = await presenter.getViewModel();
        // FIXED: Use ALL machines, not just available
        setMachines(viewModel.machines.filter(m => m.isActive && m.status !== 'maintenance'));
        setMachineQueueInfo(viewModel.machineQueueInfo);
      } catch (err) {
        console.error('Error loading machines:', err);
      } finally {
        setLoading(false);
      }
    };
    loadMachines();
  }, [presenter]);

  // Progress calculation
  const steps: BookingStep[] = ['phone', 'machine', 'duration', 'confirm'];
  const currentStepIndex = steps.indexOf(currentStep);
  const progress = ((currentStepIndex + 1) / steps.length) * 100;

  const goNext = () => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < steps.length) {
      setCurrentStep(steps[nextIndex]);
    }
  };

  const goBack = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(steps[prevIndex]);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);

    try {
      const bookingTime = new Date();
      bookingTime.setMinutes(bookingTime.getMinutes() + 5);

      const result = await presenter.createBooking({
        machineId: bookingData.machineId,
        customerName: bookingData.customerName,
        customerPhone: bookingData.customerPhone,
        bookingTime: bookingTime.toISOString(),
        duration: bookingData.duration,
      });

      setSuccess({
        queueId: result.id,
        position: result.position,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาด');
    } finally {
      setSubmitting(false);
    }
  };

  // Success Screen
  if (success) {
    return (
      <div className="min-h-full flex items-center justify-center p-4 bg-racing-gradient">
        <animated.div className="w-full max-w-md">
          <AnimatedCard className="p-8 text-center">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-emerald-400 to-green-600 flex items-center justify-center text-5xl shadow-lg shadow-emerald-500/30 animate-float">
              ✅
            </div>
            <h2 className="text-3xl font-bold text-foreground mb-2">จองสำเร็จ!</h2>
            <p className="text-muted mb-6">คุณ {bookingData.customerName}</p>

            <div className="bg-background rounded-2xl p-6 mb-6">
              <div className="text-6xl font-bold bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent mb-2">
                #{success.position}
              </div>
              <p className="text-muted">หมายเลขคิวของคุณ</p>
            </div>

            <div className="space-y-3 text-left bg-surface rounded-xl p-4 mb-6">
              <div className="flex justify-between">
                <span className="text-muted">เครื่อง</span>
                <span className="font-medium text-foreground">{bookingData.machineName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">ระยะเวลา</span>
                <span className="font-medium text-foreground">{bookingData.duration} นาที</span>
              </div>
            </div>

            <div className="space-y-3">
              <Link href={`/customer/queue/${success.queueId}`} className="block">
                <GlowButton color="cyan" className="w-full" size="lg">
                  📋 ดูสถานะคิว
                </GlowButton>
              </Link>
              <Link href="/customer" className="block">
                <AnimatedButton variant="ghost" className="w-full">
                  จองคิวเพิ่ม
                </AnimatedButton>
              </Link>
            </div>
          </AnimatedCard>
        </animated.div>
      </div>
    );
  }

  return (
    <div className="min-h-full flex flex-col bg-racing-gradient">
      {/* Header */}
      <header className="px-4 py-4 bg-surface/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-4">
            <Link href="/" className="text-muted hover:text-cyan-400 transition-colors">
              ← กลับ
            </Link>
            <span className="text-sm text-muted">ขั้นตอน {currentStepIndex + 1}/{steps.length}</span>
          </div>
          
          {/* Progress Bar */}
          <div className="h-2 bg-background rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 flex items-center justify-center p-4">
        <animated.div className="w-full max-w-lg">
          {currentStep === 'phone' && (
            <PhoneStep
              value={bookingData.customerPhone}
              name={bookingData.customerName}
              onChange={(phone, name, isExisting) => 
                setBookingData({ ...bookingData, customerPhone: phone, customerName: name, isExistingCustomer: isExisting })
              }
              onNext={goNext}
            />
          )}

          {currentStep === 'machine' && (
            <MachineStep
              machines={machines}
              machineQueueInfo={machineQueueInfo}
              loading={loading}
              selectedId={bookingData.machineId}
              onSelect={(id, name, waitTime, position) => setBookingData({ 
                ...bookingData, 
                machineId: id, 
                machineName: name,
                estimatedWait: waitTime,
                queuePosition: position 
              })}
              onNext={goNext}
              onBack={goBack}
            />
          )}

          {currentStep === 'duration' && (
            <DurationStep
              value={bookingData.duration}
              onChange={(duration) => setBookingData({ ...bookingData, duration })}
              onNext={goNext}
              onBack={goBack}
            />
          )}

          {currentStep === 'confirm' && (
            <ConfirmStep
              data={bookingData}
              submitting={submitting}
              error={error}
              onSubmit={handleSubmit}
              onBack={goBack}
            />
          )}
        </animated.div>
      </main>
    </div>
  );
}

// Step 1: Phone Number
interface PhoneStepProps {
  value: string;
  name: string;
  onChange: (phone: string, name: string, isExisting: boolean) => void;
  onNext: () => void;
}

function PhoneStep({ value, name, onChange, onNext }: PhoneStepProps) {
  const [phone, setPhone] = useState(value);
  const [customerName, setCustomerName] = useState(name);
  const [checking, setChecking] = useState(false);

  const formatPhone = (input: string) => {
    const digits = input.replace(/\D/g, '').slice(0, 10);
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value);
    setPhone(formatted);
  };

  const handleSubmit = () => {
    if (phone.replace(/\D/g, '').length >= 9 && customerName.trim()) {
      onChange(phone, customerName.trim(), false);
      onNext();
    }
  };

  const isValid = phone.replace(/\D/g, '').length >= 9 && customerName.trim().length > 0;

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-4xl">
          📱
        </div>
        <h2 className="text-2xl font-bold text-foreground">ข้อมูลลูกค้า</h2>
        <p className="text-muted mt-2">กรอกข้อมูลเพื่อจองคิว</p>
      </div>

      <AnimatedCard className="p-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              เบอร์โทรศัพท์
            </label>
            <input
              type="tel"
              value={phone}
              onChange={handlePhoneChange}
              placeholder="08X-XXX-XXXX"
              className="w-full px-6 py-4 text-2xl text-center bg-background border-2 border-border rounded-2xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 text-foreground placeholder-muted"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              ชื่อ-นามสกุล
            </label>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="กรอกชื่อ-นามสกุล"
              className="w-full px-6 py-4 text-xl text-center bg-background border-2 border-border rounded-2xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 text-foreground placeholder-muted"
            />
          </div>
        </div>
      </AnimatedCard>

      <GlowButton
        color="cyan"
        size="lg"
        onClick={handleSubmit}
        disabled={!isValid}
        className="w-full"
      >
        ถัดไป →
      </GlowButton>
    </div>
  );
}

// Step 2: Machine Selection
interface MachineStepProps {
  machines: Machine[];
  machineQueueInfo: Record<string, MachineQueueInfo>;
  loading: boolean;
  selectedId: string;
  onSelect: (id: string, name: string, waitTime: number, position: number) => void;
  onNext: () => void;
  onBack: () => void;
}

function MachineStep({ machines, machineQueueInfo, loading, selectedId, onSelect, onNext, onBack }: MachineStepProps) {
  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 border-4 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-muted">กำลังโหลดข้อมูล...</p>
      </div>
    );
  }

  const getMachineStatus = (machine: Machine) => {
    const queueInfo = machineQueueInfo[machine.id];
    const totalInQueue = queueInfo ? queueInfo.waitingCount + queueInfo.playingCount : 0;
    const waitMinutes = queueInfo?.estimatedWaitMinutes || 0;

    if (totalInQueue === 0 && machine.status === 'available') {
      return { 
        label: '✅ พร้อมเล่นทันที!', 
        color: 'text-emerald-400',
        sublabel: null 
      };
    } else if (machine.status === 'occupied' || queueInfo?.playingCount > 0) {
      return { 
        label: '🏁 กำลังใช้งาน', 
        color: 'text-orange-400',
        sublabel: queueInfo.waitingCount > 0 
          ? `รอ ${queueInfo.waitingCount} คน (~${waitMinutes} นาที)`
          : `รอ ~${waitMinutes} นาที`
      };
    } else if (queueInfo?.waitingCount > 0) {
      return { 
        label: `⏳ รอ ${queueInfo.waitingCount} คน`, 
        color: 'text-amber-400',
        sublabel: `~${waitMinutes} นาที`
      };
    }
    
    return { 
      label: '✅ พร้อมเล่น', 
      color: 'text-emerald-400',
      sublabel: null 
    };
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-4xl">
          🎮
        </div>
        <h2 className="text-2xl font-bold text-foreground">เลือกเครื่อง</h2>
        <p className="text-muted mt-2">เลือกเครื่องที่ต้องการจองคิว</p>
      </div>

      {machines.length === 0 ? (
        <AnimatedCard className="p-8 text-center">
          <div className="text-4xl mb-4">🔧</div>
          <p className="text-muted">ไม่มีเครื่องพร้อมใช้งานขณะนี้</p>
        </AnimatedCard>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {machines.map((machine) => {
            const status = getMachineStatus(machine);
            const queueInfo = machineQueueInfo[machine.id];
            
            return (
              <button
                key={machine.id}
                onClick={() => onSelect(
                  machine.id, 
                  machine.name, 
                  queueInfo?.estimatedWaitMinutes || 0,
                  queueInfo?.nextPosition || 1
                )}
                className={`p-5 rounded-2xl border-2 transition-all text-left ${
                  selectedId === machine.id
                    ? 'border-cyan-500 bg-cyan-500/20 shadow-lg shadow-cyan-500/20'
                    : 'border-border bg-surface hover:border-cyan-500/50'
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="text-3xl">🏎️</div>
                  <div>
                    <div className="font-bold text-foreground text-lg">{machine.name}</div>
                    <div className={`text-sm font-medium ${status.color}`}>{status.label}</div>
                  </div>
                </div>
                {status.sublabel && (
                  <div className="text-xs text-muted bg-background/50 px-3 py-1.5 rounded-lg mt-2">
                    {status.sublabel}
                  </div>
                )}
                {queueInfo && queueInfo.nextPosition > 1 && (
                  <div className="text-xs text-purple-400 mt-2">
                    📋 คิวของคุณจะเป็นลำดับที่ #{queueInfo.nextPosition}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}

      <div className="flex gap-3">
        <AnimatedButton variant="ghost" onClick={onBack} className="flex-1">
          ← ย้อนกลับ
        </AnimatedButton>
        <GlowButton
          color="cyan"
          size="lg"
          onClick={onNext}
          disabled={!selectedId}
          className="flex-1"
        >
          ถัดไป →
        </GlowButton>
      </div>
    </div>
  );
}

// Step 3: Duration Selection
interface DurationStepProps {
  value: number;
  onChange: (duration: number) => void;
  onNext: () => void;
  onBack: () => void;
}

function DurationStep({ value, onChange, onNext, onBack }: DurationStepProps) {
  const durations = [
    { time: 30, label: '30 นาที', price: '฿150', icon: '⏱️' },
    { time: 60, label: '1 ชั่วโมง', price: '฿250', icon: '🕐', popular: true },
    { time: 90, label: '1.5 ชั่วโมง', price: '฿350', icon: '🕑' },
    { time: 120, label: '2 ชั่วโมง', price: '฿400', icon: '🕒' },
  ];

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-4xl">
          ⏰
        </div>
        <h2 className="text-2xl font-bold text-foreground">เลือกระยะเวลา</h2>
        <p className="text-muted mt-2">เลือกเวลาที่ต้องการเล่น</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {durations.map((d) => (
          <button
            key={d.time}
            onClick={() => onChange(d.time)}
            className={`relative p-6 rounded-2xl border-2 transition-all ${
              value === d.time
                ? 'border-cyan-500 bg-cyan-500/20 shadow-lg shadow-cyan-500/20'
                : 'border-border bg-surface hover:border-cyan-500/50'
            }`}
          >
            {d.popular && (
              <span className="absolute -top-2 -right-2 px-2 py-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold rounded-full">
                แนะนำ
              </span>
            )}
            <div className="text-3xl mb-2">{d.icon}</div>
            <div className="font-bold text-lg text-foreground">{d.label}</div>
            <div className="text-cyan-400 font-medium mt-1">{d.price}</div>
          </button>
        ))}
      </div>

      <div className="flex gap-3">
        <AnimatedButton variant="ghost" onClick={onBack} className="flex-1">
          ← ย้อนกลับ
        </AnimatedButton>
        <GlowButton
          color="cyan"
          size="lg"
          onClick={onNext}
          className="flex-1"
        >
          ถัดไป →
        </GlowButton>
      </div>
    </div>
  );
}

// Step 4: Confirmation
interface ConfirmStepProps {
  data: BookingData;
  submitting: boolean;
  error: string | null;
  onSubmit: () => void;
  onBack: () => void;
}

function ConfirmStep({ data, submitting, error, onSubmit, onBack }: ConfirmStepProps) {
  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center text-4xl">
          📝
        </div>
        <h2 className="text-2xl font-bold text-foreground">ยืนยันการจอง</h2>
        <p className="text-muted mt-2">ตรวจสอบข้อมูลและยืนยัน</p>
      </div>

      {error && (
        <div className="p-4 bg-red-500/20 border border-red-500 rounded-xl text-red-400 text-center">
          ⚠️ {error}
        </div>
      )}

      <AnimatedCard className="p-6">
        <div className="space-y-4">
          <div className="flex justify-between items-center py-3 border-b border-border">
            <span className="text-muted">👤 ชื่อ</span>
            <span className="font-bold text-foreground text-lg">{data.customerName}</span>
          </div>
          <div className="flex justify-between items-center py-3 border-b border-border">
            <span className="text-muted">📱 เบอร์โทร</span>
            <span className="font-bold text-foreground text-lg">{data.customerPhone}</span>
          </div>
          <div className="flex justify-between items-center py-3 border-b border-border">
            <span className="text-muted">🎮 เครื่อง</span>
            <span className="font-bold text-foreground text-lg">{data.machineName}</span>
          </div>
          <div className="flex justify-between items-center py-3 border-b border-border">
            <span className="text-muted">⏰ ระยะเวลา</span>
            <span className="font-bold text-cyan-400 text-lg">{data.duration} นาที</span>
          </div>
          <div className="flex justify-between items-center py-3 border-b border-border">
            <span className="text-muted">📋 ตำแหน่งคิว</span>
            <span className="font-bold text-purple-400 text-lg">#{data.queuePosition}</span>
          </div>
          {data.estimatedWait > 0 && (
            <div className="flex justify-between items-center py-3">
              <span className="text-muted">⏳ รอประมาณ</span>
              <span className="font-bold text-amber-400 text-lg">~{data.estimatedWait} นาที</span>
            </div>
          )}
        </div>
      </AnimatedCard>

      <div className="flex gap-3">
        <AnimatedButton variant="ghost" onClick={onBack} className="flex-1" disabled={submitting}>
          ← แก้ไข
        </AnimatedButton>
        <GlowButton
          color="green"
          size="lg"
          onClick={onSubmit}
          disabled={submitting}
          className="flex-1"
        >
          {submitting ? '⏳ กำลังจอง...' : '✅ ยืนยันจอง'}
        </GlowButton>
      </div>
    </div>
  );
}
