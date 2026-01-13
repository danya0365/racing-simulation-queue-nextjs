import Link from 'next/link';

export default function DocsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      {/* Header */}
      <header className="text-center mb-16">
        <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-gradient-to-br from-purple-500 to-pink-600 text-5xl shadow-2xl shadow-purple-500/30 mb-6">
          📖
        </div>
        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
            คู่มือการใช้งาน
          </span>
        </h1>
        <p className="text-gray-400 text-lg">
          Racing Queue - ระบบจองเวลาเล่นเกม
        </p>
        <div className="mt-6">
          <Link 
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-full text-white/70 hover:text-white transition-all"
          >
            ← กลับหน้าแรก
          </Link>
        </div>
      </header>

      {/* Quick Start Cards */}
      <section className="grid md:grid-cols-2 gap-6 mb-16">
        <Link href="/docs/customer" className="group">
          <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/30 hover:border-purple-400 rounded-2xl p-6 transition-all group-hover:shadow-lg group-hover:shadow-purple-500/20">
            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-3xl mb-4">
              👤
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">สำหรับลูกค้า</h2>
            <p className="text-gray-400 mb-4">วิธีจองเวลา ดูสถานะ และใช้งานระบบ</p>
            <span className="inline-flex items-center text-purple-400 group-hover:text-purple-300">
              เริ่มต้นใช้งาน →
            </span>
          </div>
        </Link>

        <Link href="/docs/admin" className="group">
          <div className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/30 hover:border-cyan-400 rounded-2xl p-6 transition-all group-hover:shadow-lg group-hover:shadow-cyan-500/20">
            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-3xl mb-4">
              ⚙️
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">สำหรับแอดมิน</h2>
            <p className="text-gray-400 mb-4">วิธีจัดการเครื่อง คิว และการจอง</p>
            <span className="inline-flex items-center text-cyan-400 group-hover:text-cyan-300">
              ดูวิธีจัดการ →
            </span>
          </div>
        </Link>
      </section>

      {/* Table of Contents */}
      <section className="bg-white/5 border border-white/10 rounded-2xl p-8">
        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
          <span className="text-2xl">📋</span>
          สารบัญ
        </h2>
        
        <div className="space-y-4">
          <div>
            <h3 className="font-bold text-purple-400 mb-2">👤 คู่มือลูกค้า</h3>
            <ul className="space-y-2 text-gray-400 ml-6">
              <li>
                <Link href="/docs/customer#booking" className="hover:text-white transition-colors">
                  → วิธีจองเวลาเล่น
                </Link>
              </li>
              <li>
                <Link href="/docs/customer#status" className="hover:text-white transition-colors">
                  → ดูสถานะการจอง
                </Link>
              </li>
              <li>
                <Link href="/docs/customer#history" className="hover:text-white transition-colors">
                  → ดูตารางการจอง
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-cyan-400 mb-2">⚙️ คู่มือแอดมิน</h3>
            <ul className="space-y-2 text-gray-400 ml-6">
              <li>
                <Link href="/docs/admin#dashboard" className="hover:text-white transition-colors">
                  → หน้า Dashboard
                </Link>
              </li>
              <li>
                <Link href="/docs/admin#machines" className="hover:text-white transition-colors">
                  → จัดการเครื่อง
                </Link>
              </li>
              <li>
                <Link href="/docs/admin#bookings" className="hover:text-white transition-colors">
                  → จัดการการจอง
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-16 text-center text-gray-500 text-sm">
        <p>เวอร์ชัน 1.0 | อัปเดตล่าสุด: มกราคม 2026</p>
      </footer>
    </div>
  );
}
