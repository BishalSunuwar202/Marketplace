"use server";

import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db";
import { authorize, hasPermission, isOwner } from "@/lib/rbac";
import { reviewSchema } from "@/lib/validations/common-schemas";

export async function createReview(data: {
  listingId: string;
  rating: number;
  comment?: string;
}) {
  // ── Authenticate ──
  const session = await auth();
  if (!session?.user) {
    return { error: "UNAUTHENTICATED" };
  }

  // ── Authorize ──
  const authResult = authorize(session.user.role, session.user.accountStatus, "review.create");
  if (!authResult.authorized) {
    return { error: authResult.error };
  }

  // ── Validate ──
  const parsed = reviewSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  // ── Check that user has purchased this listing ──
  const order = await db.order.findFirst({
    where: {
      buyerId: session.user.id,
      listingId: parsed.data.listingId,
      status: "DELIVERED",
    },
  });

  if (!order) {
    return { error: "MUST_PURCHASE_BEFORE_REVIEW" };
  }

  // ── Check for existing review ──
  const existingReview = await db.review.findUnique({
    where: {
      userId_listingId: {
        userId: session.user.id,
        listingId: parsed.data.listingId,
      },
    },
  });

  if (existingReview) {
    return { error: "REVIEW_ALREADY_EXISTS" };
  }

  // ── Execute ──
  const review = await db.review.create({
    data: {
      userId: session.user.id,
      listingId: parsed.data.listingId,
      rating: parsed.data.rating,
      comment: parsed.data.comment,
    },
  });

  return { data: review };
}

export async function updateReview(
  reviewId: string,
  data: { rating?: number; comment?: string }
) {
  // ── Authenticate ──
  const session = await auth();
  if (!session?.user) {
    return { error: "UNAUTHENTICATED" };
  }

  // ── Fetch review ──
  const review = await db.review.findUnique({
    where: { id: reviewId },
    select: { userId: true },
  });

  if (!review) {
    return { error: "REVIEW_NOT_FOUND" };
  }

  // ── Authorize ──
  const canModerate = hasPermission(session.user.role, "review.moderateAny");
  const canEditOwn = isOwner(session.user.id, review.userId) &&
    hasPermission(session.user.role, "review.editOwn");

  if (!canModerate && !canEditOwn) {
    return { error: "INSUFFICIENT_PERMISSIONS" };
  }

  // ── Execute ──
  const updated = await db.review.update({
    where: { id: reviewId },
    data: {
      rating: data.rating,
      comment: data.comment,
    },
  });

  return { data: updated };
}

export async function deleteReview(reviewId: string) {
  // ── Authenticate ──
  const session = await auth();
  if (!session?.user) {
    return { error: "UNAUTHENTICATED" };
  }

  // ── Fetch review ──
  const review = await db.review.findUnique({
    where: { id: reviewId },
    select: { userId: true },
  });

  if (!review) {
    return { error: "REVIEW_NOT_FOUND" };
  }

  // ── Authorize ──
  const canModerate = hasPermission(session.user.role, "review.moderateAny");
  const canDeleteOwn = isOwner(session.user.id, review.userId) &&
    hasPermission(session.user.role, "review.deleteOwn");

  if (!canModerate && !canDeleteOwn) {
    return { error: "INSUFFICIENT_PERMISSIONS" };
  }

  // ── Execute (soft delete — hide review) ──
  await db.review.update({
    where: { id: reviewId },
    data: { isVisible: false },
  });

  return { success: true };
}
