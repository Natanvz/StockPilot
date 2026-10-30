import { NextResponse } from 'next/server';
import { toErrorResponse } from '@/lib/api/respond';
import { requireRole, requireUser } from '@/lib/auth/guards';
import { ROLE } from '@/lib/auth/roles';
import { categoryRepository } from '@/lib/data/category-repository';
import { productRepository, type UpdateProductData } from '@/lib/data/product-repository';
import { indexProduct, removeProduct } from '@/lib/search/product-index';
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
    await requireRole(ROLE.ADMIN);
    const { id } = await params;
    const body: unknown = await request.json().catch(() => null);
    const parsed = updateProductSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid product', issues: parsed.error.flatten() },
        { status: 400 },
      );
    }
    const data: UpdateProductData = { ...parsed.data };
    // When the category changes, resolve + store its denormalized name (ADR 0016).
    if (parsed.data.categoryId) {
      const category = await categoryRepository.getById(parsed.data.categoryId);
      if (!category) {
        return NextResponse.json({ error: 'Unknown category' }, { status: 400 });
      }
      data.category = category.name;
    }
    const product = await productRepository.update(id, data);
    if (!product) {
      return notFound();
    }
    await indexProduct(product); // best-effort search sync (ADR 0018)
    return NextResponse.json({ product });
  } catch (error) {
    return toErrorResponse(error);
  }
}

/** Delete a product (admin only). */
export async function DELETE(_request: Request, { params }: RouteContext): Promise<NextResponse> {
  try {
    await requireRole(ROLE.ADMIN);
    const { id } = await params;
    const removed = await productRepository.remove(id);
    if (!removed) {
      return notFound();
    }
    await removeProduct(id); // best-effort search sync (ADR 0018)
    return NextResponse.json({ ok: true });
  } catch (error) {
    return toErrorResponse(error);
  }
}
