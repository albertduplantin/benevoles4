'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { signUpWithEmail } from '@/lib/firebase/auth';
import {
  userRegistrationSchema,
  UserRegistrationInput,
} from '@/lib/validations/user';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { GoogleSignInButton } from './google-sign-in-button';
import Link from 'next/link';
import { Eye, EyeOff } from 'lucide-react';

export function RegisterForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<UserRegistrationInput>({
    resolver: zodResolver(userRegistrationSchema),
    defaultValues: {
      consentCommunications: false,
    },
  });

  const consentDataProcessing = watch('consentDataProcessing');
  const consentCommunications = watch('consentCommunications');

  // Formater le numéro de téléphone automatiquement
  const formatPhoneNumber = (value: string) => {
    // Retirer tous les caractères non numériques
    const numbers = value.replace(/\D/g, '');
    
    // Formater par groupes de 2 chiffres
    const formatted = numbers.match(/.{1,2}/g)?.join(' ') || numbers;
    
    return formatted;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setValue('phone', formatted);
  };

  const onSubmit = async (data: UserRegistrationInput) => {
    setIsLoading(true);
    setError(null);

    try {
      await signUpWithEmail(
        data.email,
        data.password,
        data.firstName,
        data.lastName,
        data.phone,
        data.consentDataProcessing,
        data.consentCommunications
      );

      // Rediriger vers les missions avec rechargement complet
      window.location.href = '/dashboard/missions';
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue lors de l\'inscription');
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Inscription Bénévole</CardTitle>
        <CardDescription>
          Créez votre compte pour participer au festival
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">Prénom *</Label>
              <Input
                id="firstName"
                {...register('firstName')}
                placeholder="Prénom"
                disabled={isLoading}
              />
              {errors.firstName && (
                <p className="text-sm text-red-600">{errors.firstName.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastName">Nom *</Label>
              <Input
                id="lastName"
                {...register('lastName')}
                placeholder="Nom"
                disabled={isLoading}
              />
              {errors.lastName && (
                <p className="text-sm text-red-600">{errors.lastName.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              {...register('email')}
              placeholder="Votre email"
              disabled={isLoading}
            />
            {errors.email && (
              <p className="text-sm text-red-600">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Téléphone *</Label>
            <Input
              id="phone"
              type="tel"
              {...register('phone')}
              onChange={handlePhoneChange}
              placeholder="06 12 34 56 78"
              disabled={isLoading}
            />
            {errors.phone && (
              <p className="text-sm text-red-600">{errors.phone.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Mot de passe *</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                {...register('password')}
                placeholder="Votre mot de passe"
                disabled={isLoading}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                disabled={isLoading}
                title={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="text-sm text-red-600">{errors.password.message}</p>
            )}
          </div>

          <div className="space-y-4 pt-2">
            <div className="flex items-start space-x-2">
              <Checkbox
                id="consentDataProcessing"
                checked={consentDataProcessing}
                onCheckedChange={(checked) =>
                  setValue('consentDataProcessing', checked as true)
                }
                disabled={isLoading}
              />
              <Label
                htmlFor="consentDataProcessing"
                className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                J&apos;accepte le traitement de mes données personnelles conformément à la{' '}
                <Link href="/legal/privacy" className="text-primary underline">
                  politique de confidentialité
                </Link>{' '}
                *
              </Label>
            </div>
            {errors.consentDataProcessing && (
              <p className="text-sm text-red-600">
                {errors.consentDataProcessing.message}
              </p>
            )}

            <div className="flex items-start space-x-2">
              <Checkbox
                id="consentCommunications"
                checked={consentCommunications}
                onCheckedChange={(checked) =>
                  setValue('consentCommunications', checked === true)
                }
                disabled={isLoading}
              />
              <Label
                htmlFor="consentCommunications"
                className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                J&apos;accepte de recevoir des communications sur les missions et événements
              </Label>
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Inscription en cours...' : 'S\'inscrire'}
          </Button>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">Ou continuer avec</span>
          </div>
        </div>

        <GoogleSignInButton disabled={isLoading} />

        <div className="text-center text-sm">
          Vous avez déjà un compte ?{' '}
          <Link href="/auth/login" className="text-primary underline">
            Se connecter
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

