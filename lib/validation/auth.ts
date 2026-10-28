import { z } from 'zod';

/**
 * Credentials schema, shared by the sign-in / sign-up form and (later) any
 * server-side use (ADR 0013 — one schema, no drift). Messages are not set here;
 * the form renders field errors via i18n (core-belief #10).
 */
export const credentialsSchema = z.object({
  email: z.email(),
  password: z.string().min(6),
});

export type Credentials = z.infer<typeof credentialsSchema>;
