import type { Metadata } from 'next';
import { Open_Sans, Oswald } from 'next/font/google';
import './globals.css';
import { SessionProvider } from 'next-auth/react';
import { auth } from '@/auth';
import { QueryProvider } from '@/components/providers/query-provider';
import { InstallPWAButton } from '@/components/features/pwa/install-pwa-button';
import { NetworkStatus } from '@/components/features/pwa/network-status';
import { ServiceWorkerRegister } from '@/components/features/pwa/service-worker-register';
import { Toaster } from 'sonner';

const openSans = Open_Sans({ subsets: ['latin'], variable: '--font-open-sans' });
const oswald = Oswald({ subsets: ['latin'], variable: '--font-oswald' });

export const metadata: Metadata = {
  title: 'Festival Films Courts de Dinan - Gestion des Bénévoles',
  description:
    'Application de gestion des bénévoles pour le Festival Films Courts de Dinan 2025',
  manifest: '/manifest.json',
  icons: {
    apple: '/icon-192x192.png',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#121110',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();

  return (
    <SessionProvider session={session}>
      <html lang="fr">
        <body className={`${openSans.variable} ${oswald.variable} font-sans antialiased`}>
          <QueryProvider>
            <ServiceWorkerRegister />
            {children}
            <InstallPWAButton />
            <NetworkStatus />
            <Toaster position="top-right" richColors />
          </QueryProvider>
        </body>
      </html>
    </SessionProvider>
  );
}
