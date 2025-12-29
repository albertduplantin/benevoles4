import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ClerkProvider } from '@clerk/nextjs';
import { frFR } from '@clerk/localizations';
import { QueryProvider } from '@/components/providers/query-provider';
import { InstallPWAButton } from '@/components/features/pwa/install-pwa-button';
import { NetworkStatus } from '@/components/features/pwa/network-status';
import { ServiceWorkerRegister } from '@/components/features/pwa/service-worker-register';
import { Toaster } from 'sonner';

const inter = Inter({ subsets: ['latin'] });

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
  themeColor: '#000000',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider localization={frFR}>
      <html lang="fr">
        <body className={inter.className}>
          <QueryProvider>
            <ServiceWorkerRegister />
            {children}
            <InstallPWAButton />
            <NetworkStatus />
            <Toaster position="top-right" richColors />
          </QueryProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
