import { NextResponse } from 'next/server';
import { toErrorResponse } from '@/lib/api/respond';
import { requireRole, requireUser } from '@/lib/auth/guards';
import { ROLE } from '@/lib/auth/roles';
import { categoryRepository } from '@/lib/data/category-repository';
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
    return category ? NextResponse.json({ category }) : notFound();
  } catch (error) {
    return toErrorResponse(error);
  }
}

/** Delete a category (admin only). */
export async function DELETE(_request: Request, { params }: RouteContext): Promise<NextResponse> {
  try {
    await requireRole(ROLE.ADMIN);
    const { id } = await params;
    const removed = await categoryRepository.remove(id);
    return removed ? NextResponse.json({ ok: true }) : notFound();
  } catch (error) {
    return toErrorResponse(error);
  }
}
