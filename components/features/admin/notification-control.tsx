'use client';

import { useCallback, useEffect, useState } from 'react';
import { BellIcon, BellOffIcon, Loader2, MailCheckIcon, SendIcon } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api/http';

interface PendingState {
  paused: boolean;
  volunteers: number;
  assignments: number;
}

const plural = (n: number, one: string, many: string) => `${n} ${n > 1 ? many : one}`;

/**
 * Interrupteur « suspendre les notifications aux bénévoles » + envoi groupé de ce qui a été retenu.
 * Le changement s'applique immédiatement (pas de bouton « sauvegarder ») et se confirme à l'écran.
 */
export function NotificationControl() {
  const [state, setState] = useState<PendingState | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);

  const load = useCallback(async () => {
    try {
      setState(await api<PendingState>('/api/notifications/pending'));
      setLoadError(false);
    } catch {
      setLoadError(true);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const setPaused = async (paused: boolean) => {
    if (!state) return;
    if (!paused) {
      const ok = window.confirm(
        'Réactiver les notifications ?\n\n' +
          'À partir de maintenant, chaque affectation préviendra le bénévole tout de suite (notification et email).\n\n' +
          (state.volunteers > 0
            ? `Les ${plural(state.volunteers, 'bénévole', 'bénévoles')} déjà en attente ne seront PAS prévenus automatiquement : utilisez le bouton « Envoyer les récapitulatifs ».`
            : 'Aucun bénévole n’est en attente.')
      );
      if (!ok) return;
    }
    setSaving(true);
    const previous = state;
    setState({ ...state, paused }); // affichage immédiat, annulé en cas d'échec
    try {
      await api('/api/settings', { method: 'PUT', body: { notificationsPaused: paused } });
      toast.success(paused ? 'Notifications suspendues : rien ne part vers les bénévoles' : 'Notifications réactivées');
      await load();
    } catch (error: any) {
      setState(previous);
      toast.error(error.message || 'Le réglage n’a pas pu être enregistré');
    } finally {
      setSaving(false);
    }
  };

  const sendSample = async () => {
    try {
      const r = await api<{ to: string; name: string; missions: number }>('/api/notifications/pending', {
        method: 'POST',
        body: { action: 'sample' },
      });
      toast.success(`Exemple envoyé à ${r.to} (récapitulatif de ${r.name}, ${plural(r.missions, 'mission', 'missions')})`);
    } catch (error: any) {
      toast.error(error.message || 'Envoi de l’exemple impossible');
    }
  };

  const sendAll = async () => {
    if (!state || state.volunteers === 0) return;
    const ok = window.confirm(
      `Envoyer son récapitulatif à ${plural(state.volunteers, 'bénévole', 'bénévoles')} ?\n\n` +
        'Chacun reçoit UN email avec toutes ses missions (date, heure, lieu) et une notification dans l’application.\n\n' +
        'Cette action ne peut pas être annulée.'
    );
    if (!ok) return;

    setSending(true);
    const total = state.volunteers;
    let done = 0;
    let failed = 0;
    setProgress({ done: 0, total });
    try {
      // Lots de 10 : reste sous les limites de temps et d'envoi ; un échec est retenté sans doublon
      for (let guard = 0; guard < 100; guard++) {
        const r = await api<{ sent: number; failed: number; remaining: number }>('/api/notifications/pending', {
          method: 'POST',
          body: { action: 'send', limit: 10 },
        });
        done += r.sent;
        failed = r.failed;
        setProgress({ done, total });
        if (r.remaining === 0 || r.sent === 0) break;
      }
      if (failed > 0) toast.warning(`${plural(done, 'bénévole prévenu', 'bénévoles prévenus')} ; ${failed} en échec, relancez l’envoi`);
      else toast.success(`${plural(done, 'bénévole prévenu', 'bénévoles prévenus')}`);
    } catch (error: any) {
      toast.error(error.message || 'Envoi interrompu : relancez pour continuer, personne ne recevra de doublon');
    } finally {
      setSending(false);
      setProgress(null);
      await load();
    }
  };

  if (!state) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-10">
          {loadError ? (
            <p className="text-sm text-red-600">Impossible de charger l’état des notifications.</p>
          ) : (
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          )}
        </CardContent>
      </Card>
    );
  }

  const { paused } = state;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {paused ? <BellOffIcon className="h-5 w-5 text-amber-600" /> : <BellIcon className="h-5 w-5 text-green-600" />}
          Notifications aux bénévoles
        </CardTitle>
        <CardDescription>
          Suspendez les messages le temps d’affecter tout le monde, puis prévenez chacun d’un seul coup quand vous êtes sûr(e)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div
          className={`flex items-center justify-between rounded-lg border-2 p-4 transition-all ${
            paused ? 'border-amber-300 bg-amber-50' : 'border-gray-300 bg-white'
          }`}
        >
          <div className="flex-1">
            <Label htmlFor="pause-notifications" className="text-base font-semibold">
              Suspendre les notifications aux bénévoles
            </Label>
            <p className="mt-1 text-sm text-gray-600">
              Tant que c’est activé, rien n’est envoyé (ni notification, ni email) quand vous affectez ou retirez un bénévole, quand une
              place se libère, quand un bénévole s’inscrit, ni pour les rappels de la veille.
            </p>
          </div>
          <div className="ml-4 flex flex-col items-center gap-1">
            <Switch
              id="pause-notifications"
              checked={paused}
              disabled={saving || sending}
              onCheckedChange={setPaused}
              className="data-[state=checked]:bg-amber-600"
            />
            <span className={`text-xs font-medium ${paused ? 'text-amber-700' : 'text-gray-500'}`}>
              {paused ? 'En pause' : 'Actives'}
            </span>
          </div>
        </div>

        <div className="space-y-3 rounded-lg border p-4">
          <div>
            <p className="text-base font-semibold">Bénévoles pas encore prévenus</p>
            {state.volunteers > 0 ? (
              <p className="mt-1 text-sm text-gray-600">
                <strong>{plural(state.volunteers, 'bénévole', 'bénévoles')}</strong> ({plural(state.assignments, 'affectation', 'affectations')})
                {state.volunteers > 1 ? 'n’ont' : 'n’a'} pas encore reçu de message. Chacun recevra{' '}
                <strong>un seul email</strong> avec toutes ses missions à jour ; les nouvelles y sont signalées.
              </p>
            ) : (
              <p className="mt-1 text-sm text-gray-600">Tout le monde est à jour : personne n’est en attente d’un message.</p>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={sendSample} disabled={state.volunteers === 0 || sending}>
              <MailCheckIcon className="mr-2 h-4 w-4" />
              M’envoyer un exemple
            </Button>
            <Button onClick={sendAll} disabled={state.volunteers === 0 || sending}>
              {sending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <SendIcon className="mr-2 h-4 w-4" />}
              Envoyer les récapitulatifs
            </Button>
          </div>

          {progress && (
            <div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div className="h-full bg-gold-500 transition-all" style={{ width: `${(progress.done / progress.total) * 100}%` }} />
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                Envoi : {progress.done} / {progress.total}
              </p>
            </div>
          )}
          <p className="text-xs text-gray-500">
            L’exemple est envoyé uniquement à votre adresse, sans rien marquer comme envoyé : vous pouvez le relire avant d’écrire à tout le monde.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
