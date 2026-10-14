import { emailLoginEnabled } from '@/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { signInWithEmail, signInWithGoogle } from './actions';

const ERROR_MESSAGES: Record<string, string> = {
  Verification: 'Ce lien de connexion a expiré ou a déjà été utilisé. Demandez-en un nouveau.',
  AccessDenied: 'Accès refusé.',
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const errorMessage = error
    ? ERROR_MESSAGES[error] ?? 'La connexion a échoué. Réessayez.'
    : null;

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Connexion</CardTitle>
          <CardDescription>Festival Films Courts de Dinan - Espace bénévoles</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {errorMessage && (
            <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-600">
              {errorMessage}
            </div>
          )}

          <form action={signInWithGoogle}>
            <Button type="submit" variant="outline" className="w-full">
              Continuer avec Google
            </Button>
          </form>

          {emailLoginEnabled && (
            <>
              <div className="text-center text-xs uppercase text-gray-500">ou</div>
              <form action={signInWithEmail} className="space-y-2">
                <Input type="email" name="email" placeholder="votre@email.fr" required />
                <Button type="submit" className="w-full">
                  Recevoir un lien de connexion
                </Button>
              </form>
            </>
          )}

          <p className="text-center text-xs text-gray-500">
            Première visite ? Votre compte est créé à la première connexion.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
