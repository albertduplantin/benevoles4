import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function VerifyRequestPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Vérifiez votre boîte mail</CardTitle>
          <CardDescription>
            Un lien de connexion vient de vous être envoyé. Il est valable 24 heures.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/auth/login" className="text-sm underline">
            Retour à la connexion
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
