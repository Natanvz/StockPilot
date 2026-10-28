import { NextResponse } from 'next/server';
import { toErrorResponse } from '@/lib/api/respond';
import { requireRole, requireUser } from '@/lib/auth/guards';
import { productRepository } from '@/lib/data/product-repository';
import { updateProductSchema } from '@/lib/validation/product';

type RouteContext = { params: Promise<{ id: string }> };

const notFound = (): NextResponse =>
  NextResponse.json({ error: 'Product not found' }, { status: 404 });

/** Get one product (any authenticated user). */
export async function GET(_request: Request, { params }: RouteContext): Promise<NextResponse> {
  try {
    await requireUser();
    const { id } = await params;
    const product = await productRepository.getById(id);
    return product ? NextResponse.json({ product }) : notFound();
  } catch (error) {
    return toErrorResponse(error);
  }
}

/** Update a product (admin only). */
export async function PATCH(request: Request, { params }: RouteContext): Promise<NextResponse> {
  try {
    await requireRole('admin');
    const { id } = await params;
    const body: unknown = await request.json().catch(() => null);
    const parsed = updateProductSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid product', issues: parsed.error.flatten() },
        { status: 400 },
      );
    }
    const product = await productRepository.update(id, parsed.data);
    return product ? NextResponse.json({ product }) : notFound();
  } catch (error) {
    return toErrorResponse(error);
  }
}

/** Delete a product (admin only). */
export async function DELETE(_request: Request, { params }: RouteContext): Promise<NextResponse> {
  try {
    await requireRole('admin');
    const { id } = await params;
    const removed = await productRepository.remove(id);
    return removed ? NextResponse.json({ ok: true }) : notFound();
  } catch (error) {
    return toErrorResponse(error);
  }
}
