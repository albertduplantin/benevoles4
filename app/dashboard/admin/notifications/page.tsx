'use client';

import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { isProfileComplete } from '@/lib/api/users';
import { getAllVolunteers } from '@/lib/api/users';
import { getGroupedCategories } from '@/lib/api/categories';
import { UserClient, MissionCategoryClient, NotificationType } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { Loader2, BellIcon, SendIcon } from 'lucide-react';
import { sendBroadcastNotification, sendNotification } from '@/lib/notifications/send';

export default function AdminNotificationsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  
  const [volunteers, setVolunteers] = useState<UserClient[]>([]);
  const [categories, setCategories] = useState<MissionCategoryClient[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isSending, setIsSending] = useState(false);
  
  // Formulaire
  const [targetType, setTargetType] = useState<'all' | 'role' | 'category' | 'custom'>('all');
  const [targetRole, setTargetRole] = useState<string>('volunteer');
  const [targetCategory, setTargetCategory] = useState<string>('');
  const [selectedVolunteers, setSelectedVolunteers] = useState<string[]>([]);
  const [notificationType, setNotificationType] = useState<NotificationType>('general_announcement');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [url, setUrl] = useState('');

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login');
    } else if (!loading && user && !isProfileComplete(user)) {
      router.push('/auth/complete-profile');
    } else if (!loading && user && user.role !== 'admin') {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  // Charger les données
  useEffect(() => {
    const loadData = async () => {
      if (!user || user.role !== 'admin') return;
      
      try {
        setIsLoadingData(true);
        
        const [volunteersData, groupedCategories] = await Promise.all([
          getAllVolunteers(),
          getGroupedCategories(),
        ]);
        
        setVolunteers(volunteersData);
        setCategories(groupedCategories.flatMap(g => g.categories));
      } catch (error) {
        console.error('Error loading data:', error);
        toast.error('Erreur lors du chargement des données');
      } finally {
        setIsLoadingData(false);
      }
    };

    loadData();
  }, [user]);

  const handleSend = async () => {
    if (!title.trim() || !message.trim()) {
      toast.error('Veuillez remplir le titre et le message');
      return;
    }

    try {
      setIsSending(true);

      const payload = {
        type: notificationType,
        title: title.trim(),
        body: message.trim(),
        url: url.trim() || undefined,
      };

      let success = false;

      if (targetType === 'custom') {
        // Envoi à des utilisateurs spécifiques
        if (selectedVolunteers.length === 0) {
          toast.error('Veuillez sélectionner au moins un bénévole');
          return;
        }
        success = await sendNotification(selectedVolunteers, payload);
        if (success) {
          toast.success(`Notification envoyée à ${selectedVolunteers.length} bénévole(s)`);
        }
      } else if (targetType === 'role') {
        // Envoi par rôle
        success = await sendBroadcastNotification('role', payload, targetRole);
        if (success) {
          toast.success(`Notification envoyée à tous les ${targetRole === 'volunteer' ? 'bénévoles' : targetRole === 'category_responsible' ? 'responsables de catégorie' : 'admins'}`);
        }
      } else if (targetType === 'category') {
        // Envoi par catégorie
        if (!targetCategory) {
          toast.error('Veuillez sélectionner une catégorie');
          return;
        }
        success = await sendBroadcastNotification('category', payload, targetCategory);
        if (success) {
          toast.success('Notification envoyée aux responsables de la catégorie');
        }
      } else {
        // Envoi à tous
        success = await sendBroadcastNotification('all', payload);
        if (success) {
          toast.success('Notification envoyée à tous les utilisateurs');
        }
      }

      if (success) {
        // Réinitialiser le formulaire
        setTitle('');
        setMessage('');
        setUrl('');
        setSelectedVolunteers([]);
      } else {
        toast.error('Erreur lors de l\'envoi de la notification');
      }
    } catch (error) {
      console.error('Error sending notification:', error);
      toast.error('Erreur lors de l\'envoi de la notification');
    } finally {
      setIsSending(false);
    }
  };

  if (loading || isLoadingData || !user || user.role !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          <BellIcon className="h-8 w-8" />
          Envoyer des Notifications
        </h1>
        <p className="text-muted-foreground">
          Envoyer des notifications push aux bénévoles
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Nouvelle notification</CardTitle>
          <CardDescription>
            Les notifications seront envoyées uniquement aux utilisateurs qui ont activé les notifications push
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Type de notification */}
          <div className="space-y-2">
            <Label>Type de notification</Label>
            <Select value={notificationType} onValueChange={(v) => setNotificationType(v as NotificationType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="general_announcement">📢 Annonce générale</SelectItem>
                <SelectItem value="category_message">💬 Message de catégorie</SelectItem>
                <SelectItem value="mission_update">⚠️ Mise à jour de mission</SelectItem>
                <SelectItem value="mission_reminder">🔔 Rappel de mission</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Destinataires */}
          <div className="space-y-2">
            <Label>Destinataires</Label>
            <Select value={targetType} onValueChange={(v) => setTargetType(v as any)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les utilisateurs</SelectItem>
                <SelectItem value="role">Par rôle</SelectItem>
                <SelectItem value="category">Par catégorie</SelectItem>
                <SelectItem value="custom">Sélection personnalisée</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Sélection du rôle */}
          {targetType === 'role' && (
            <div className="space-y-2">
              <Label>Rôle</Label>
              <Select value={targetRole} onValueChange={setTargetRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="volunteer">Bénévoles</SelectItem>
                  <SelectItem value="category_responsible">Responsables de catégorie</SelectItem>
                  <SelectItem value="admin">Administrateurs</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Sélection de la catégorie */}
          {targetType === 'category' && (
            <div className="space-y-2">
              <Label>Catégorie</Label>
              <Select value={targetCategory} onValueChange={setTargetCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Choisir une catégorie" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Sélection personnalisée */}
          {targetType === 'custom' && (
            <div className="space-y-2">
              <Label>Bénévoles ({selectedVolunteers.length} sélectionné(s))</Label>
              <div className="border rounded-lg p-3 max-h-48 overflow-y-auto space-y-2">
                {volunteers.map((volunteer) => (
                  <div key={volunteer.uid} className="flex items-center gap-2">
                    <Checkbox
                      id={`vol-${volunteer.uid}`}
                      checked={selectedVolunteers.includes(volunteer.uid)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedVolunteers([...selectedVolunteers, volunteer.uid]);
                        } else {
                          setSelectedVolunteers(selectedVolunteers.filter(id => id !== volunteer.uid));
                        }
                      }}
                    />
                    <Label htmlFor={`vol-${volunteer.uid}`} className="text-sm cursor-pointer">
                      {volunteer.firstName} {volunteer.lastName} ({volunteer.email})
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Titre */}
          <div className="space-y-2">
            <Label htmlFor="title">Titre</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Titre de la notification"
              maxLength={50}
            />
            <p className="text-xs text-muted-foreground">{title.length}/50 caractères</p>
          </div>

          {/* Message */}
          <div className="space-y-2">
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Contenu de la notification"
              rows={4}
              maxLength={200}
            />
            <p className="text-xs text-muted-foreground">{message.length}/200 caractères</p>
          </div>

          {/* URL (optionnel) */}
          <div className="space-y-2">
            <Label htmlFor="url">Lien (optionnel)</Label>
            <Input
              id="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="/dashboard/missions/..."
            />
            <p className="text-xs text-muted-foreground">
              URL vers laquelle rediriger quand l'utilisateur clique sur la notification
            </p>
          </div>

          {/* Bouton d'envoi */}
          <Button
            onClick={handleSend}
            disabled={isSending || !title.trim() || !message.trim()}
            className="w-full"
            size="lg"
          >
            {isSending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Envoi en cours...
              </>
            ) : (
              <>
                <SendIcon className="h-4 w-4 mr-2" />
                Envoyer la notification
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">📌 Informations</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          <p>• Les notifications sont envoyées uniquement aux utilisateurs ayant activé les notifications push</p>
          <p>• Les utilisateurs peuvent gérer leurs préférences de notification dans leur profil</p>
          <p>• Les notifications sont également envoyées par email si configuré</p>
          <p>• Le système nettoie automatiquement les tokens invalides</p>
        </CardContent>
      </Card>
    </div>
  );
}











