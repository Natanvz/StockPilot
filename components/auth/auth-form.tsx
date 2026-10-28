'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  type UserCredential,
} from 'firebase/auth';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getClientAuth } from '@/lib/firebase/client';
import { credentialsSchema, type Credentials } from '@/lib/validation/auth';

type Mode = 'sign-in' | 'sign-up';

/** Sign in or sign up with Firebase, then exchange the ID token for a session cookie. */
async function authenticate(mode: Mode, email: string, password: string): Promise<void> {
  const method = mode === 'sign-up' ? createUserWithEmailAndPassword : signInWithEmailAndPassword;
  const credential: UserCredential = await method(getClientAuth(), email, password);
  const idToken = await credential.user.getIdToken();
  const res = await fetch('/api/auth/session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken }),
  });
  if (!res.ok) {
    throw new Error('session-exchange-failed');
  }
}

export function AuthForm({ mode }: { mode: Mode }) {
  const t = useTranslations('auth');
  const router = useRouter();
  const params = useSearchParams();
  const [serverError, setServerError] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Credentials>({ resolver: zodResolver(credentialsSchema) });
  const isSignUp = mode === 'sign-up';

  const onSubmit = handleSubmit(async ({ email, password }) => {
    setServerError(false);
    try {
      await authenticate(mode, email, password);
      router.push(params.get('next') ?? '/dashboard');
      router.refresh();
    } catch {
      setServerError(true);
    }
  });

  return (
    <form onSubmit={onSubmit} className="bg-card w-full max-w-sm space-y-4 rounded-lg border p-6">
      <h1 className="text-xl font-semibold">{isSignUp ? t('signUpTitle') : t('signInTitle')}</h1>

      <div className="space-y-1.5">
        <Label htmlFor="email">{t('email')}</Label>
        <Input id="email" type="email" autoComplete="email" {...register('email')} />
        {errors.email ? <p className="text-destructive text-sm">{t('invalidEmail')}</p> : null}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="password">{t('password')}</Label>
        <Input
          id="password"
          type="password"
          autoComplete={isSignUp ? 'new-password' : 'current-password'}
          {...register('password')}
        />
        {errors.password ? (
          <p className="text-destructive text-sm">{t('passwordTooShort')}</p>
        ) : null}
      </div>

      {serverError ? <p className="text-destructive text-sm">{t('error')}</p> : null}

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSignUp ? t('signUpSubmit') : t('signInSubmit')}
      </Button>

      <p className="text-muted-foreground text-center text-sm">
        <Link href={isSignUp ? '/sign-in' : '/sign-up'} className="hover:text-foreground underline">
          {isSignUp ? t('toSignIn') : t('toSignUp')}
        </Link>
      </p>
    </form>
  );
}
