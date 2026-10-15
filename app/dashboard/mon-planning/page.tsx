'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeftIcon, PrinterIcon } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api/http';
import type { MissionClient } from '@/types';

const dayFormat = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
const timeFormat = new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' });

/** Planning personnel : grand format lisible, prêt à imprimer ou à enregistrer en PDF */
export default function MyPlanningPage() {
  const { user } = useAuth();
  const [missions, setMissions] = useState<MissionClient[] | null>(null);

  useEffect(() => {
    api<{ missions: MissionClient[] }>('/api/missions?scope=mine')
      .then((d) => setMissions(d.missions))
      .catch(() => setMissions([]));
  }, []);

  const days = useMemo(() => {
    const groups = new Map<string, MissionClient[]>();
    for (const mission of missions ?? []) {
      const key = mission.startDate ? dayFormat.format(mission.startDate) : 'Sans date précise';
      groups.set(key, [...(groups.get(key) ?? []), mission]);
    }
    return [...groups];
  }, [missions]);

  if (!user) return null;

  return (
    <div className="mx-auto max-w-3xl space-y-6 text-lg">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Button variant="outline" asChild>
          <Link href="/dashboard/missions?filter=my">
            <ArrowLeftIcon className="mr-2 h-4 w-4" /> Retour
          </Link>
        </Button>
        <Button onClick={() => window.print()} className="h-12 text-base">
          <PrinterIcon className="mr-2 h-5 w-5" /> Imprimer mon planning
        </Button>
      </div>

      <div>
        <h1 className="text-4xl font-semibold">Mon planning</h1>
        <p className="mt-1 text-muted-foreground">
          {user.firstName} {user.lastName} · Festival Films Courts de Dinan
        </p>
      </div>

      {missions === null ? (
        <p className="text-muted-foreground">Chargement…</p>
      ) : days.length === 0 ? (
        <p className="rounded-2xl border border-dashed p-8 text-center text-muted-foreground">
          Vous n’êtes inscrit(e) à aucune mission pour le moment.
        </p>
      ) : (
        days.map(([day, items]) => (
          <section key={day} className="break-inside-avoid space-y-3">
            <h2 className="rounded-xl bg-blue-900 px-4 py-2 text-xl font-semibold capitalize text-white print:bg-transparent print:px-0 print:text-black print:underline">
              {day}
            </h2>
            {items.map((m) => (
              <article key={m.id} className="break-inside-avoid rounded-2xl border bg-card p-4">
                <p className="text-2xl font-semibold">
                  {m.startDate ? timeFormat.format(m.startDate) : ''}
                  {m.endDate ? ` – ${timeFormat.format(m.endDate)}` : ''}
                </p>
                <p className="mt-1 text-xl font-medium">{m.title}</p>
                <p className="text-muted-foreground">
                  {m.category} · {m.location}
                </p>
              </article>
            ))}
          </section>
        ))
      )}
    </div>
  );
}
