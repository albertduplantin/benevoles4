import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: "Conditions d'utilisation - Festival Films Courts de Dinan",
};

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-3xl space-y-6 p-6 text-gray-800">
      <h1 className="text-3xl font-bold">Conditions d&apos;utilisation</h1>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Objet</h2>
        <p>
          Cette application permet aux bénévoles du Festival Films Courts de Dinan de consulter les missions, de s&apos;y
          inscrire et de suivre leur planning.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Votre compte</h2>
        <p>
          Vous vous connectez avec votre compte Google. Vous êtes responsable de l&apos;exactitude des informations de votre
          profil et de l&apos;usage de votre compte.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Inscriptions aux missions</h2>
        <p>
          Les inscriptions sont soumises aux places disponibles. Une désinscription n&apos;est plus possible moins de 24
          heures avant le début d&apos;une mission : contactez alors le responsable de la catégorie.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Données personnelles</h2>
        <p>
          Le traitement de vos données est décrit dans la{' '}
          <Link href="/legal/privacy" className="underline">
            politique de confidentialité
          </Link>
          .
        </p>
      </section>

      <p className="pt-4">
        <Link href="/" className="underline">
          Retour à l&apos;accueil
        </Link>
      </p>
    </main>
  );
}
