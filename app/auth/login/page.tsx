import Link from 'next/link';
import { ClapperboardIcon, MailIcon, PhoneIcon } from 'lucide-react';
import { emailLoginEnabled } from '@/auth';
import { SUPPORT_PHONE } from '@/lib/server/magic-link-email';
import { TextSizeToggle } from '@/components/layouts/text-size-toggle';
import { signInWithEmail, signInWithGoogle } from './actions';

const ERROR_MESSAGES: Record<string, string> = {
  Verification: 'Ce lien a déjà servi ou a expiré. Pas de souci : demandez-en un nouveau ci-dessous.',
  InvalidEmail: 'Cette adresse email ne semble pas correcte. Vérifiez-la et réessayez.',
  EmailSendFailed: "Nous n'avons pas pu envoyer l'email. Réessayez dans un instant, ou appelez-nous.",
  TooManyRequests: 'Vous avez déjà demandé plusieurs liens. Patientez 10 minutes et regardez bien vos emails (et vos courriers indésirables) : le dernier lien reçu fonctionne.',
  AccessDenied: 'Accès refusé.',
};

function GoogleLogo() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden>
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
          className="absolute inset-0 bg-[radial-gradient(70%_60%_at_30%_20%,rgb(235_187_79/0.2),transparent_70%)]"
        />
        <Link href="/" className="relative flex items-center gap-2 text-lg font-semibold">
          <ClapperboardIcon className="h-6 w-6 text-gold-400" />
          Festival Films Courts de Dinan
        </Link>
        <div className="relative">
          <p className="font-display text-4xl font-semibold leading-tight">
            Chaque festival se fait <span className="text-gold-400">à plusieurs</span>.
          </p>
          <p className="mt-4 max-w-md text-lg text-blue-100">
            Retrouvez vos missions, vos créneaux et votre équipe pour faire de cette édition un grand moment.
          </p>
        </div>
        <p className="relative text-sm text-blue-200">Espace réservé aux bénévoles et à l’organisation.</p>
      </aside>

      {/* Formulaire : texte plus grand et parcours expliqué pas à pas */}
      <main className="flex items-center justify-center p-6">
        <div className="w-full max-w-md space-y-7 text-lg">
          <div className="lg:hidden">
            <Link href="/" className="flex items-center gap-2 font-semibold">
              <ClapperboardIcon className="h-5 w-5 text-gold-500" />
              Festival Films Courts de Dinan
            </Link>
          </div>

          <div className="flex justify-end">
            <TextSizeToggle />
          </div>

          <div>
            <h1 className="text-4xl font-semibold">Bienvenue</h1>
            <p className="mt-2 text-muted-foreground">Entrez dans votre espace bénévole. C’est simple.</p>
          </div>

          {errorMessage && (
            <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-base text-red-800">
              {errorMessage}
            </div>
          )}

          {emailLoginEnabled && (
            <section className="space-y-4 rounded-2xl border bg-card p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-gold-100 text-gold-700">
                  <MailIcon className="h-6 w-6" />
                </span>
                <h2 className="text-xl font-semibold leading-tight">Avec mon adresse email</h2>
              </div>
              <form action={signInWithEmail} className="space-y-3">
                <label htmlFor="email" className="block text-base font-medium">
                  Écrivez votre adresse email :
                </label>
                <input
                  id="email"
                  type="email"
                  name="email"
                  inputMode="email"
                  autoComplete="email"
                  autoCapitalize="none"
                  spellCheck={false}
                  placeholder="exemple@gmail.com"
                  required
                  className="h-14 w-full rounded-xl border border-input bg-background px-4 text-lg outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                />
                <button
                  type="submit"
                  className="h-14 w-full rounded-xl bg-gold-400 text-lg font-semibold text-blue-950 transition hover:bg-gold-300 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                >
                  Recevoir mon lien d’entrée
                </button>
              </form>
              <p className="text-base text-muted-foreground">
                Vous recevrez un email avec un gros bouton. Il suffit de cliquer dessus.{' '}
                <strong className="text-foreground">Pas de mot de passe à retenir.</strong>
              </p>
            </section>
          )}

          {emailLoginEnabled && (
            <div className="flex items-center gap-3 text-base text-muted-foreground">
              <span className="h-px flex-1 bg-border" />
              ou
              <span className="h-px flex-1 bg-border" />
            </div>
          )}

          <form action={signInWithGoogle}>
            <button
              type="submit"
              className="flex h-14 w-full items-center justify-center gap-3 rounded-xl border border-input bg-card text-lg font-medium transition hover:bg-accent focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
            >
              <GoogleLogo />
              Avec mon compte Google
            </button>
          </form>

          <div className="flex items-start gap-3 rounded-xl bg-gold-50 p-4 text-base">
            <PhoneIcon className="mt-0.5 h-5 w-5 shrink-0 text-gold-700" />
            <p>
              <strong>Besoin d’aide ?</strong> Appelez Jérôme au{' '}
              <a href={`tel:${SUPPORT_PHONE.replace(/\s/g, '')}`} className="font-semibold underline">
                {SUPPORT_PHONE}
              </a>
              .
            </p>
          </div>

          <p className="text-center text-sm text-muted-foreground">
            Première visite ? Votre compte est créé automatiquement. En continuant, vous acceptez les{' '}
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
