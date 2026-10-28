import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { SESSION_COOKIE, SESSION_MAX_AGE_SECONDS } from '@/lib/auth/constants';
import { createSessionCookie } from '@/lib/auth/session';

// Route handlers run on the Node runtime by default, which the Admin SDK needs.

const CreateSessionSchema = z.object({ idToken: z.string().min(1) });

/** Exchange a Firebase ID token for an httpOnly session cookie. */
export async function POST(request: Request): Promise<NextResponse> {
  const body: unknown = await request.json().catch(() => null);
  const parsed = CreateSessionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  try {
    const sessionCookie = await createSessionCookie(parsed.data.idToken);
    const store = await cookies();
    store.set(SESSION_COOKIE, sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: SESSION_MAX_AGE_SECONDS,
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Could not verify credentials' }, { status: 401 });
  }
}

/** Sign out: clear the session cookie. */
export async function DELETE(): Promise<NextResponse> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
  return NextResponse.json({ ok: true });
}
