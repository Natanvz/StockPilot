import { NextResponse } from 'next/server';
import { toErrorResponse } from '@/lib/api/respond';
import { requireRole, requireUser } from '@/lib/auth/guards';
import { ROLE } from '@/lib/auth/roles';
import { categoryRepository } from '@/lib/data/category-repository';
import { productRepository } from '@/lib/data/product-repository';
import { updateCategorySchema } from '@/lib/validation/category';

type RouteContext = { params: Promise<{ id: string }> };

const notFound = (): NextResponse =>
  NextResponse.json({ error: 'Category not found' }, { status: 404 });

/** Get one category (any authenticated user). */
export async function GET(_request: Request, { params }: RouteContext): Promise<NextResponse> {
  try {
    await requireUser();
    const { id } = await params;
    const category = await categoryRepository.getById(id);
    return category ? NextResponse.json({ category }) : notFound();
  } catch (error) {
    return toErrorResponse(error);
  }
}

/** Update (rename) a category (admin only). */
export async function PATCH(request: Request, { params }: RouteContext): Promise<NextResponse> {
  try {
    await requireRole(ROLE.ADMIN);
    const { id } = await params;
    const body: unknown = await request.json().catch(() => null);
    const parsed = updateCategorySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid category', issues: parsed.error.flatten() },
        { status: 400 },
      );
    }
    const category = await categoryRepository.update(id, parsed.data);
    if (!category) {
      return notFound();
    }
    // Fan out the new name to the denormalized copy on referencing products (ADR 0016).
    if (parsed.data.name !== undefined) {
      await productRepository.renameCategory(id, category.name);
    }
    return NextResponse.json({ category });
  } catch (error) {
    return toErrorResponse(error);
  }
}

/** Delete a category (admin only). Blocked while products still reference it (ADR 0016). */
export async function DELETE(_request: Request, { params }: RouteContext): Promise<NextResponse> {
  try {
    await requireRole(ROLE.ADMIN);
    const { id } = await params;
    const inUse = await productRepository.countByCategory(id);
    if (inUse > 0) {
      return NextResponse.json({ error: 'Category is in use', count: inUse }, { status: 409 });
    }
    const removed = await categoryRepository.remove(id);
    return removed ? NextResponse.json({ ok: true }) : notFound();
  } catch (error) {
    return toErrorResponse(error);
  }
}
