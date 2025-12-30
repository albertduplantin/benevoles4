'use client';

import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter, usePathname } from 'next/navigation';
import { Header } from '@/components/layouts/header';
import { SupportBanner } from '@/components/features/support/support-banner';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, isProfileComplete } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // Protection globale du dashboard : redirection si profil incomplet
  useEffect(() => {
    if (!loading && !user) {
      // Pas connecté : rediriger vers login
      router.push('/auth/login');
    } else if (!loading && user && !isProfileComplete) {
      // Profil incomplet : rediriger vers complete-profile
      // Sauf si on est déjà sur cette page
      if (pathname !== '/auth/complete-profile') {
        router.push('/auth/complete-profile');
      }
    }
  }, [user, loading, isProfileComplete, router, pathname]);

  // Afficher un loader pendant la vérification
  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Chargement...</p>
      </div>
    );
  }

  // Si le profil est incomplet, ne rien afficher (la redirection est en cours)
  if (!isProfileComplete) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Vérification du profil...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <SupportBanner />
      <main className="container mx-auto px-4 py-6">{children}</main>
    </div>
  );
}

