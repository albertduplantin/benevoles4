'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { syncUserToFirestore } from '@/lib/clerk/sync-user-to-firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const completeProfileSchema = z.object({
  firstName: z.string().min(2, 'Le prénom doit contenir au moins 2 caractères'),
  lastName: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  phone: z
    .string()
    .regex(
      /^(?:(?:\+|00)33|0)\s*[1-9](?:[\s.-]*\d{2}){4}$/,
      'Numéro de téléphone invalide'
    ),
});

type CompleteProfileInput = z.infer<typeof completeProfileSchema>;

export default function CompleteProfilePage() {
  const { user, clerkUser, loading, refreshUser } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<CompleteProfileInput>({
    resolver: zodResolver(completeProfileSchema),
  });

  const formatPhoneNumber = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    const formatted = numbers.match(/.{1,2}/g)?.join(' ') || numbers;
    return formatted;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setValue('phone', formatted);
  };

  useEffect(() => {
    if (!loading && !clerkUser) {
      router.push('/auth/login');
    }
  }, [clerkUser, loading, router]);

  useEffect(() => {
    if (clerkUser) {
      if (clerkUser.firstName) setValue('firstName', clerkUser.firstName);
      if (clerkUser.lastName) setValue('lastName', clerkUser.lastName);
      if (clerkUser.phoneNumbers?.[0]?.phoneNumber) {
        setValue('phone', formatPhoneNumber(clerkUser.phoneNumbers[0].phoneNumber));
      }
    }
  }, [clerkUser, setValue]);

  const onSubmit = async (data: CompleteProfileInput) => {
    if (!clerkUser?.id || !clerkUser?.emailAddresses?.[0]?.emailAddress) return;

    setIsLoading(true);
    setError(null);

    try {
      await syncUserToFirestore(clerkUser.id, {
        email: clerkUser.emailAddresses[0].emailAddress,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
      });

      await refreshUser();
      router.push('/dashboard/missions');
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue');
      setIsLoading(false);
    }
  };

  if (loading || !clerkUser) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Chargement...</p>
      </div>
    );
  }

  if (user && user.firstName && user.lastName && user.phone) {
    router.push('/dashboard/missions');
    return null;
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Compléter votre profil</CardTitle>
          <CardDescription>
            Bienvenue {clerkUser.emailAddresses[0].emailAddress} ! <br/>
            Pour continuer, veuillez compléter votre profil.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="firstName">Prénom</Label>
              <Input
                id="firstName"
                {...register('firstName')}
                placeholder="Votre prénom"
                disabled={isLoading}
              />
              {errors.firstName && (
                <p className="text-sm text-red-500 mt-1">{errors.firstName.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="lastName">Nom</Label>
              <Input
                id="lastName"
                {...register('lastName')}
                placeholder="Votre nom"
                disabled={isLoading}
              />
              {errors.lastName && (
                <p className="text-sm text-red-500 mt-1">{errors.lastName.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="phone">Téléphone</Label>
              <Input
                id="phone"
                {...register('phone')}
                onChange={handlePhoneChange}
                placeholder="06 12 34 56 78"
                disabled={isLoading}
              />
              {errors.phone && (
                <p className="text-sm text-red-500 mt-1">{errors.phone.message}</p>
              )}
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Enregistrement...' : 'Continuer'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
