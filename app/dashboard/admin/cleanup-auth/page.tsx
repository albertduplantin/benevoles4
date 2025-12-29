'use client';

import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { isProfileComplete } from '@/lib/firebase/users';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Trash2, AlertTriangle, Loader2 } from 'lucide-react';

export default function CleanupAuthPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login');
    } else if (!loading && user && !isProfileComplete(user)) {
      router.push('/auth/complete-profile');
    } else if (!loading && user && user.role !== 'admin') {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  const handleDeleteAuthAccount = async () => {
    if (!email.trim()) {
      toast.error('Veuillez saisir une adresse email');
      return;
    }

    if (!confirm(`Êtes-vous sûr de vouloir supprimer le compte Firebase Auth de ${email} ?\n\nCette action est irréversible et permettra à cette personne de se réinscrire.`)) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch('/api/delete-user-by-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message || 'Compte supprimé avec succès');
        setEmail('');
      } else {
        toast.error(data.error || 'Erreur lors de la suppression');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Erreur lors de la suppression');
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading || !user || user.role !== 'admin') {
    return null;
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Nettoyage Firebase Authentication</h1>

      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            <CardTitle>Attention : Zone de maintenance</CardTitle>
          </div>
          <CardDescription>
            Cette page permet de supprimer des comptes Firebase Authentication orphelins
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <p className="text-sm text-orange-800">
              <strong>Quand utiliser cet outil :</strong>
            </p>
            <ul className="text-sm text-orange-800 mt-2 space-y-1 list-disc list-inside">
              <li>Un bénévole a été supprimé mais ne peut pas se réinscrire (email déjà utilisé)</li>
              <li>Un compte existe dans Firebase Auth mais pas dans Firestore</li>
              <li>Besoin de libérer une adresse email pour une nouvelle inscription</li>
            </ul>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Adresse email du compte à supprimer</Label>
            <Input
              id="email"
              type="email"
              placeholder="exemple@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isDeleting}
            />
            <p className="text-xs text-muted-foreground">
              Supprimera uniquement le compte Firebase Authentication, pas les données Firestore
            </p>
          </div>

          <Button
            onClick={handleDeleteAuthAccount}
            disabled={isDeleting || !email.trim()}
            variant="destructive"
            className="w-full"
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Suppression en cours...
              </>
            ) : (
              <>
                <Trash2 className="mr-2 h-4 w-4" />
                Supprimer le compte Auth
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>ℹ️ Informations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div>
            <p className="font-medium mb-1">Problème :</p>
            <p className="text-muted-foreground">
              Quand vous supprimez un bénévole depuis la page Bénévoles, le système supprime maintenant automatiquement
              le compte Firebase Auth. Mais pour les comptes supprimés avant cette mise à jour, l'email reste bloqué.
            </p>
          </div>

          <div>
            <p className="font-medium mb-1">Solution :</p>
            <p className="text-muted-foreground">
              Utilisez cet outil pour supprimer manuellement le compte Auth orphelin. La personne pourra ensuite
              se réinscrire normalement avec la même adresse email.
            </p>
          </div>

          <div>
            <p className="font-medium mb-1">Prévention :</p>
            <p className="text-muted-foreground">
              À partir de maintenant, la suppression d'un bénévole supprime automatiquement son compte Auth,
              donc ce problème ne devrait plus se reproduire.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}











