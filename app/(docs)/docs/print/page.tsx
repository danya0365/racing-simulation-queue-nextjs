'use client';

import { useRef } from 'react';
import { useReactToPrint } from 'react-to-print';

// Print styles for proper page margins
const printStyles = `
  @page {
    margin: 25mm 20mm;
    size: A4 portrait;
  }
  @media print {
    html, body {
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      font-size: 11pt !important;
    }
    .print-container {
      padding: 0 !important;
      max-width: 100% !important;
    }
    section {
      padding: 15px 0 !important;
      margin-bottom: 10px !important;
    }
    .print-section-cover {
      padding: 40px 20px !important;
      margin-bottom: 20px !important;
    }
    .print-content-box {
      padding: 20px !important;
      margin: 15px 0 !important;
    }
  }
`;

export default function PrintDocsPage() {
  const printAllRef = useRef<HTMLDivElement>(null);
  const printCustomerRef = useRef<HTMLDivElement>(null);
  const printAdminRef = useRef<HTMLDivElement>(null);

  const handlePrintAll = useReactToPrint({
    contentRef: printAllRef,
    documentTitle: 'คู่มือการใช้งาน Racing Queue',
    pageStyle: printStyles,
  });

  const handlePrintCustomer = useReactToPrint({
    contentRef: printCustomerRef,
    documentTitle: 'คู่มือสำหรับลูกค้า - Racing Queue',
    pageStyle: printStyles,
  });

  const handlePrintAdmin = useReactToPrint({
    contentRef: printAdminRef,
    documentTitle: 'คู่มือสำหรับแอดมิน - Racing Queue',
    pageStyle: printStyles,
  });

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      {/* Control Panel - Fixed at top */}
      <div className="sticky top-0 z-50 bg-white dark:bg-gray-800 shadow-lg print:hidden">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">🖨️ เลือกส่วนที่ต้องการพิมพ์</h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">คลิกปุ่มด้านล่างเพื่อพิมพ์เอกสาร</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handlePrintAll()}
                className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-600 text-white font-medium rounded-lg shadow hover:shadow-lg transition-all flex items-center gap-2"
              >
                📖 พิมพ์ทั้งหมด
              </button>
              <button
                onClick={() => handlePrintCustomer()}
                className="px-4 py-2 bg-gradient-to-r from-purple-400 to-pink-500 text-white font-medium rounded-lg shadow hover:shadow-lg transition-all flex items-center gap-2"
              >
                👤 พิมพ์คู่มือลูกค้า
              </button>
              <button
                onClick={() => handlePrintAdmin()}
                className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-medium rounded-lg shadow hover:shadow-lg transition-all flex items-center gap-2"
              >
                ⚙️ พิมพ์คู่มือแอดมิน
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Full Content - Print All */}
      <div ref={printAllRef} className="print-container max-w-4xl mx-auto px-8 py-12 bg-white text-black">
        {/* Cover Page */}
        <CoverPage />

        {/* Table of Contents */}
        <TableOfContents />

        {/* Customer Guide Content */}
        <div ref={printCustomerRef}>
          <CustomerGuide />
        </div>

        {/* Admin Guide Content */}
        <div ref={printAdminRef}>
          <AdminGuide />
        </div>

        {/* Back Cover */}
        <BackCover />
      </div>
    </div>
  );
}

// ========== COMPONENTS ==========

function CoverPage() {
  return (
    <section className="print-section-cover text-center py-20 border-b-4 border-purple-500 print:break-after-page">
      <div className="text-8xl mb-6">📖</div>
      <h1 className="text-5xl font-bold text-gray-900 mb-4">คู่มือการใช้งาน</h1>
      <h2 className="text-3xl text-purple-600 font-semibold mb-8">Racing Queue</h2>
      <p className="text-xl text-gray-600">ระบบจองเวลาเล่นเกม</p>

      <div className="mt-16 text-gray-500">
        <p className="text-lg">เวอร์ชัน 1.0</p>
        <p>มกราคม 2026</p>
      </div>
    </section>
  );
}

