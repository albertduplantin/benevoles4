import Link from 'next/link';
import { ClapperboardIcon } from 'lucide-react';
import { emailLoginEnabled } from '@/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { signInWithEmail, signInWithGoogle } from './actions';

const ERROR_MESSAGES: Record<string, string> = {
  Verification: 'Ce lien de connexion a expiré ou a déjà été utilisé. Demandez-en un nouveau.',
  AccessDenied: 'Accès refusé.',
};

function GoogleLogo() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z" />
    </svg>
  );
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const errorMessage = error ? ERROR_MESSAGES[error] ?? 'La connexion a échoué. Réessayez.' : null;

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Panneau de marque */}
      <aside className="relative hidden overflow-hidden bg-blue-950 text-white lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div
          aria-hidden
          className="absolute inset-0 bg-[radial-gradient(70%_60%_at_30%_20%,oklch(0.5_0.2_285/0.5),transparent_70%)]"
        />
        <Link href="/" className="relative flex items-center gap-2 text-lg font-semibold">
          <ClapperboardIcon className="h-6 w-6 text-gold-400" />
          Festival Films Courts de Dinan
        </Link>
        <div className="relative">
          <p className="font-display text-4xl font-semibold leading-tight">
            Chaque festival se fait <span className="text-gold-400">à plusieurs</span>.
          </p>
          <p className="mt-4 max-w-md text-blue-100">
            Retrouvez vos missions, vos créneaux et votre équipe pour faire de cette édition un grand moment.
          </p>
        </div>
        <p className="relative text-sm text-blue-200">Espace réservé aux bénévoles et à l’organisation.</p>
      </aside>

      {/* Formulaire */}
      <main className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm space-y-6">
          <div className="lg:hidden">
            <Link href="/" className="flex items-center gap-2 font-semibold text-blue-900">
              <ClapperboardIcon className="h-5 w-5 text-gold-500" />
              Festival Films Courts de Dinan
            </Link>
          </div>

          <div>
            <h1 className="text-3xl font-semibold">Bienvenue</h1>
            <p className="mt-2 text-muted-foreground">Connectez-vous pour accéder à vos missions.</p>
          </div>

          {errorMessage && (
            <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {errorMessage}
            </div>
          )}

          <form action={signInWithGoogle}>
            <Button type="submit" variant="outline" className="h-12 w-full gap-3 text-base">
              <GoogleLogo />
              Continuer avec Google
            </Button>
          </form>

          {emailLoginEnabled && (
            <>
              <div className="flex items-center gap-3 text-xs uppercase text-muted-foreground">
                <span className="h-px flex-1 bg-border" />
                ou
                <span className="h-px flex-1 bg-border" />
              </div>
              <form action={signInWithEmail} className="space-y-3">
                <Input type="email" name="email" placeholder="votre@email.fr" required className="h-12" />
                <Button type="submit" className="h-12 w-full text-base">
                  Recevoir un lien de connexion
                </Button>
              </form>
            </>
          )}

          <p className="text-center text-xs text-muted-foreground">
            Première visite ? Votre compte est créé à la première connexion. En continuant, vous acceptez les{' '}
            <Link href="/legal/terms" className="underline">
              conditions
            </Link>{' '}
            et la{' '}
            <Link href="/legal/privacy" className="underline">
              politique de confidentialité
            </Link>
            .
          </p>
        </div>
      </main>
    </div>
  );
}
