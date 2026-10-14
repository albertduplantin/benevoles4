'use client';

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  CheckCircle2Icon,
  ClockIcon,
  FlameIcon,
  HourglassIcon,
  MapPinIcon,
  PlusIcon,
  SearchIcon,
  UsersIcon,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { api } from '@/lib/api/http';
import type { MissionClient } from '@/types';

const dayFormat = new Intl.DateTimeFormat('fr-FR', { day: 'numeric' });
const monthFormat = new Intl.DateTimeFormat('fr-FR', { month: 'short' });
const weekdayFormat = new Intl.DateTimeFormat('fr-FR', { weekday: 'short' });
const timeFormat = new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' });

/** Teinte stable par catégorie : une même catégorie garde toujours la même couleur */
function categoryHue(category: string): number {
  let hash = 0;
  for (const char of category) hash = (hash * 31 + char.charCodeAt(0)) % 360;
  return hash;
}

function DateBlock({ date }: { date: Date | undefined }) {
  if (!date) {
    return (
      <div className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-xl bg-blue-50 text-blue-700">
        <ClockIcon className="h-5 w-5" />
        <span className="mt-1 text-[10px] font-medium uppercase">Continue</span>
      </div>
    );
  }
  return (
    <div className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-xl bg-blue-900 text-white">
      <span className="text-[10px] font-medium uppercase tracking-wide text-gold-300">{weekdayFormat.format(date)}</span>
      <span className="text-2xl font-semibold leading-none">{dayFormat.format(date)}</span>
      <span className="text-[10px] uppercase text-blue-200">{monthFormat.format(date)}</span>
    </div>
  );
}

