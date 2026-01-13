import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'คู่มือการใช้งาน | Racing Queue',
  description: 'คู่มือการใช้งานระบบจองคิว Racing Queue สำหรับลูกค้าและแอดมิน',
};

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      {children}
    </div>
  );
}
