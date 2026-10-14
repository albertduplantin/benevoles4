import { redirect } from 'next/navigation';

// L'inscription et la connexion sont un seul parcours (compte créé à la première connexion)
export default function RegisterPage() {
  redirect('/auth/login');
}
