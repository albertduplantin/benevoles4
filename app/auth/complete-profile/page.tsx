'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ClapperboardIcon, PhoneIcon } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const completeProfileSchema = z.object({
  firstName: z.string().trim().min(2, 'Merci d’écrire votre prénom'),
  lastName: z.string().trim().min(2, 'Merci d’écrire votre nom'),
  phone: z
    .string()
    .regex(
      /^(?:(?:\+|00)33|0)\s*[1-9](?:[\s.-]*\d{2}){4}$/,
      'Ce numéro ne semble pas correct. Exemple : 06 12 34 56 78'
    ),
});

type CompleteProfileInput = z.infer<typeof completeProfileSchema>;

/** Met en forme un numéro français pendant la saisie : 0612345678 -> 06 12 34 56 78 */
function formatPhoneNumber(value: string): string {
  let digits = value.replace(/\D/g, '');
  // +33 6 12... ou 0033 6 12... -> 06 12...
  if (digits.startsWith('0033')) digits = '0' + digits.slice(4);
  else if (digits.startsWith('33') && digits.length > 9) digits = '0' + digits.slice(2);
  return digits.slice(0, 10).match(/.{1,2}/g)?.join(' ') ?? digits;
}

const inputClass =
  'h-14 w-full rounded-xl border border-input bg-background px-4 text-lg outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:opacity-60';

export default function CompleteProfilePage() {
  const { user, email, isProfileComplete, loading, refreshUser } = useAuth();
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<CompleteProfileInput>({ resolver: zodResolver(completeProfileSchema) });

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.push('/auth/login');
      return;
    }
    // Pré-remplissage : profil existant, sinon nom du compte Google ("Prénom Nom")
    const [googleFirst = '', ...googleRest] = (user.name || '').trim().split(/\s+/);
    const first = user.firstName || googleFirst;
    const last = user.lastName || googleRest.join(' ');
    if (first) setValue('firstName', first);
    if (last) setValue('lastName', last);
    if (user.phone) setValue('phone', formatPhoneNumber(user.phone));
  }, [loading, user, setValue, router]);

  // Profil déjà complet : inutile de rester ici
  useEffect(() => {
    if (!loading && isProfileComplete) router.push('/dashboard/missions');
  }, [loading, isProfileComplete, router]);

  const onSubmit = async (data: CompleteProfileInput) => {
    if (!user) return;
    setSaving(true);
    setError(null);
    try {
      const response = await fetch('/api/users/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error("Nous n'avons pas pu enregistrer vos informations. Vérifiez-les et réessayez.");
      }
      await refreshUser();
      router.push('/dashboard/missions');
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue. Réessayez dans un instant.');
      setSaving(false);
    }
  };

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-gold-400 border-t-transparent" />
      </div>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-md space-y-7 text-lg">
        <div className="flex items-center gap-2 font-semibold">
          <ClapperboardIcon className="h-5 w-5 text-gold-500" />
          Festival Films Courts de Dinan
        </div>

        <div>
          <h1 className="text-4xl font-semibold">Une dernière étape</h1>
          <p className="mt-2 text-muted-foreground">
            Pour que les responsables puissent vous joindre, dites-nous qui vous êtes.
          </p>
          {email && <p className="mt-2 text-base text-muted-foreground">Connecté avec : {email}</p>}
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
          <div className="space-y-2">
            <label htmlFor="firstName" className="block text-base font-medium">
              Votre prénom
            </label>
            <input
              id="firstName"
              autoComplete="given-name"
              placeholder="Marie"
              disabled={saving}
              className={inputClass}
              {...register('firstName')}
            />
            {errors.firstName && <p className="text-base text-red-700">{errors.firstName.message}</p>}
          </div>

          <div className="space-y-2">
            <label htmlFor="lastName" className="block text-base font-medium">
              Votre nom
            </label>
            <input
              id="lastName"
              autoComplete="family-name"
              placeholder="Dupont"
              disabled={saving}
              className={inputClass}
              {...register('lastName')}
            />
            {errors.lastName && <p className="text-base text-red-700">{errors.lastName.message}</p>}
          </div>

          <div className="space-y-2">
            <label htmlFor="phone" className="block text-base font-medium">
              Votre numéro de téléphone
            </label>
            <input
              id="phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="06 12 34 56 78"
              disabled={saving}
              className={inputClass}
              {...register('phone', {
                onChange: (e) => setValue('phone', formatPhoneNumber(e.target.value)),
              })}
            />
            {errors.phone && <p className="text-base text-red-700">{errors.phone.message}</p>}
            <p className="flex items-start gap-2 text-base text-muted-foreground">
              <PhoneIcon className="mt-0.5 h-4 w-4 shrink-0" />
              Il ne sert qu’à vous prévenir en cas de changement le jour du festival.
            </p>
          </div>

          {error && (
            <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-base text-red-800">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={saving}
            className="h-14 w-full rounded-xl bg-gold-400 text-lg font-semibold text-blue-950 transition hover:bg-gold-300 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:opacity-60"
          >
            {saving ? 'Enregistrement…' : 'Continuer'}
          </button>

          <p className="text-center text-sm text-muted-foreground">
            En continuant, vous acceptez notre{' '}
            <Link href="/legal/privacy" className="underline">
              politique de confidentialité
            </Link>
            .
          </p>
        </form>
      </div>
    </main>
  );
}
