'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeftIcon, CalendarPlusIcon } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api/http';
import type { MissionCategoryClient } from '@/types';

const field =
  'h-12 w-full rounded-xl border border-input bg-background px-3 text-base outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50';
const label = 'mb-1 block text-sm font-medium';

const slotFormat = new Intl.DateTimeFormat('fr-FR', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
const hourFormat = new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' });

const toDate = (day: string, time: string) => new Date(`${day}T${time}:00`); // heure locale du navigateur

interface Slot {
  start: Date;
  end: Date;
}

/** Découpe chaque journée de la plage en créneaux de la durée voulue (0 = une seule plage par jour) */
function buildSlots(from: string, to: string, startTime: string, endTime: string, slotMinutes: number): { slots: Slot[]; error?: string } {
  if (!from || !to || !startTime || !endTime) return { slots: [] };
  if (to < from) return { slots: [], error: 'La date de fin est avant la date de début.' };
  if (endTime <= startTime) return { slots: [], error: "L'heure de fin doit être après l'heure de début." };

  const slots: Slot[] = [];
  const day = new Date(`${from}T00:00:00`);
  const last = new Date(`${to}T00:00:00`);
  while (day <= last && slots.length <= 100) {
    const iso = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`;
    const windowStart = toDate(iso, startTime);
    const windowEnd = toDate(iso, endTime);
    if (slotMinutes === 0) {
      slots.push({ start: windowStart, end: windowEnd });
    } else {
      for (let t = windowStart.getTime(); t < windowEnd.getTime(); t += slotMinutes * 60_000) {
        slots.push({ start: new Date(t), end: new Date(Math.min(t + slotMinutes * 60_000, windowEnd.getTime())) });
      }
    }
    day.setDate(day.getDate() + 1);
  }
  return { slots };
}

export default function SeriesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [categories, setCategories] = useState<MissionCategoryClient[]>([]);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: '',
    location: '',
    maxVolunteers: 2,
    from: '',
    to: '',
    startTime: '14:00',
    endTime: '18:00',
    slotMinutes: 0,
    publish: true,
  });
  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => setForm((f) => ({ ...f, [key]: value }));

  useEffect(() => {
    api<{ categories: MissionCategoryClient[] }>('/api/categories')
      .then((d) => setCategories(d.categories))
      .catch(() => {});
  }, []);

  const allowed = useMemo(
    () => (user?.role === 'admin' ? categories : categories.filter((c) => user?.responsibleForCategories?.includes(c.id))),
    [categories, user]
  );

  const { slots, error: slotError } = useMemo(
    () => buildSlots(form.from, form.to, form.startTime, form.endTime, form.slotMinutes),
    [form.from, form.to, form.startTime, form.endTime, form.slotMinutes]
  );
  const tooMany = slots.length > 100;

  if (!user) return null;
  if (user.role === 'volunteer') return <p className="p-6">Cette page est réservée aux responsables et à l’organisation.</p>;

  const canSubmit =
    !!form.title.trim() && !!form.description.trim() && !!form.category && !!form.location.trim() && slots.length > 0 && !tooMany && !slotError && !saving;

  const submit = async () => {
    setSaving(true);
    try {
      const data = await api<{ created: number }>('/api/missions/series', {
        method: 'POST',
        body: {
          title: form.title,
          description: form.description,
          category: form.category,
          location: form.location,
          maxVolunteers: Number(form.maxVolunteers),
          status: form.publish ? 'published' : 'draft',
          slots: slots.map((s) => ({ startDate: s.start.toISOString(), endDate: s.end.toISOString() })),
        },
      });
      toast.success(`${data.created} créneau(x) créé(s)`);
      router.push('/dashboard/missions');
    } catch (error: any) {
      toast.error(error.message || 'Création impossible');
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Button variant="ghost" asChild className="-ml-3">
        <Link href="/dashboard/missions">
          <ArrowLeftIcon className="mr-2 h-4 w-4" /> Retour aux missions
        </Link>
      </Button>

      <div>
        <h1 className="text-3xl font-semibold">Créer des créneaux en série</h1>
        <p className="mt-1 text-muted-foreground">
          Décrivez la mission une seule fois, choisissez les jours et les horaires : tous les créneaux sont créés d’un coup.
        </p>
      </div>

      <section className="space-y-4 rounded-2xl border bg-card p-5">
        <h2 className="text-lg font-semibold">1. La mission</h2>
        <div>
          <label className={label} htmlFor="title">Titre</label>
          <input id="title" className={field} value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="Accueil du public" />
        </div>
        <div>
          <label className={label} htmlFor="description">Description</label>
          <textarea
            id="description"
            rows={3}
            className={`${field} h-auto py-3`}
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
            placeholder="Accueillir, orienter et renseigner les spectateurs."
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={label} htmlFor="category">Catégorie</label>
            <select id="category" className={field} value={form.category} onChange={(e) => set('category', e.target.value)}>
              <option value="">Choisir…</option>
              {allowed.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={label} htmlFor="location">Lieu</label>
            <input id="location" className={field} value={form.location} onChange={(e) => set('location', e.target.value)} placeholder="Cinéma Les Korrigans" />
          </div>
        </div>
        <div className="max-w-[12rem]">
          <label className={label} htmlFor="max">Bénévoles par créneau</label>
          <input id="max" type="number" min={1} max={500} className={field} value={form.maxVolunteers} onChange={(e) => set('maxVolunteers', Number(e.target.value))} />
        </div>
      </section>

      <section className="space-y-4 rounded-2xl border bg-card p-5">
        <h2 className="text-lg font-semibold">2. Les jours et les horaires</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={label} htmlFor="from">Du</label>
            <input id="from" type="date" className={field} value={form.from} onChange={(e) => set('from', e.target.value)} />
          </div>
          <div>
            <label className={label} htmlFor="to">Au (inclus)</label>
            <input id="to" type="date" className={field} value={form.to} min={form.from} onChange={(e) => set('to', e.target.value)} />
          </div>
          <div>
            <label className={label} htmlFor="st">De</label>
            <input id="st" type="time" className={field} value={form.startTime} onChange={(e) => set('startTime', e.target.value)} />
          </div>
          <div>
            <label className={label} htmlFor="et">À</label>
            <input id="et" type="time" className={field} value={form.endTime} onChange={(e) => set('endTime', e.target.value)} />
          </div>
        </div>
        <div className="max-w-xs">
          <label className={label} htmlFor="len">Durée d’un créneau</label>
          <select id="len" className={field} value={form.slotMinutes} onChange={(e) => set('slotMinutes', Number(e.target.value))}>
            <option value={0}>Toute la plage horaire (un créneau par jour)</option>
            <option value={120}>2 heures</option>
            <option value={180}>3 heures</option>
            <option value={240}>4 heures</option>
          </select>
        </div>
      </section>

      <section className="space-y-3 rounded-2xl border bg-card p-5">
        <h2 className="text-lg font-semibold">3. Vérification</h2>
        {slotError && <p className="text-red-700">{slotError}</p>}
        {!slotError && slots.length === 0 && <p className="text-muted-foreground">Choisissez les dates pour voir les créneaux.</p>}
        {tooMany && <p className="text-red-700">Cela ferait plus de 100 créneaux : réduisez la période.</p>}
        {slots.length > 0 && !tooMany && (
          <>
            <p className="font-medium">
              {slots.length} créneau{slots.length > 1 ? 'x' : ''} seront créés, de {form.maxVolunteers} bénévole{form.maxVolunteers > 1 ? 's' : ''} chacun.
            </p>
            <ul className="max-h-56 space-y-1 overflow-auto rounded-lg bg-muted/50 p-3 text-sm">
              {slots.map((s) => (
                <li key={s.start.getTime()}>
                  {slotFormat.format(s.start)} – {hourFormat.format(s.end)}
                </li>
              ))}
            </ul>
          </>
        )}
        <label className="flex items-start gap-3 text-base">
          <input type="checkbox" className="mt-1 h-5 w-5" checked={form.publish} onChange={(e) => set('publish', e.target.checked)} />
          <span>
            Publier tout de suite
            <span className="block text-sm text-muted-foreground">Sinon, les créneaux restent en brouillon, invisibles des bénévoles.</span>
          </span>
        </label>
        <Button onClick={submit} disabled={!canSubmit} className="h-12 text-base">
          <CalendarPlusIcon className="mr-2 h-5 w-5" />
          {saving ? 'Création…' : `Créer ${slots.length > 0 && !tooMany ? slots.length : ''} créneau${slots.length > 1 ? 'x' : ''}`}
        </Button>
      </section>
    </div>
  );
}
