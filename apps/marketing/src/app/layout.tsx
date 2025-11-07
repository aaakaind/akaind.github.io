/**
 * Root Layout for Marketing Site
 */

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AKA Industries - Enterprise Technology Platform',
  description: 'Build the future with our enterprise-grade platform for advanced technology solutions',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