function MissionsContent() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const onlyMine = params.get('filter') === 'my';

  const [missions, setMissions] = useState<MissionClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [category, setCategory] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  const fetchMissions = useCallback(async () => {
    try {
      const { missions } = await api<{ missions: MissionClient[] }>(
        `/api/missions?scope=${onlyMine ? 'mine' : 'visible'}`
      );
      setMissions(missions);
    } catch {
      toast.error('Erreur lors du chargement des missions');
    } finally {
      setLoading(false);
    }
  }, [onlyMine]);

  useEffect(() => {
    setLoading(true);
    fetchMissions();
  }, [fetchMissions]);

  const act = async (missionId: string, fn: () => Promise<string | void>) => {
    setBusyId(missionId);
    try {
      const message = await fn();
      if (message) toast.success(message);
      await fetchMissions();
    } catch (error: any) {
      toast.error(error.message || 'Une erreur est survenue');
    } finally {
      setBusyId(null);
    }
  };

  const register = (id: string) =>
    act(id, async () => {
      const data = await api<{ onWaitlist: boolean }>(`/api/missions/${id}/register`, { method: 'POST' });
      return data.onWaitlist ? "Ajouté à la liste d'attente" : 'Inscription confirmée, merci !';
    });

  const unregister = (id: string, fromWaitlist: boolean) =>
    act(id, async () => {
      await api(`/api/missions/${id}/register${fromWaitlist ? '?waitlist=true' : ''}`, { method: 'DELETE' });
      return fromWaitlist ? "Retiré de la liste d'attente" : 'Désinscription effectuée';
    });

  const userId: string | undefined = user?.id;
  const categories = useMemo(() => [...new Set(missions.map((m) => m.category))].sort(), [missions]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return missions.filter(
      (m) =>
        (!category || m.category === category) &&
        (!q || `${m.title} ${m.location} ${m.category}`.toLowerCase().includes(q))
    );
  }, [missions, category, query]);

  if (!user) return null;
  const canCreate = user.role === 'admin' || user.role === 'category_responsible';

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">{onlyMine ? 'Mes missions' : 'Missions du festival'}</h1>
          <p className="mt-1 text-muted-foreground">
            {onlyMine ? 'Vos créneaux et vos listes d’attente.' : 'Choisissez vos missions et inscrivez-vous en un clic.'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant={onlyMine ? 'default' : 'outline'} onClick={() => router.push(onlyMine ? '/dashboard/missions' : '/dashboard/missions?filter=my')}>
            <CheckCircle2Icon className="mr-2 h-4 w-4" />
            Mes missions
          </Button>
          {canCreate && (
            <Button asChild className="bg-gold-400 text-blue-950 hover:bg-gold-300">
              <Link href="/dashboard/missions/new">
                <PlusIcon className="mr-2 h-4 w-4" />
                Créer une mission
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Recherche + catégories */}
      <div className="space-y-3">
        <div className="relative">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher une mission, un lieu…"
            className="h-11 bg-card pl-9"
            aria-label="Rechercher une mission"
          />
        </div>
        {categories.length > 1 && (
          <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1" role="tablist" aria-label="Catégories">
            {[null, ...categories].map((c) => {
              const active = c === category;
              return (
                <button
                  key={c ?? 'all'}
                  role="tab"
                  aria-selected={active}
                  onClick={() => setCategory(c)}
                  className={`shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium transition ${
                    active ? 'border-blue-900 bg-blue-900 text-white' : 'bg-card text-foreground hover:bg-blue-50'
                  }`}
                >
                  {c ?? 'Toutes'}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-60 animate-pulse rounded-2xl border bg-card" />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <div className="rounded-2xl border border-dashed bg-card py-16 text-center">
          <p className="text-lg font-semibold">{missions.length === 0 ? 'Aucune mission pour le moment' : 'Aucun résultat'}</p>
          <p className="mt-1 text-muted-foreground">
            {missions.length === 0 ? 'Les missions seront bientôt publiées. Revenez vite !' : 'Essayez une autre catégorie ou un autre mot.'}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {visible.map((mission) => {
            const registered = !!userId && mission.volunteers.includes(userId);
            const waiting = !!userId && (mission.waitlist ?? []).includes(userId);
            const taken = mission.volunteers.length;
            const full = mission.status === 'full' || taken >= mission.maxVolunteers;
            const pct = Math.min(100, Math.round((taken / mission.maxVolunteers) * 100));
            const hue = categoryHue(mission.category);
            const busy = busyId === mission.id;

            return (
              <article
                key={mission.id}
                className={`flex flex-col overflow-hidden rounded-2xl border bg-card shadow-sm transition hover:shadow-md ${
                  registered ? 'ring-2 ring-green-500' : ''
                }`}
              >
                <div className="h-1.5" style={{ backgroundColor: `hsl(${hue} 65% 50%)` }} />
                <div className="flex flex-1 flex-col gap-4 p-5">
                  <div className="flex gap-4">
                    <DateBlock date={mission.startDate} />
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex flex-wrap items-center gap-2">
                        <span
                          className="rounded-full px-2.5 py-0.5 text-xs font-medium"
                          style={{ backgroundColor: `hsl(${hue} 70% 94%)`, color: `hsl(${hue} 60% 28%)` }}
                        >
                          {mission.category}
                        </span>
                        {mission.isUrgent && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-700">
                            <FlameIcon className="h-3 w-3" /> Urgent
                          </span>
                        )}
                      </div>
                      <Link href={`/dashboard/missions/${mission.id}`} className="block">
                        <h2 className="line-clamp-2 text-lg font-semibold leading-snug hover:underline">{mission.title}</h2>
                      </Link>
                    </div>
                  </div>

                  <ul className="space-y-1.5 text-sm text-muted-foreground">
                    {mission.startDate && (
                      <li className="flex items-center gap-2">
                        <ClockIcon className="h-4 w-4 shrink-0" />
                        {timeFormat.format(mission.startDate)}
                        {mission.endDate && ` – ${timeFormat.format(mission.endDate)}`}
                      </li>
                    )}
                    <li className="flex items-center gap-2">
                      <MapPinIcon className="h-4 w-4 shrink-0" />
                      <span className="truncate">{mission.location}</span>
                    </li>
                  </ul>

                  <div className="mt-auto space-y-3">
                    <div>
                      <div className="mb-1 flex items-center justify-between text-xs">
                        <span className="inline-flex items-center gap-1 text-muted-foreground">
                          <UsersIcon className="h-3.5 w-3.5" />
                          {taken} / {mission.maxVolunteers} bénévoles
                        </span>
                        <span className={full ? 'font-semibold text-red-600' : 'text-muted-foreground'}>
                          {full ? 'Complet' : `${mission.maxVolunteers - taken} place${mission.maxVolunteers - taken > 1 ? 's' : ''}`}
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
                        <div
                          className={`h-full rounded-full transition-all ${full ? 'bg-red-500' : pct >= 70 ? 'bg-gold-500' : 'bg-green-500'}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>

                    {registered ? (
                      <Button variant="outline" className="h-11 w-full border-green-500 text-green-700" disabled={busy} onClick={() => unregister(mission.id, false)}>
                        <CheckCircle2Icon className="mr-2 h-4 w-4" />
                        Inscrit · Me désinscrire
                      </Button>
                    ) : waiting ? (
                      <Button variant="outline" className="h-11 w-full border-gold-500 text-gold-700" disabled={busy} onClick={() => unregister(mission.id, true)}>
                        <HourglassIcon className="mr-2 h-4 w-4" />
                        En attente · Me retirer
                      </Button>
                    ) : full ? (
                      <Button variant="secondary" className="h-11 w-full" disabled={busy} onClick={() => register(mission.id)}>
                        <HourglassIcon className="mr-2 h-4 w-4" />
                        Rejoindre la liste d’attente
                      </Button>
                    ) : (
                      <Button className="h-11 w-full text-base" disabled={busy} onClick={() => register(mission.id)}>
                        {busy ? 'Inscription…' : 'Je m’inscris'}
                      </Button>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function MissionsPage() {
  return (
    <Suspense fallback={null}>
      <MissionsContent />
    </Suspense>
  );
}
