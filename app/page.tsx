'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';

export default function Home() {
  const { clerkUser, loading, isProfileComplete } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    // Si l'utilisateur est connecté via Clerk
    if (clerkUser) {
      // Si le profil est complet, rediriger vers dashboard
      if (isProfileComplete) {
        router.push('/dashboard/missions');
      }
      // Sinon, rediriger vers complete-profile
      else {
        router.push('/auth/complete-profile');
      }
    }
  }, [loading, clerkUser, isProfileComplete, router]);

  // Afficher un loader pendant la vérification
  if (loading) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </main>
    );
  }

  // Si utilisateur connecté, ne rien afficher (redirection en cours)
  if (clerkUser) {
    return null;
  }

  // Page d'accueil pour utilisateurs non connectés
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-blue-50 to-white p-8">
      <div className="text-center space-y-8 max-w-4xl">
        {/* En-tête */}
        <div className="space-y-4">
          <div className="text-6xl mb-4">🎬</div>
          <h1 className="text-5xl font-bold text-gray-900">
            Festival Films Courts de Dinan
          </h1>
          <h2 className="text-2xl text-gray-600 font-medium">
            Plateforme de Gestion des Bénévoles
          </h2>
          <p className="text-xl text-blue-600 font-semibold">
            📅 19-23 novembre 2025
          </p>
        </div>

        {/* Description */}
        <div className="bg-white p-8 rounded-xl shadow-lg max-w-2xl mx-auto">
          <p className="text-lg text-gray-700 leading-relaxed">
            Rejoignez l'aventure du Festival Films Courts de Dinan ! 
            Inscrivez-vous pour participer en tant que bénévole et 
            accédez à votre tableau de bord personnalisé.
          </p>
        </div>

        {/* Boutons d'action */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
          <Link href="/auth/login">
            <button className="w-full sm:w-auto px-8 py-4 bg-blue-600 text-white text-lg font-semibold rounded-lg hover:bg-blue-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105">
              Se connecter
            </button>
          </Link>
          <Link href="/auth/register">
            <button className="w-full sm:w-auto px-8 py-4 bg-white text-blue-600 border-2 border-blue-600 text-lg font-semibold rounded-lg hover:bg-blue-50 transition-all shadow-lg hover:shadow-xl transform hover:scale-105">
              Créer un compte
            </button>
          </Link>
        </div>

        {/* Points clés */}
        <div className="grid md:grid-cols-3 gap-6 mt-12">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-3xl mb-3">📋</div>
            <h3 className="font-semibold text-lg mb-2">Missions variées</h3>
            <p className="text-gray-600 text-sm">
              Choisissez parmi de nombreuses missions adaptées à vos disponibilités
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-3xl mb-3">📅</div>
            <h3 className="font-semibold text-lg mb-2">Planning personnalisé</h3>
            <p className="text-gray-600 text-sm">
              Visualisez vos missions sur un calendrier interactif
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-3xl mb-3">🤝</div>
            <h3 className="font-semibold text-lg mb-2">Communauté</h3>
            <p className="text-gray-600 text-sm">
              Coordonnez-vous avec les autres bénévoles et responsables
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-16 text-sm text-gray-500">
          <p>© 2025 Festival Films Courts de Dinan - Tous droits réservés</p>
        </div>
      </div>
    </main>
  );
}
