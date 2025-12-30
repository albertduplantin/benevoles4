'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

export default function SSOCallbackPage() {
  const router = useRouter();
  const { isProfileComplete, loading } = useAuth();

  useEffect(() => {
    if (loading) return;

    // Rediriger selon si le profil est complet ou non
    if (isProfileComplete) {
      router.push('/dashboard/missions');
    } else {
      router.push('/auth/complete-profile');
    }
  }, [isProfileComplete, loading, router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Connexion en cours...</p>
      </div>
    </div>
  );
}
