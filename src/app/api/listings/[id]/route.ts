import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const listing = await db.listing.findUnique({
    where: { id },
    include: {
      seller: {
        select: {
          id: true,
          name: true,
          avatarUrl: true,
          createdAt: true,
          sellerProfile: {
            select: {
              businessName: true,
              rating: true,
              totalSales: true,
            },
          },
        },
      },
      brand: { select: { name: true, slug: true } },
      category: { select: { name: true, slug: true } },
      reviews: {
        where: { isVisible: true },
        select: {
          id: true,
          rating: true,
          comment: true,
          createdAt: true,
          user: { select: { name: true, avatarUrl: true } },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!listing || listing.status === "DELETED") {
    return NextResponse.json(
      { error: "LISTING_NOT_FOUND" },
      { status: 404 }
    );
  }

  // Increment view count
  await db.listing.update({
    where: { id },
    data: { viewCount: { increment: 1 } },
  });

  return NextResponse.json({ data: listing });
}
