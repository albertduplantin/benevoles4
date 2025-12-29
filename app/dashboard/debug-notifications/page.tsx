'use client';

import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getUserFCMTokens } from '@/lib/firebase/fcm-tokens';
import { toast } from 'sonner';
import { Loader2, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';

export default function DebugNotificationsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  
  const [checks, setChecks] = useState({
    notificationSupport: false,
    permission: 'default' as NotificationPermission,
    serviceWorker: false,
    fcmToken: null as string | null,
    firestoreTokens: [] as string[],
    vapidKey: false,
  });
  
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    const runChecks = async () => {
      if (!user) return;
      
      try {
        setIsLoading(true);
        const results: any = {};

        // 1. Vérifier support des notifications
        results.notificationSupport = 'Notification' in window && 'serviceWorker' in navigator;
        
        // 2. Vérifier la permission
        results.permission = Notification.permission;

        // 3. Vérifier le Service Worker
        if ('serviceWorker' in navigator) {
          const registrations = await navigator.serviceWorker.getRegistrations();
          const swRegistered = registrations.some(reg => 
            reg.active?.scriptURL.includes('firebase-messaging-sw.js')
          );
          results.serviceWorker = swRegistered;
        }

        // 4. Vérifier la clé VAPID
        results.vapidKey = !!process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;

        // 5. Récupérer les tokens Firestore
        const firestoreTokens = await getUserFCMTokens(user.uid);
        results.firestoreTokens = firestoreTokens;

        // 6. Essayer de récupérer le token FCM actuel
        if (results.permission === 'granted') {
          try {
            const { getMessaging, getToken } = await import('firebase/messaging');
            const { app } = await import('@/lib/firebase/config');
            const messaging = getMessaging(app);
            const token = await getToken(messaging, {
              vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
            });
            results.fcmToken = token;
          } catch (error) {
            console.error('Erreur lors de la récupération du token:', error);
            results.fcmToken = null;
          }
        }

        setChecks(results);
      } catch (error) {
        console.error('Erreur lors des vérifications:', error);
        toast.error('Erreur lors des vérifications');
      } finally {
        setIsLoading(false);
      }
    };

    runChecks();
  }, [user]);

  const testNotification = () => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Test de notification', {
        body: 'Si vous voyez ceci, les notifications fonctionnent !',
        icon: '/icon-192x192.png',
      });
      toast.success('Notification de test envoyée');
    } else {
      toast.error('Permissions manquantes');
    }
  };

  if (loading || isLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const CheckItem = ({ 
    label, 
    status, 
    detail 
  }: { 
    label: string; 
    status: 'success' | 'warning' | 'error'; 
    detail?: string 
  }) => (
    <div className="flex items-start gap-3 p-3 border rounded-lg">
      {status === 'success' && <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />}
      {status === 'warning' && <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />}
      {status === 'error' && <XCircle className="h-5 w-5 text-red-600 mt-0.5" />}
      <div className="flex-1">
        <p className="font-medium">{label}</p>
        {detail && <p className="text-sm text-muted-foreground mt-1">{detail}</p>}
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">🔍 Débogage Notifications</h1>
        <p className="text-muted-foreground">
          Diagnostic des notifications push
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>État du système</CardTitle>
          <CardDescription>
            Vérifications des composants nécessaires
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <CheckItem
            label="Support des notifications"
            status={checks.notificationSupport ? 'success' : 'error'}
            detail={checks.notificationSupport 
              ? 'Votre navigateur supporte les notifications' 
              : 'Votre navigateur ne supporte pas les notifications'}
          />

          <CheckItem
            label="Permission navigateur"
            status={
              checks.permission === 'granted' ? 'success' 
              : checks.permission === 'denied' ? 'error' 
              : 'warning'
            }
            detail={
              checks.permission === 'granted' 
                ? 'Permission accordée' 
                : checks.permission === 'denied'
                  ? 'Permission refusée - Modifier dans les paramètres du navigateur'
                  : 'Permission non demandée - Activer dans la page Notifications'
            }
          />

          <CheckItem
            label="Service Worker"
            status={checks.serviceWorker ? 'success' : 'error'}
            detail={checks.serviceWorker 
              ? 'Service Worker enregistré' 
              : 'Service Worker non trouvé - Rechargez la page'}
          />

          <CheckItem
            label="Clé VAPID configurée"
            status={checks.vapidKey ? 'success' : 'error'}
            detail={checks.vapidKey 
              ? `Clé présente: ${process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY?.substring(0, 10)}...` 
              : 'Clé VAPID manquante dans les variables d\'environnement'}
          />

          <CheckItem
            label="Token FCM actuel"
            status={checks.fcmToken ? 'success' : 'warning'}
            detail={checks.fcmToken 
              ? `Token: ${checks.fcmToken.substring(0, 20)}...` 
              : 'Aucun token - Activez les notifications d\'abord'}
          />

          <CheckItem
            label={`Tokens enregistrés dans Firestore (${checks.firestoreTokens.length})`}
            status={checks.firestoreTokens.length > 0 ? 'success' : 'warning'}
            detail={checks.firestoreTokens.length > 0
              ? checks.firestoreTokens.map(t => t.substring(0, 20) + '...').join(', ')
              : 'Aucun token enregistré - Activez les notifications d\'abord'}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Actions de test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button 
            onClick={testNotification}
            disabled={checks.permission !== 'granted'}
            className="w-full"
          >
            Envoyer une notification de test (locale)
          </Button>
          
          <div className="text-sm text-muted-foreground">
            <p>• Pour tester l'envoi depuis le serveur, utilisez la page admin "Envoyer notifications"</p>
            <p>• Assurez-vous d'avoir au moins un token enregistré dans Firestore</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Informations système</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="font-medium">User ID:</span> {user.uid}
            </div>
            <div>
              <span className="font-medium">Email:</span> {user.email}
            </div>
            <div>
              <span className="font-medium">Navigateur:</span> {navigator.userAgent.split(' ').pop()}
            </div>
            <div>
              <span className="font-medium">HTTPS:</span> {location.protocol === 'https:' ? '✅' : '❌'}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-sm">💡 Conseils de débogage</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          <p><strong>Si aucun token n'est enregistré :</strong></p>
          <ol className="list-decimal list-inside space-y-1 ml-2">
            <li>Allez dans Menu profil → Notifications</li>
            <li>Cliquez sur "Activer"</li>
            <li>Autorisez les notifications dans le popup du navigateur</li>
            <li>Revenez ici et rechargez</li>
          </ol>
          
          <p className="mt-4"><strong>Si le token est présent mais les notifications ne marchent pas :</strong></p>
          <ol className="list-decimal list-inside space-y-1 ml-2">
            <li>Ouvrez la console du navigateur (F12)</li>
            <li>Regardez les erreurs dans l'onglet Console</li>
            <li>Vérifiez l'onglet Application → Service Workers</li>
            <li>Essayez de vous déconnecter et reconnecter</li>
          </ol>

          <p className="mt-4"><strong>Tester l'envoi depuis l'admin :</strong></p>
          <ol className="list-decimal list-inside space-y-1 ml-2">
            <li>Connectez-vous avec un compte admin</li>
            <li>Menu Maintenance → Envoyer notifications</li>
            <li>Sélectionnez "Sélection personnalisée"</li>
            <li>Cochez votre compte bénévole</li>
            <li>Envoyez un message de test</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}











