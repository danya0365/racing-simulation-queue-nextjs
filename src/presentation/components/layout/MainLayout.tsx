'use client';

import { ReactNode } from 'react';
import { MainFooter } from './MainFooter';
import { MainHeader } from './MainHeader';

interface MainLayoutProps {
  children: ReactNode;
}

/**
 * MainLayout - Full-screen web app layout
 * No scrolling on the main container, designed like a web app
 */
export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col bg-background">
      {/* Header */}
      <MainHeader />

      {/* Main Content Area - Takes remaining space */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>

      {/* Footer */}
      <MainFooter />
    </div>
  );
}