function TableOfContents() {
  return (
    <section className="print-section-cover py-12 print:break-after-page">
      <h2 className="text-3xl font-bold text-gray-900 mb-8 border-b-2 border-gray-200 pb-4">📋 สารบัญ</h2>

      <div className="space-y-8">
        <div>
          <h3 className="text-xl font-bold text-purple-600 mb-4">👤 ส่วนที่ 1: คู่มือสำหรับลูกค้า</h3>
          <ul className="space-y-2 text-gray-700 ml-8">
            <li className="flex justify-between border-b border-dotted border-gray-300 pb-1">
              <span>1.1 วิธีจองเวลาเล่น</span>
              <span className="text-gray-500">หน้า 3</span>
            </li>
            <li className="flex justify-between border-b border-dotted border-gray-300 pb-1">
              <span>1.2 ดูสถานะการจอง</span>
              <span className="text-gray-500">หน้า 4</span>
            </li>
            <li className="flex justify-between border-b border-dotted border-gray-300 pb-1">
              <span>1.3 ดูตารางการจอง</span>
              <span className="text-gray-500">หน้า 5</span>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="text-xl font-bold text-cyan-600 mb-4">⚙️ ส่วนที่ 2: คู่มือสำหรับแอดมิน</h3>
          <ul className="space-y-2 text-gray-700 ml-8">
            <li className="flex justify-between border-b border-dotted border-gray-300 pb-1">
              <span>2.1 เข้าหน้า Dashboard</span>
              <span className="text-gray-500">หน้า 6</span>
            </li>
            <li className="flex justify-between border-b border-dotted border-gray-300 pb-1">
              <span>2.2 แท็บต่างๆ ในหน้าแอดมิน</span>
              <span className="text-gray-500">หน้า 7</span>
            </li>
            <li className="flex justify-between border-b border-dotted border-gray-300 pb-1">
              <span>2.3 วิธีเปลี่ยนสถานะเครื่อง</span>
              <span className="text-gray-500">หน้า 8</span>
            </li>
            <li className="flex justify-between border-b border-dotted border-gray-300 pb-1">
              <span>2.4 ยืนยัน/ยกเลิกการจอง</span>
              <span className="text-gray-500">หน้า 9</span>
            </li>
            <li className="flex justify-between border-b border-dotted border-gray-300 pb-1">
              <span>2.5 พิมพ์ QR Code</span>
              <span className="text-gray-500">หน้า 10</span>
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
}

function CustomerGuide() {
  return (
    <>
      {/* Customer Cover */}
      <section className="print-section-cover py-16 bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl mb-8 text-center print:break-after-page print:rounded-none print:bg-purple-50">
        <div className="text-6xl mb-4">👤</div>
        <h2 className="text-4xl font-bold text-gray-900">ส่วนที่ 1</h2>
        <h3 className="text-2xl text-purple-600 mt-2">คู่มือสำหรับลูกค้า</h3>
        <p className="text-gray-600 mt-4">วิธีใช้งานระบบจองเวลาเล่นเกม</p>
      </section>

      {/* Section 1.1: วิธีจองเวลา */}
      <section className="py-8 print:break-after-page">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-lg bg-purple-100 border-2 border-purple-400 flex items-center justify-center text-2xl">
            📅
          </div>
          <h2 className="text-2xl font-bold text-gray-900">1.1 วิธีจองเวลาเล่น</h2>
        </div>

        <div className="print-content-box bg-gray-50 border border-gray-200 rounded-xl p-6 space-y-6">
          {/* Step 1 */}
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-500 text-white flex items-center justify-center font-bold">
              1
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-gray-900 mb-2">เข้าหน้าจองเวลา</h3>
              <p className="text-gray-600 mb-2">
                คลิกที่เมนู <span className="text-purple-600 font-medium">&ldquo;จองเวลา&rdquo;</span> บนแถบเมนู
                หรือกดปุ่ม <span className="text-pink-600 font-medium">&ldquo;📅 จองเลย&rdquo;</span> ที่หน้าแรก
              </p>
              <div className="mt-2 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                <p className="text-sm text-gray-700">
                  💡 <strong>Tip:</strong> สามารถสแกน QR Code ที่ร้านเพื่อเข้าหน้าจองได้โดยตรง
                </p>
              </div>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-500 text-white flex items-center justify-center font-bold">
              2
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-gray-900 mb-2">เลือกเครื่องเล่น</h3>
              <p className="text-gray-600 mb-2">
                เลือกเครื่องที่ต้องการเล่น จะมีแสดงรายชื่อเครื่องที่พร้อมใช้งาน
              </p>
              <ul className="text-gray-600 text-sm space-y-1 ml-4 list-disc">
                <li>แตะที่เครื่องที่ต้องการ</li>
                <li>ระบบจะไปขั้นตอนถัดไปอัตโนมัติ</li>
              </ul>
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-500 text-white flex items-center justify-center font-bold">
              3
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-gray-900 mb-2">เลือกวันและเวลา</h3>
              <p className="text-gray-600 mb-4">
                เลื่อนเลือกวันที่ต้องการ (ล่วงหน้าได้ 7 วัน) แล้วเลือกช่วงเวลาที่ว่าง
              </p>
              <div className="grid grid-cols-3 gap-2 mb-4">
                <div className="bg-emerald-50 border border-emerald-300 rounded-lg p-3 text-center">
                  <div className="w-4 h-4 rounded bg-emerald-500 mx-auto mb-1"></div>
                  <p className="text-xs text-gray-700">ว่าง</p>
                </div>
                <div className="bg-red-50 border border-red-300 rounded-lg p-3 text-center">
                  <div className="w-4 h-4 rounded bg-red-500 mx-auto mb-1"></div>
                  <p className="text-xs text-gray-700">จองแล้ว</p>
                </div>
                <div className="bg-gray-100 border border-gray-300 rounded-lg p-3 text-center">
                  <div className="w-4 h-4 rounded bg-gray-400 mx-auto mb-1"></div>
                  <p className="text-xs text-gray-700">ผ่านไปแล้ว</p>
                </div>
              </div>
            </div>
          </div>

          {/* Step 4 */}
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-500 text-white flex items-center justify-center font-bold">
              4
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-gray-900 mb-2">กรอกข้อมูลและยืนยัน</h3>
              <p className="text-gray-600 mb-4">
                กรอกชื่อและเบอร์โทร เลือกระยะเวลาเล่น แล้วกดยืนยัน
              </p>
            </div>
          </div>

          {/* Success */}
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold">
              ✓
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-emerald-600 mb-2">จองสำเร็จ!</h3>
              <p className="text-gray-600">
                เมื่อจองสำเร็จ ระบบจะแสดงรายละเอียดการจอง และบันทึกเบอร์โทรเพื่อเช็คสถานะได้ในภายหลัง
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 1.2: ดูสถานะการจอง */}
      <section className="py-8 print:break-after-page">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-lg bg-cyan-100 border-2 border-cyan-400 flex items-center justify-center text-2xl">
            📋
          </div>
          <h2 className="text-2xl font-bold text-gray-900">1.2 ดูสถานะการจอง</h2>
        </div>

        <div className="print-content-box bg-gray-50 border border-gray-200 rounded-xl p-6 space-y-4">
          <p className="text-gray-600">
            ไปที่เมนู <span className="text-cyan-600 font-medium">&ldquo;สถานะการจอง&rdquo;</span> บนแถบเมนู
          </p>

          <ol className="space-y-3 text-gray-600">
            <li className="flex items-start gap-2">
              <span className="text-cyan-600">1.</span>
              กรอกเบอร์โทรศัพท์ที่ใช้จอง
            </li>
            <li className="flex items-start gap-2">
              <span className="text-cyan-600">2.</span>
              ระบบจะแสดงรายการจองทั้งหมดของคุณ
            </li>
            <li className="flex items-start gap-2">
              <span className="text-cyan-600">3.</span>
              สามารถดูรายละเอียด วันที่ เวลา และสถานะได้
            </li>
          </ol>

          <div className="mt-4 p-4 bg-cyan-50 border border-cyan-200 rounded-xl">
            <h4 className="font-bold text-cyan-700 mb-2">สถานะการจอง</h4>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-purple-500 text-white rounded text-xs">รอ</span>
                <span className="text-gray-700">รอถึงเวลานัดหมาย</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-emerald-500 text-white rounded text-xs">ยืนยัน</span>
                <span className="text-gray-700">การจองได้รับการยืนยันแล้ว</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-gray-500 text-white rounded text-xs">เสร็จ</span>
                <span className="text-gray-700">เล่นเสร็จแล้ว</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-red-500 text-white rounded text-xs">ยกเลิก</span>
                <span className="text-gray-700">การจองถูกยกเลิก</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Section 1.3: ดูตารางการจอง */}
      <section className="py-8 print:break-after-page">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-lg bg-pink-100 border-2 border-pink-400 flex items-center justify-center text-2xl">
            📜
          </div>
          <h2 className="text-2xl font-bold text-gray-900">1.3 ดูตารางการจอง</h2>
        </div>

        <div className="print-content-box bg-gray-50 border border-gray-200 rounded-xl p-6 space-y-4">
          <p className="text-gray-600">
            ไปที่เมนู <span className="text-pink-600 font-medium">&ldquo;ตารางจอง&rdquo;</span> บนแถบเมนู
          </p>

          <div className="space-y-3 text-gray-600">
            <p>หน้านี้แสดง:</p>
            <ul className="ml-4 space-y-2 list-disc">
              <li>ตารางการจองทั้งหมดของวันนี้</li>
              <li>สามารถเลือกดูวันอื่นได้</li>
              <li>กรองตามเครื่องที่ต้องการดู</li>
              <li>เห็นช่วงเวลาว่าง/จองแล้ว</li>
            </ul>
          </div>

          <div className="mt-4 p-4 bg-pink-50 border border-pink-200 rounded-xl">
            <p className="text-sm text-gray-700">
              💡 <strong>Tip:</strong> ใช้หน้านี้เพื่อดูว่าช่วงไหนว่างก่อนจอง
            </p>
          </div>
        </div>
      </section>
    </>
  );
}

