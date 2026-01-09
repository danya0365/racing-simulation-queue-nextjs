'use client';

import { useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';

interface PortalProps {
  children: React.ReactNode;
}

// Subscription function that never triggers updates
const emptySubscribe = () => () => {};

// Server always returns false
const getServerSnapshot = () => false;

// Client returns true after hydration
const getClientSnapshot = () => true;

/**
 * Portal component that renders children at the document body level
 * This fixes issues with fixed positioning inside transformed parents
 */
export function Portal({ children }: PortalProps) {
  // useSyncExternalStore is the recommended way to handle client-only rendering
  const mounted = useSyncExternalStore(emptySubscribe, getClientSnapshot, getServerSnapshot);

  if (!mounted) return null;

  return createPortal(children, document.body);
}
