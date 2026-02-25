"use server";

import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db";
import { authorize, canAccessResource } from "@/lib/rbac";
import {
  createListingSchema,
  updateListingSchema,
  updateListingStatusSchema,
} from "@/lib/validations/listing-schemas";
import { Decimal } from "@prisma/client/runtime/client";
import type { Prisma } from "@/generated/prisma/client";

export async function createListing(data: {
  title: string;
  description: string;
  model?: string;
  categoryId?: string;
  brandId?: string;
  condition: string;
  price: number;
  images: string[];
  specs?: Record<string, unknown>;
  warrantyInfo?: string;
}) {
  // ── Authenticate ──
  const session = await auth();
  if (!session?.user) {
    return { error: "UNAUTHENTICATED" };
  }

  // ── Authorize ──
  const authResult = authorize(session.user.role, session.user.accountStatus, "listing.create");
  if (!authResult.authorized) {
    return { error: authResult.error };
  }

  // ── Validate ──
  const parsed = createListingSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  // ── Execute ──
  const listing = await db.listing.create({
    data: {
      sellerId: session.user.id,
      title: parsed.data.title,
      description: parsed.data.description,
      model: parsed.data.model,
      categoryId: parsed.data.categoryId,
      brandId: parsed.data.brandId,
      condition: parsed.data.condition,
      price: new Decimal(parsed.data.price),
      images: parsed.data.images,
      specs: parsed.data.specs as Prisma.InputJsonValue | undefined,
      warrantyInfo: parsed.data.warrantyInfo,
    },
  });

  return { data: listing };
}

export async function updateListing(
  listingId: string,
  data: Record<string, unknown>
) {
  // ── Authenticate ──
  const session = await auth();
  if (!session?.user) {
    return { error: "UNAUTHENTICATED" };
  }

  // ── Validate ──
  const parsed = updateListingSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  // ── Fetch listing to check ownership ──
  const listing = await db.listing.findUnique({
    where: { id: listingId },
    select: { sellerId: true },
  });

  if (!listing) {
    return { error: "LISTING_NOT_FOUND" };
  }

  // ── Authorize (ownership + permission check) ──
  const canEdit = canAccessResource(
    session.user.id,
    listing.sellerId,
    session.user.role,
    "listing.editOwn",
    "listing.editAny"
  );

  if (!canEdit) {
    return { error: "INSUFFICIENT_PERMISSIONS" };
  }

  // ── Execute ──
  const updateData: Record<string, unknown> = { ...parsed.data };
  if (parsed.data.price !== undefined) {
    updateData.price = new Decimal(parsed.data.price);
  }

  const updated = await db.listing.update({
    where: { id: listingId },
    data: updateData,
  });

  return { data: updated };
}

export async function updateListingStatus(
  listingId: string,
  data: { status: string }
) {
  // ── Authenticate ──
  const session = await auth();
  if (!session?.user) {
    return { error: "UNAUTHENTICATED" };
  }

  // ── Validate ──
  const parsed = updateListingStatusSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  // ── Fetch listing ──
  const listing = await db.listing.findUnique({
    where: { id: listingId },
    select: { sellerId: true },
  });

  if (!listing) {
    return { error: "LISTING_NOT_FOUND" };
  }

  // ── Authorize ──
  const canEdit = canAccessResource(
    session.user.id,
    listing.sellerId,
    session.user.role,
    "listing.editOwn",
    "listing.editAny"
  );

  if (!canEdit) {
    return { error: "INSUFFICIENT_PERMISSIONS" };
  }

  // ── Execute ──
  const updated = await db.listing.update({
    where: { id: listingId },
    data: { status: parsed.data.status },
  });

  return { data: updated };
}

export async function deleteListing(listingId: string) {
  // ── Authenticate ──
  const session = await auth();
  if (!session?.user) {
    return { error: "UNAUTHENTICATED" };
  }

  // ── Fetch listing ──
  const listing = await db.listing.findUnique({
    where: { id: listingId },
    select: { sellerId: true },
  });

  if (!listing) {
    return { error: "LISTING_NOT_FOUND" };
  }

  // ── Authorize ──
  const canDelete = canAccessResource(
    session.user.id,
    listing.sellerId,
    session.user.role,
    "listing.deleteOwn",
    "listing.deleteAny"
  );

  if (!canDelete) {
    return { error: "INSUFFICIENT_PERMISSIONS" };
  }

  // ── Execute (soft delete) ──
  await db.listing.update({
    where: { id: listingId },
    data: { status: "DELETED" },
  });

  return { success: true };
}
