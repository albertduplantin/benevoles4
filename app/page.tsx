'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowRightIcon, CalendarCheckIcon, ClapperboardIcon, HeartHandshakeIcon, UsersIcon } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const HIGHLIGHTS = [
  {
    icon: ClapperboardIcon,
    title: 'Choisissez vos missions',
    text: "Accueil, bar, technique, communication : trouvez ce qui vous ressemble et s'adapte à vos disponibilités.",
  },
  {
    icon: CalendarCheckIcon,
    title: 'Votre planning en un coup d’œil',
    text: 'Retrouvez vos créneaux, ajoutez-les à votre agenda et gardez le fil, même depuis votre téléphone.',
  },
  {
    icon: UsersIcon,
    title: 'Une équipe, pas une liste',
    text: 'Vos responsables de catégorie vous accompagnent et vous prévenez en un clic si quelque chose change.',
  },
];

export default function Home() {
  const { user, loading, isProfileComplete } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading || !user) return;
    router.push(isProfileComplete ? '/dashboard/missions' : '/auth/complete-profile');
  }, [loading, user, isProfileComplete, router]);

  if (loading || user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-blue-950">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-gold-400 border-t-transparent" />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      {/* Hero : écran de projection */}
      <section className="relative overflow-hidden bg-blue-950 text-white">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_0%,oklch(0.5_0.2_285/0.55),transparent_70%)]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-gold-400/60 to-transparent"
        />
        <div className="relative mx-auto flex max-w-4xl flex-col items-center px-6 py-20 text-center sm:py-28">
          <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-gold-400/40 bg-gold-400/10 px-4 py-1.5 text-sm font-medium text-gold-300">
            <HeartHandshakeIcon className="h-4 w-4" />
            Espace des bénévoles
          </span>
          <h1 className="text-balance text-4xl font-semibold leading-tight sm:text-6xl">
            Festival Films Courts <span className="text-gold-400">de Dinan</span>
          </h1>
          <p className="mt-6 max-w-xl text-balance text-lg text-blue-100">
            Faites vivre le festival avec nous. Choisissez vos missions, suivez votre planning et retrouvez l’équipe, au même endroit.
          </p>
          <div className="mt-10 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <Link
              href="/auth/login"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-gold-400 px-8 text-base font-semibold text-blue-950 shadow-lg shadow-gold-400/20 transition hover:bg-gold-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-300 focus-visible:ring-offset-2 focus-visible:ring-offset-blue-950"
            >
              Je rejoins l’équipe
              <ArrowRightIcon className="h-5 w-5" />
            </Link>
          </div>
          <p className="mt-4 text-sm text-blue-200">Connexion en un clic avec votre compte Google.</p>
        </div>
      </section>

      {/* Points clés */}
      <section className="mx-auto max-w-5xl px-6 py-16">
        <div className="grid gap-6 md:grid-cols-3">
          {HIGHLIGHTS.map(({ icon: Icon, title, text }) => (
            <div key={title} className="rounded-2xl border bg-card p-6 shadow-sm">
              <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gold-100 text-gold-700">
                <Icon className="h-6 w-6" />
              </div>
              <h2 className="text-lg font-semibold">{title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t py-8 text-center text-sm text-muted-foreground">
        <p>Festival Films Courts de Dinan</p>
        <p className="mt-2 space-x-4">
          <Link href="/legal/privacy" className="underline-offset-4 hover:underline">
            Confidentialité
          </Link>
          <Link href="/legal/terms" className="underline-offset-4 hover:underline">
            Conditions d’utilisation
          </Link>
        </p>
      </footer>
    </main>
  );
}
