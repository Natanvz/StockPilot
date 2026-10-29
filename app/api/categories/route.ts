import { NextResponse } from 'next/server';
import { toErrorResponse } from '@/lib/api/respond';
import { requireRole, requireUser } from '@/lib/auth/guards';
import { ROLE } from '@/lib/auth/roles';
import { categoryRepository } from '@/lib/data/category-repository';
import { createCategorySchema } from '@/lib/validation/category';

/** List all categories (any authenticated user). ADR 0016. */
export async function GET(): Promise<NextResponse> {
  try {
    await requireUser();
    const categories = await categoryRepository.list();
    return NextResponse.json({ categories });
  } catch (error) {
    return toErrorResponse(error);
  }
}

/** Create a category (admin only). */
export async function POST(request: Request): Promise<NextResponse> {
  try {
    const user = await requireRole(ROLE.ADMIN);
    const body: unknown = await request.json().catch(() => null);
    const parsed = createCategorySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid category', issues: parsed.error.flatten() },
        { status: 400 },
      );
    }
    const category = await categoryRepository.create(parsed.data, user.uid);
    return NextResponse.json({ category }, { status: 201 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