function AdminGuide() {
  return (
    <>
      {/* Admin Cover */}
      <section className="print-section-cover py-16 bg-gradient-to-br from-cyan-100 to-blue-100 rounded-2xl mb-8 text-center print:break-after-page print:rounded-none print:bg-cyan-50">
        <div className="text-6xl mb-4">⚙️</div>
        <h2 className="text-4xl font-bold text-gray-900">ส่วนที่ 2</h2>
        <h3 className="text-2xl text-cyan-600 mt-2">คู่มือสำหรับแอดมิน</h3>
        <p className="text-gray-600 mt-4">วิธีจัดการระบบ เครื่อง และการจอง</p>
      </section>

      {/* Section 2.1: เข้าหน้าแอดมิน */}
      <section className="py-8 print:break-after-page">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-lg bg-cyan-100 border-2 border-cyan-400 flex items-center justify-center text-2xl">
            📊
          </div>
          <h2 className="text-2xl font-bold text-gray-900">2.1 เข้าหน้า Dashboard</h2>
        </div>

        <div className="print-content-box bg-gray-50 border border-gray-200 rounded-xl p-6 space-y-4">
          <p className="text-gray-600">
            เข้าสู่หน้าแอดมินได้ 2 วิธี:
          </p>

          <ol className="space-y-3 text-gray-600">
            <li className="flex items-start gap-2">
              <span className="text-cyan-600">1.</span>
              คลิกที่เมนู <span className="text-cyan-600 font-medium">&ldquo;แอดมิน&rdquo;</span> บนแถบเมนู
            </li>
            <li className="flex items-start gap-2">
              <span className="text-cyan-600">2.</span>
              หรือเข้า URL โดยตรง: <code className="px-2 py-1 bg-gray-200 rounded text-cyan-700 text-sm">/backend</code>
            </li>
          </ol>

          <div className="mt-4 p-4 bg-cyan-50 border border-cyan-200 rounded-xl">
            <h4 className="font-bold text-cyan-700 mb-2">หน้า Dashboard แสดงอะไรบ้าง?</h4>
            <ul className="space-y-2 text-sm text-gray-700">
              <li>📊 สถิติรวม - จำนวนเครื่อง, เครื่องว่าง, คิวรอ, กำลังเล่น</li>
              <li>📋 คิวล่าสุดวันนี้</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Section 2.2: Tabs */}
      <section className="py-8 print:break-after-page">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-lg bg-purple-100 border-2 border-purple-400 flex items-center justify-center text-2xl">
            📑
          </div>
          <h2 className="text-2xl font-bold text-gray-900">2.2 แท็บต่างๆ ในหน้าแอดมิน</h2>
        </div>

        <div className="grid gap-4">
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
            <h3 className="font-bold text-gray-900 flex items-center gap-2 mb-2">
              <span className="text-cyan-600">📊</span> Dashboard
            </h3>
            <p className="text-gray-600 text-sm">
              ภาพรวมของร้าน สถิติเครื่อง และคิวล่าสุด
            </p>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
            <h3 className="font-bold text-gray-900 flex items-center gap-2 mb-2">
              <span className="text-emerald-600">🎮</span> จัดการเครื่อง
            </h3>
            <p className="text-gray-600 text-sm mb-2">
              จัดการเครื่องเล่นทั้งหมด
            </p>
            <ul className="space-y-1 text-sm text-gray-700 ml-4 list-disc">
              <li>เปลี่ยนสถานะเครื่อง (ว่าง / กำลังเล่น / ปิดซ่อม)</li>
              <li>ดูคิวของแต่ละเครื่อง</li>
              <li>Reset คิวเครื่อง</li>
            </ul>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
            <h3 className="font-bold text-gray-900 flex items-center gap-2 mb-2">
              <span className="text-orange-600">👥</span> จัดการลูกค้า
            </h3>
            <p className="text-gray-600 text-sm mb-2">
              ดูและจัดการข้อมูลลูกค้า
            </p>
            <ul className="space-y-1 text-sm text-gray-700 ml-4 list-disc">
              <li>ค้นหาลูกค้าจากเบอร์โทร</li>
              <li>ดูประวัติการจอง</li>
            </ul>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
            <h3 className="font-bold text-gray-900 flex items-center gap-2 mb-2">
              <span className="text-pink-600">📅</span> จองเวลา
            </h3>
            <p className="text-gray-600 text-sm mb-2">
              จัดการการจองเวลาทั้งหมด
            </p>
            <ul className="space-y-1 text-sm text-gray-700 ml-4 list-disc">
              <li>ดูตารางการจองแยกตามเครื่อง</li>
              <li>ยืนยัน / ยกเลิกการจอง</li>
              <li>เลือกดูวันอื่นๆ ได้</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Section 2.3: เปลี่ยนสถานะเครื่อง */}
      <section className="py-8 print:break-after-page">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-lg bg-emerald-100 border-2 border-emerald-400 flex items-center justify-center text-2xl">
            🔄
          </div>
          <h2 className="text-2xl font-bold text-gray-900">2.3 วิธีเปลี่ยนสถานะเครื่อง</h2>
        </div>

        <div className="print-content-box bg-gray-50 border border-gray-200 rounded-xl p-6 space-y-4">
          <p className="text-gray-600">
            ไปที่แท็บ <span className="text-emerald-600 font-medium">&ldquo;จัดการเครื่อง&rdquo;</span>
          </p>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <span className="px-3 py-1 bg-emerald-500 text-white rounded-full text-xs font-bold">ว่าง</span>
              <p className="text-gray-600 text-sm">เครื่องพร้อมใช้งาน ลูกค้าจองได้</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="px-3 py-1 bg-orange-500 text-white rounded-full text-xs font-bold">กำลังเล่น</span>
              <p className="text-gray-600 text-sm">มีลูกค้ากำลังเล่นอยู่</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="px-3 py-1 bg-gray-500 text-white rounded-full text-xs font-bold">ปิดซ่อม</span>
              <p className="text-gray-600 text-sm">เครื่องอยู่ในโหมดซ่อมบำรุง ลูกค้าจองไม่ได้</p>
            </div>
          </div>

          <div className="mt-4 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
            <p className="text-sm text-gray-700">
              💡 <strong>วิธีเปลี่ยน:</strong> กดปุ่ม <span className="text-emerald-600">&ldquo;🔧 ปิดซ่อม&rdquo;</span> หรือ <span className="text-emerald-600">&ldquo;✅ เปิดเครื่อง&rdquo;</span>
            </p>
          </div>
        </div>
      </section>

      {/* Section 2.4: จัดการการจอง */}
      <section className="py-8 print:break-after-page">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-lg bg-pink-100 border-2 border-pink-400 flex items-center justify-center text-2xl">
            ✅
          </div>
          <h2 className="text-2xl font-bold text-gray-900">2.4 ยืนยัน/ยกเลิกการจอง</h2>
        </div>

        <div className="print-content-box bg-gray-50 border border-gray-200 rounded-xl p-6 space-y-4">
          <p className="text-gray-600">
            ไปที่แท็บ <span className="text-pink-600 font-medium">&ldquo;จองเวลา&rdquo;</span>
          </p>

          <ol className="space-y-3 text-gray-600">
            <li className="flex items-start gap-2">
              <span className="text-pink-600">1.</span>
              เลือกเครื่องที่ต้องการดู (หรือเลือก &ldquo;ทุกเครื่อง&rdquo;)
            </li>
            <li className="flex items-start gap-2">
              <span className="text-pink-600">2.</span>
              เลือกวันที่ต้องการดู
            </li>
            <li className="flex items-start gap-2">
              <span className="text-pink-600">3.</span>
              ดูรายการจองในตาราง
            </li>
            <li className="flex items-start gap-2">
              <span className="text-pink-600">4.</span>
              กดปุ่ม <span className="text-emerald-600">&ldquo;✅&rdquo;</span> เพื่อยืนยัน หรือ <span className="text-red-600">&ldquo;❌&rdquo;</span> เพื่อยกเลิก
            </li>
          </ol>
        </div>
      </section>

      {/* Section 2.5: Print QR */}
      <section className="py-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-lg bg-blue-100 border-2 border-blue-400 flex items-center justify-center text-2xl">
            🖨️
          </div>
          <h2 className="text-2xl font-bold text-gray-900">2.5 พิมพ์ QR Code</h2>
        </div>

        <div className="print-content-box bg-gray-50 border border-gray-200 rounded-xl p-6 space-y-4">
          <p className="text-gray-600">
            กดปุ่ม <span className="text-blue-600 font-medium">&ldquo;🖨️ Print QR&rdquo;</span> ที่ด้านบนของหน้าแอดมิน
          </p>

          <p className="text-gray-600">
            ระบบจะพิมพ์ QR Code สำหรับให้ลูกค้าสแกนเพื่อจองเวลา ติดไว้ที่ร้านได้เลย
          </p>

          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-xl">
            <p className="text-sm text-gray-700">
              💡 <strong>Tip:</strong> QR Code จะลิงก์ไปที่หน้าจองเวลาโดยตรง
            </p>
          </div>
        </div>
      </section>
    </>
  );
}

function BackCover() {
  return (
    <section className="py-16 text-center border-t-4 border-purple-500 mt-12 print:break-before-page">
      <div className="text-6xl mb-6">🏁</div>
      <h2 className="text-3xl font-bold text-gray-900 mb-4">Racing Queue</h2>
      <p className="text-xl text-gray-600 mb-8">ระบบจองเวลาเล่นเกม</p>

      <div className="text-gray-500">
        <p>© 2026 Racing Queue</p>
        <p className="mt-2">คู่มือการใช้งาน เวอร์ชัน 1.0</p>
      </div>
    </section>
  );
}
