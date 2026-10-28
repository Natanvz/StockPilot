import { NextResponse } from 'next/server';
import { toErrorResponse } from '@/lib/api/respond';
import { requireUser } from '@/lib/auth/guards';
import { productRepository } from '@/lib/data/product-repository';

/** Catalog metrics for the dashboard (any authenticated user). */
export async function GET(): Promise<NextResponse> {
  try {
    await requireUser();
    const stats = await productRepository.getStats();
    return NextResponse.json({ stats });
  } catch (error) {
    return toErrorResponse(error);
  }
}
