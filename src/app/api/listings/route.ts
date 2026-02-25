import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { listingFilterSchema } from "@/lib/validations/listing-schemas";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  const filters = {
    search: searchParams.get("search") ?? undefined,
    categoryId: searchParams.get("categoryId") ?? undefined,
    brandId: searchParams.get("brandId") ?? undefined,
    condition: searchParams.get("condition") ?? undefined,
    minPrice: searchParams.get("minPrice") ? Number(searchParams.get("minPrice")) : undefined,
    maxPrice: searchParams.get("maxPrice") ? Number(searchParams.get("maxPrice")) : undefined,
    page: searchParams.get("page") ? Number(searchParams.get("page")) : 1,
    limit: searchParams.get("limit") ? Number(searchParams.get("limit")) : 20,
    sortBy: (searchParams.get("sortBy") as "price" | "createdAt" | "viewCount") ?? "createdAt",
    sortOrder: (searchParams.get("sortOrder") as "asc" | "desc") ?? "desc",
  };

  const parsed = listingFilterSchema.safeParse(filters);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "INVALID_FILTERS", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { page, limit, sortBy, sortOrder, search, categoryId, brandId, condition, minPrice, maxPrice } = parsed.data;
  const skip = (page - 1) * limit;

  // Build where clause — only show active listings publicly
  const where: Record<string, unknown> = { status: "ACTIVE" };
  if (categoryId) where.categoryId = categoryId;
  if (brandId) where.brandId = brandId;
  if (condition) where.condition = condition;
  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
    ];
  }
  if (minPrice || maxPrice) {
    where.price = {};
    if (minPrice) (where.price as Record<string, unknown>).gte = minPrice;
    if (maxPrice) (where.price as Record<string, unknown>).lte = maxPrice;
  }

  const [listings, total] = await Promise.all([
    db.listing.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      select: {
        id: true,
        title: true,
        price: true,
        condition: true,
        images: true,
        viewCount: true,
        favoriteCount: true,
        createdAt: true,
        seller: { select: { id: true, name: true } },
        brand: { select: { name: true, slug: true } },
        category: { select: { name: true, slug: true } },
      },
    }),
    db.listing.count({ where }),
  ]);

  return NextResponse.json({
    data: listings,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}
