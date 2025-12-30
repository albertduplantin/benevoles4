'use client';

import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function MissionsPage() {
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Missions</h1>
          <p className="text-gray-600 mt-2">
            Bienvenue {user.firstName} {user.lastName}!
          </p>
        </div>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>🎉 Migration réussie vers Clerk + Neon PostgreSQL!</CardTitle>
          <CardDescription>
            Votre profil a été créé avec succès. La migration des fonctionnalités est en cours.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-green-50 border border-green-200 rounded-md">
              <h3 className="font-semibold text-green-800 mb-2">✅ Fonctionnalités actives</h3>
              <ul className="list-disc list-inside text-sm text-green-700 space-y-1">
                <li>Authentification avec Clerk</li>
                <li>Base de données Neon PostgreSQL</li>
                <li>Profil utilisateur complété</li>
                <li>Session sécurisée</li>
              </ul>
            </div>

            <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
              <h3 className="font-semibold text-blue-800 mb-2">🚧 En cours de migration</h3>
              <ul className="list-disc list-inside text-sm text-blue-700 space-y-1">
                <li>Liste des missions</li>
                <li>Inscription aux missions</li>
                <li>Calendrier des disponibilités</li>
                <li>Gestion des préférences</li>
              </ul>
            </div>

            <div className="p-4 bg-gray-50 border border-gray-200 rounded-md">
              <h3 className="font-semibold text-gray-800 mb-2">📋 Vos informations</h3>
              <div className="text-sm text-gray-700 space-y-1">
                <p><strong>Nom:</strong> {user.firstName} {user.lastName}</p>
                <p><strong>Email:</strong> {user.email}</p>
                <p><strong>Rôle:</strong> {user.role === 'volunteer' ? 'Bénévole' : user.role === 'admin' ? 'Administrateur' : 'Responsable'}</p>
              </div>
            </div>

            {user.role === 'admin' && (
              <div className="p-4 bg-purple-50 border border-purple-200 rounded-md">
                <h3 className="font-semibold text-purple-800 mb-2">👨‍💼 Actions administrateur</h3>
                <p className="text-sm text-purple-700 mb-3">
                  Les fonctionnalités d'administration seront bientôt disponibles.
                </p>
                <Button variant="outline" size="sm" disabled>
                  Créer une mission (bientôt)
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Prochaines étapes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <p>
              La migration de Firebase vers Clerk + Neon est en cours. Les fonctionnalités
              suivantes seront ajoutées progressivement:
            </p>
            <ol className="list-decimal list-inside space-y-2 ml-4">
              <li>Migration de toutes les missions existantes vers Neon</li>
              <li>Interface de gestion des missions</li>
              <li>Système d'inscription aux créneaux</li>
              <li>Calendrier interactif</li>
              <li>Notifications par email</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
