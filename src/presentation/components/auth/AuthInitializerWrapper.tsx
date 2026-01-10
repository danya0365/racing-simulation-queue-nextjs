"use client";

import dynamic from 'next/dynamic';
import React from 'react';

// Dynamically import the AuthInitializer to avoid SSR issues
const AuthInitializer = dynamic(
  () => import('./AuthInitializer'),
  { ssr: false }
);

/**
 * Client component wrapper for AuthInitializer
 */
const AuthInitializerWrapper: React.FC = () => {
  return <AuthInitializer />;
};

export default AuthInitializerWrapper;
