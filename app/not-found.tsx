'use client';

import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-racing-gradient flex items-center justify-center p-4">
      <div className="text-center">
        <div className="text-9xl font-bold bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent mb-4">
          404
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-2">
          ไม่พบหน้าที่ต้องการ
        </h1>
        <p className="text-muted mb-8">
          หน้าที่คุณกำลังค้นหาอาจถูกลบหรือย้ายไปแล้ว
        </p>
        <Link 
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-medium rounded-xl shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 hover:scale-105 transition-all"
        >
          <span>🏠</span>
          <span>กลับหน้าแรก</span>
        </Link>
      </div>
    </div>
  );
}
