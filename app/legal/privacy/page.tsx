import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Politique de confidentialité - Festival Films Courts de Dinan',
};

const CONTACT = 'topinambour124@gmail.com';

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl space-y-6 p-6 text-gray-800">
      <h1 className="text-3xl font-bold">Politique de confidentialité</h1>
      <p className="text-sm text-gray-500">Application de gestion des bénévoles du Festival Films Courts de Dinan</p>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Qui est responsable de vos données ?</h2>
        <p>
          L&apos;organisation du Festival Films Courts de Dinan, qui utilise cette application pour coordonner ses bénévoles.
          Contact : <a className="underline" href={`mailto:${CONTACT}`}>{CONTACT}</a>.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Données collectées</h2>
        <ul className="list-disc space-y-1 pl-6">
          <li>Identité : prénom, nom, adresse email, numéro de téléphone.</li>
          <li>Connexion avec Google : nom, adresse email et photo de votre compte Google. Aucun autre accès à votre compte Google n&apos;est demandé, et nous n&apos;avons jamais accès à votre mot de passe Google.</li>
          <li>Participation au festival : missions auxquelles vous vous inscrivez, disponibilités et préférences que vous renseignez.</li>
          <li>Préférences de communication et de notification.</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">À quoi servent-elles ?</h2>
        <p>
          Uniquement à organiser le festival : vous inscrire aux missions, éviter les chevauchements, vous contacter à propos
          de vos missions et permettre aux responsables de coordonner les équipes. Vos données ne sont ni vendues ni utilisées
          à des fins publicitaires.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Qui peut les voir ?</h2>
        <p>
          Les administrateurs et les responsables de catégories du festival. Les autres bénévoles voient uniquement votre nom
          lorsque vous participez à la même mission.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Prestataires techniques</h2>
        <ul className="list-disc space-y-1 pl-6">
          <li>Vercel : hébergement de l&apos;application.</li>
          <li>Neon : base de données (Europe).</li>
          <li>Google : connexion à votre compte.</li>
          <li>Resend : envoi des emails de notification.</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Durée de conservation</h2>
        <p>
          Vos données sont conservées le temps nécessaire à l&apos;organisation du festival, puis supprimées ou anonymisées.
          Vous pouvez demander leur suppression à tout moment.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Vos droits</h2>
        <p>
          Vous pouvez accéder à vos données, les corriger, demander leur suppression ou vous opposer à leur traitement en
          écrivant à <a className="underline" href={`mailto:${CONTACT}`}>{CONTACT}</a>. Vous pouvez aussi modifier vos
          informations depuis votre profil dans l&apos;application. En cas de désaccord, vous pouvez saisir la CNIL
          (<a className="underline" href="https://www.cnil.fr">cnil.fr</a>).
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
