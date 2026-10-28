import { NextResponse } from 'next/server';
import { toErrorResponse } from '@/lib/api/respond';
import { requireRole, requireUser } from '@/lib/auth/guards';
import { productRepository } from '@/lib/data/product-repository';
import { createProductSchema } from '@/lib/validation/product';

/** List products, one cursor page at a time (any authenticated user). */
export async function GET(request: Request): Promise<NextResponse> {
  try {
    await requireUser();
    const params = new URL(request.url).searchParams;
    const limit = Math.min(Number(params.get('limit')) || 20, 100);
    const cursorCreatedAt = params.get('cursorCreatedAt');
    const cursorId = params.get('cursorId');
    const cursor =
      cursorCreatedAt && cursorId ? { createdAt: cursorCreatedAt, id: cursorId } : null;
    const page = await productRepository.list({ limit, cursor });
    return NextResponse.json(page);
  } catch (error) {
    return toErrorResponse(error);
  }
}

/** Create a product (admin only). */
export async function POST(request: Request): Promise<NextResponse> {
  try {
    const user = await requireRole('admin');
    const body: unknown = await request.json().catch(() => null);
    const parsed = createProductSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid product', issues: parsed.error.flatten() },
        { status: 400 },
      );
    }
    const product = await productRepository.create(parsed.data, user.uid);
    return NextResponse.json({ product }, { status: 201 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
