import { NextResponse } from 'next/server';
import { AuthError } from '@/lib/auth/guards';

/** Map a thrown error to an HTTP response. AuthError carries its own status. */
export function toErrorResponse(error: unknown): NextResponse {
  if (error instanceof AuthError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
}
