/**
 * QA Checklist Store
 * Zustand store for tracking manual testing progress
 * Persisted to localStorage
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface TestCase {
  id: string;
  category: string;
  title: string;
  description: string;
  steps: string[];
  expectedResult: string;
  completed: boolean;
  testedAt?: string;
  notes?: string;
}

export interface QAChecklistState {
  testCases: TestCase[];
  resetAll: () => void;
  toggleTest: (id: string) => void;
  addNote: (id: string, note: string) => void;
  getProgress: () => { completed: number; total: number; percentage: number };
  getCategoryProgress: (category: string) => { completed: number; total: number };
}

// Default test cases for the racing queue system
const defaultTestCases: TestCase[] = [
  // ============================================================
  // WALK-IN QUEUE - CUSTOMER FLOW
  // ============================================================
  {
    id: 'walk-in-1',
    category: 'Walk-In Queue (ลูกค้า)',
    title: 'ลูกค้าเข้าคิว Walk-in',
    description: 'ทดสอบการเข้าคิว walk-in จากหน้าลูกค้า',
    steps: [
      'เปิดหน้า /customer',
      'กรอกชื่อและเบอร์โทร',
      'เลือกจำนวนคน (ถ้ามี)',
      'กดปุ่ม "เข้าคิว"',
    ],
    expectedResult: 'ระบบสร้างคิวใหม่และแสดงหมายเลขคิว',
    completed: false,
  },
  {
    id: 'walk-in-2',
    category: 'Walk-In Queue (ลูกค้า)',
    title: 'ลูกค้าดูสถานะคิว',
    description: 'ทดสอบการดูสถานะคิวของตัวเอง',
    steps: [
      'เปิดหน้า /customer/queue-status',
      'ดูหมายเลขคิวของตัวเอง',
      'ดูจำนวนคิวก่อนหน้า',
      'ดูเวลารอโดยประมาณ',
    ],
    expectedResult: 'แสดงข้อมูลคิวถูกต้อง รีเฟรชอัตโนมัติ',
    completed: false,
  },
  {
    id: 'walk-in-3',
    category: 'Walk-In Queue (ลูกค้า)',
    title: 'ลูกค้ายกเลิกคิว',
    description: 'ทดสอบการยกเลิกคิวที่จองไว้',
    steps: [
      'เปิดหน้า /customer/queue-status',
      'กดปุ่ม "ยกเลิกคิว"',
      'ยืนยันการยกเลิก',
    ],
    expectedResult: 'คิวถูกยกเลิก สถานะเปลี่ยนเป็น cancelled',
    completed: false,
  },
  {
    id: 'walk-in-4',
    category: 'Walk-In Queue (ลูกค้า)',
    title: 'โหมดติดตามคิว (Focus Mode)',
    description: 'ทดสอบโหมดแสดงผลเต็มหน้าจอ',
    steps: [
      'เปิดหน้า /customer/queue-status',
      'กดปุ่ม "โหมดติดตาม"',
      'ดูหน้าจอเต็มหน้าจอ',
      'กดปุ่ม "ออก" เพื่อกลับ',
    ],
    expectedResult: 'แสดงหน้าจอติดตามเต็มจอ อัพเดทอัตโนมัติ',
    completed: false,
  },

  // ============================================================
  // WALK-IN QUEUE - STAFF FLOW
  // ============================================================
  {
    id: 'walk-in-staff-1',
    category: 'Walk-In Queue (พนักงาน)',
    title: 'เรียกลูกค้า (Call)',
    description: 'ทดสอบการเรียกลูกค้าจากคิว',
    steps: [
      'เปิดหน้า /backend/control',
      'ดูรายการคิวที่รอ',
      'กดปุ่ม "เรียก" ที่คิวถัดไป',
    ],
    expectedResult: 'สถานะคิวเปลี่ยนจาก waiting เป็น called',
    completed: false,
  },
  {
    id: 'walk-in-staff-2',
    category: 'Walk-In Queue (พนักงาน)',
    title: 'จัดที่นั่งลูกค้า (Seat)',
    description: 'ทดสอบการจัดที่นั่งให้ลูกค้า',
    steps: [
      'เปิดหน้า /backend/control',
      'เลือกคิวที่สถานะ called',
      'เลือกเครื่องที่ว่าง',
      'กดปุ่ม "จัดที่นั่ง"',
    ],
    expectedResult: 'สถานะคิวเปลี่ยนเป็น seated, สร้าง session ใหม่',
    completed: false,
  },
  {
    id: 'walk-in-staff-3',
    category: 'Walk-In Queue (พนักงาน)',
    title: 'ดู Dashboard คิว',
    description: 'ทดสอบหน้า Dashboard แสดงข้อมูลคิว',
    steps: [
      'เปิดหน้า /backend',
      'ดูจำนวนคิวรอ',
      'ดูจำนวนเครื่องว่าง',
      'ดูสถิติวันนี้',
    ],
    expectedResult: 'แสดงข้อมูลถูกต้อง รีเฟรชอัตโนมัติ',
    completed: false,
  },

  // ============================================================
  // SESSIONS - STAFF FLOW
  // ============================================================
  {
    id: 'session-1',
    category: 'Sessions (พนักงาน)',
    title: 'เริ่ม Session ใหม่',
    description: 'ทดสอบการเริ่ม session จากคิวหรือ manual',
    steps: [
      'เปิดหน้า /backend/control',
      'เลือกเครื่องที่ว่าง',
      'กรอกข้อมูลลูกค้า (ถ้า manual)',
      'กดปุ่ม "เริ่ม"',
    ],
    expectedResult: 'Session ถูกสร้าง เครื่องเปลี่ยนสถานะเป็น occupied',
    completed: false,
  },
  {
    id: 'session-2',
    category: 'Sessions (พนักงาน)',
    title: 'จบการเล่น',
    description: 'ทดสอบการจบการเล่นและคำนวณค่าใช้จ่าย',
    steps: [
      'เปิดหน้า /backend/control',
      'เลือกเครื่องที่มี session',
      'กดปุ่ม "จบการเล่น"',
      'ตรวจสอบค่าใช้จ่าย',
    ],
    expectedResult: 'Session จบ คำนวณเวลาและค่าใช้จ่าย เครื่องว่าง',
    completed: false,
  },
  {
    id: 'session-3',
    category: 'Sessions (พนักงาน)',
    title: 'อัพเดทสถานะชำระเงิน',
    description: 'ทดสอบการบันทึกการชำระเงิน',
    steps: [
      'จบการเล่น',
      'กดปุ่มชำระเงิน',
      'เลือกสถานะ paid',
    ],
    expectedResult: 'สถานะเปลี่ยนเป็น paid',
    completed: false,
  },

  // ============================================================
  // ADVANCE BOOKING - CUSTOMER FLOW
  // ============================================================
  {
    id: 'booking-1',
    category: 'Advance Booking (ลูกค้า)',
    title: 'จองล่วงหน้า',
    description: 'ทดสอบการจองเครื่องล่วงหน้า',
    steps: [
      'เปิดหน้า /time-booking',
      'เลือกเครื่อง',
      'เลือกวันที่และเวลา',
      'กรอกข้อมูลลูกค้า',
      'กดจอง',
    ],
    expectedResult: 'สร้าง booking ใหม่ แสดง QR code',
    completed: false,
  },
  {
    id: 'booking-2',
    category: 'Advance Booking (ลูกค้า)',
    title: 'ดูประวัติการจอง',
    description: 'ทดสอบการดูประวัติการจอง',
    steps: [
      'เปิดหน้า /customer/booking-history',
      'ดูรายการจองทั้งหมด',
      'กดดูรายละเอียด',
    ],
    expectedResult: 'แสดงรายการจองถูกต้อง',
    completed: false,
  },
  {
    id: 'booking-3',
    category: 'Advance Booking (ลูกค้า)',
    title: 'ยกเลิกการจอง',
    description: 'ทดสอบการยกเลิกการจองล่วงหน้า',
    steps: [
      'เปิดหน้า /customer/booking-status',
      'เลือก booking ที่ต้องการยกเลิก',
      'กดปุ่ม "ยกเลิก"',
      'ยืนยันการยกเลิก',
    ],
    expectedResult: 'Booking ถูกยกเลิก',
    completed: false,
  },

  // ============================================================
  // BOOKING - STAFF FLOW
  // ============================================================
  {
    id: 'booking-staff-1',
    category: 'Booking (พนักงาน)',
    title: 'ดูตารางจอง',
    description: 'ทดสอบหน้าแสดงตารางจอง',
    steps: [
      'เปิดหน้า /backend',
      'ดูตารางทุกเครื่อง',
      'เลือกวันที่ต่างๆ',
    ],
    expectedResult: 'แสดงตารางถูกต้องตามวันที่',
    completed: false,
  },
  {
    id: 'booking-staff-2',
    category: 'Booking (พนักงาน)',
    title: 'Check-in ลูกค้าจอง',
    description: 'ทดสอบการ check-in ลูกค้าที่จองมา',
    steps: [
      'เปิดหน้า /backend/control',
      'หา booking ที่ถึงเวลา',
      'กดปุ่ม check-in',
    ],
    expectedResult: 'สร้าง session จาก booking',
    completed: false,
  },

  // ============================================================
  // MACHINES
  // ============================================================
  {
    id: 'machine-1',
    category: 'Machines',
    title: 'ดูรายการเครื่อง',
    description: 'ทดสอบหน้าแสดงเครื่องทั้งหมด',
    steps: [
      'เปิดหน้า /backend',
      'ดูรายการเครื่องทั้งหมด',
      'ดูสถานะแต่ละเครื่อง',
    ],
    expectedResult: 'แสดงเครื่องทั้งหมดพร้อมสถานะ',
    completed: false,
  },
  {
    id: 'machine-2',
    category: 'Machines',
    title: 'เปลี่ยนสถานะเครื่อง',
    description: 'ทดสอบการเปลี่ยนสถานะเครื่อง',
    steps: [
      'เปิดหน้า /backend/control',
      'เลือกเครื่อง',
      'เปลี่ยนสถานะ (เช่น maintenance)',
    ],
    expectedResult: 'สถานะเครื่องเปลี่ยนตามที่เลือก',
    completed: false,
  },

  // ============================================================
  // QR SCAN
  // ============================================================
  {
    id: 'qr-1',
    category: 'QR Scan',
    title: 'สแกน QR เช็คสถานะ',
    description: 'ทดสอบการสแกน QR ดูสถานะ',
    steps: [
      'เปิดหน้า /qr-scan',
      'สแกน QR code ของคิว/booking',
    ],
    expectedResult: 'แสดงข้อมูลคิว/booking ถูกต้อง',
    completed: false,
  },

  // ============================================================
  // EDGE CASES
  // ============================================================
  {
    id: 'edge-1',
    category: 'Edge Cases',
    title: 'รีเฟรชหน้าขณะรอคิว',
    description: 'ทดสอบว่าข้อมูลยังอยู่หลังรีเฟรช',
    steps: [
      'เข้าคิวสำเร็จ',
      'รีเฟรชหน้า (F5)',
      'ตรวจสอบข้อมูลคิว',
    ],
    expectedResult: 'ข้อมูลคิวยังแสดงถูกต้อง',
    completed: false,
  },
  {
    id: 'edge-2',
    category: 'Edge Cases',
    title: 'หน้าจอมือถือ (Responsive)',
    description: 'ทดสอบ UI บนมือถือ',
    steps: [
      'เปิดเว็บบนมือถือหรือ DevTools mobile',
      'ทดสอบทุกหน้าหลัก',
      'ตรวจสอบ layout และปุ่มต่างๆ',
    ],
    expectedResult: 'UI แสดงผลถูกต้องบนมือถือ',
    completed: false,
  },
  {
    id: 'edge-3',
    category: 'Edge Cases',
    title: 'Network Slow/Offline',
    description: 'ทดสอบเมื่อ network ช้า',
    steps: [
      'เปิด DevTools > Network > Slow 3G',
      'ลองใช้งานฟีเจอร์ต่างๆ',
      'ตรวจสอบ loading states',
    ],
    expectedResult: 'แสดง loading และ error handling ถูกต้อง',
    completed: false,
  },
];

export const useQAChecklistStore = create<QAChecklistState>()(
  persist(
    (set, get) => ({
      testCases: defaultTestCases,

      resetAll: () => {
        set({
          testCases: defaultTestCases.map(tc => ({
            ...tc,
            completed: false,
            testedAt: undefined,
            notes: undefined,
          })),
        });
      },

      toggleTest: (id: string) => {
        set(state => ({
          testCases: state.testCases.map(tc =>
            tc.id === id
              ? {
                  ...tc,
                  completed: !tc.completed,
                  testedAt: !tc.completed ? new Date().toISOString() : undefined,
                }
              : tc
          ),
        }));
      },

      addNote: (id: string, note: string) => {
        set(state => ({
          testCases: state.testCases.map(tc =>
            tc.id === id ? { ...tc, notes: note } : tc
          ),
        }));
      },

      getProgress: () => {
        const { testCases } = get();
        const completed = testCases.filter(tc => tc.completed).length;
        const total = testCases.length;
        return {
          completed,
          total,
          percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
        };
      },

      getCategoryProgress: (category: string) => {
        const { testCases } = get();
        const categoryTests = testCases.filter(tc => tc.category === category);
        const completed = categoryTests.filter(tc => tc.completed).length;
        return { completed, total: categoryTests.length };
      },
    }),
    {
      name: 'qa-checklist-storage',
    }
  )
);
