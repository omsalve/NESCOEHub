import React from 'react';

// This layout component is necessary for the /auth route group.
// It will wrap pages like login, signup, forgot-password, etc.
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Auth pages typically don't share a complex layout like a dashboard,
  // so we can just render the page content directly.
  return <>{children}</>;
}
