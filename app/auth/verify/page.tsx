import Link from 'next/link';
import { MailCheckIcon, PhoneIcon } from 'lucide-react';
import { SUPPORT_PHONE } from '@/lib/server/magic-link-email';

const STEPS = [
  'Ouvrez votre messagerie (Gmail, Orange, Free, Outlook…).',
  'Cherchez un message du « Festival Films Courts de Dinan ».',
  'Cliquez sur le gros bouton doré « Entrer dans mon espace ».',
];

export default function VerifyRequestPage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-md space-y-7 text-lg">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gold-100 text-gold-700">
          <MailCheckIcon className="h-9 w-9" />
        </div>

        <div>
          <h1 className="text-4xl font-semibold">Regardez vos emails</h1>
          <p className="mt-2 text-muted-foreground">Nous venons de vous envoyer un message.</p>
        </div>

        <ol className="space-y-4">
          {STEPS.map((step, index) => (
            <li key={step} className="flex items-start gap-4">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-900 text-lg font-semibold text-gold-300">
                {index + 1}
              </span>
              <span className="pt-0.5">{step}</span>
            </li>
          ))}
        </ol>

        <div className="rounded-xl bg-gold-50 p-4 text-base">
          <p className="font-semibold">Vous ne voyez rien ?</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Regardez dans les « courriers indésirables » ou « spam ».</li>
            <li>Patientez une minute : parfois le message tarde un peu.</li>
          </ul>
          <p className="mt-3">
            <Link href="/auth/login" className="font-semibold underline">
              Recommencer avec une autre adresse
            </Link>
          </p>
        </div>

        <div className="flex items-start gap-3 text-base">
          <PhoneIcon className="mt-0.5 h-5 w-5 shrink-0 text-gold-700" />
          <p>
            Besoin d’aide ? Appelez Jérôme au <strong>{SUPPORT_PHONE}</strong>.
          </p>
        </div>
      </div>
    </main>
  );
}
