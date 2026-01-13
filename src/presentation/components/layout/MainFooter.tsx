'use client';

import Link from 'next/link';

export function MainFooter() {
  return (
    <footer className="h-14 bg-surface/80 backdrop-blur-lg border-t border-border/50 flex items-center justify-between px-4 md:px-8">
      {/* Copyright */}
      <div className="flex items-center gap-2 text-sm text-muted">
        <span>© 2025</span>
        <span className="font-semibold bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent cursor-default transition-transform duration-200 hover:scale-110">
          Racing Queue System
        </span>
      </div>

      {/* Quick Links */}
      <div className="flex items-center gap-4">
        <Link href="/time-booking" className="text-xs font-medium text-gray-500 hover:text-cyan-400 transition-colors duration-200">
          จองคิว
        </Link>
        <span className="text-border">|</span>
        <Link href="/qr-scan" className="text-xs font-medium text-gray-500 hover:text-cyan-400 transition-colors duration-200">
          สแกนคิวอาร์โค้ด
        </Link>
        <span className="text-border">|</span>
        <Link href="/backend" className="text-xs font-medium text-gray-500 hover:text-cyan-400 transition-colors duration-200">
          แอดมิน
        </Link>
        <span className="text-border">|</span>
        <Link href="/docs" className="text-xs font-medium text-gray-500 hover:text-cyan-400 transition-colors duration-200">
          คู่มือ
        </Link>
      </div>

      {/* Status Indicator */}
      <div className="hidden sm:flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
        <span className="text-xs text-muted">ระบบพร้อมใช้งาน</span>
      </div>
    </footer>
  );
}
