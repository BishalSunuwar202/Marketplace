"use server";

import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db";
import { authorize, hasPermission, isOwner } from "@/lib/rbac";
import {
  createOrderSchema,
  cancelOrderSchema,
  updateOrderStatusSchema,
  refundRequestSchema,
} from "@/lib/validations/order-schemas";
import { Decimal } from "@prisma/client/runtime/client";

export async function createOrder(data: {
  listingId: string;
  shippingAddressId: string;
  notes?: string;
}) {
  // ── Authenticate ──
  const session = await auth();
  if (!session?.user) {
    return { error: "UNAUTHENTICATED" };
  }

  // ── Authorize ──
  const authResult = authorize(session.user.role, session.user.accountStatus, "order.create");
  if (!authResult.authorized) {
    return { error: authResult.error };
  }

  // ── Validate ──
  const parsed = createOrderSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  // ── Fetch listing ──
  const listing = await db.listing.findUnique({
    where: { id: parsed.data.listingId, status: "ACTIVE" },
    select: { id: true, sellerId: true, price: true },
  });

  if (!listing) {
    return { error: "LISTING_NOT_AVAILABLE" };
  }

  // ── Prevent buying own listing ──
  if (listing.sellerId === session.user.id) {
    return { error: "CANNOT_BUY_OWN_LISTING" };
  }

  // ── Execute ──
  const order = await db.order.create({
    data: {
      buyerId: session.user.id,
      sellerId: listing.sellerId,
      listingId: listing.id,
      shippingAddressId: parsed.data.shippingAddressId,
      totalAmount: listing.price,
      notes: parsed.data.notes,
    },
  });

  return { data: order };
}

export async function cancelOrder(orderId: string, data: { reason: string }) {
  // ── Authenticate ──
  const session = await auth();
  if (!session?.user) {
    return { error: "UNAUTHENTICATED" };
  }

  // ── Validate ──
  const parsed = cancelOrderSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  // ── Fetch order ──
  const order = await db.order.findUnique({
    where: { id: orderId },
    select: { buyerId: true, status: true },
  });

  if (!order) {
    return { error: "ORDER_NOT_FOUND" };
  }

  // ── Authorize ──
  const canCancelAny = hasPermission(session.user.role, "order.cancelAny");
  const canCancelOwn = isOwner(session.user.id, order.buyerId) &&
    hasPermission(session.user.role, "order.cancelOwn");

  if (!canCancelAny && !canCancelOwn) {
    return { error: "INSUFFICIENT_PERMISSIONS" };
  }

  // Only pending/confirmed orders can be cancelled (unless admin)
  if (!canCancelAny && !["PENDING", "CONFIRMED"].includes(order.status)) {
    return { error: "ORDER_CANNOT_BE_CANCELLED" };
  }

  // ── Execute ──
  await db.order.update({
    where: { id: orderId },
    data: {
      status: "CANCELLED",
      cancelledAt: new Date(),
      cancelledBy: session.user.id,
      cancellationReason: parsed.data.reason,
    },
  });

  return { success: true };
}

export async function updateOrderStatus(
  orderId: string,
  data: { status: string; trackingNumber?: string; trackingUrl?: string }
) {
  // ── Authenticate ──
  const session = await auth();
  if (!session?.user) {
    return { error: "UNAUTHENTICATED" };
  }

  // ── Validate ──
  const parsed = updateOrderStatusSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  // ── Fetch order ──
  const order = await db.order.findUnique({
    where: { id: orderId },
    select: { sellerId: true },
  });

  if (!order) {
    return { error: "ORDER_NOT_FOUND" };
  }

  // ── Authorize ──
  const canUpdateAny = hasPermission(session.user.role, "order.updateStatusAny");
  const canUpdateOwn = isOwner(session.user.id, order.sellerId) &&
    hasPermission(session.user.role, "order.updateStatusOwn");

  if (!canUpdateAny && !canUpdateOwn) {
    return { error: "INSUFFICIENT_PERMISSIONS" };
  }

  // ── Execute ──
  await db.order.update({
    where: { id: orderId },
    data: {
      status: parsed.data.status,
      trackingNumber: parsed.data.trackingNumber,
      trackingUrl: parsed.data.trackingUrl,
    },
  });

  return { success: true };
}

export async function requestRefund(orderId: string, data: { reason: string }) {
  // ── Authenticate ──
  const session = await auth();
  if (!session?.user) {
    return { error: "UNAUTHENTICATED" };
  }

  // ── Authorize ──
  const authResult = authorize(
    session.user.role,
    session.user.accountStatus,
    "order.refundRequest"
  );
  if (!authResult.authorized) {
    return { error: authResult.error };
  }

  // ── Validate ──
  const parsed = refundRequestSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  // ── Fetch order ──
  const order = await db.order.findUnique({
    where: { id: orderId },
    select: { buyerId: true, status: true },
  });

  if (!order) {
    return { error: "ORDER_NOT_FOUND" };
  }

  if (!isOwner(session.user.id, order.buyerId)) {
    return { error: "INSUFFICIENT_PERMISSIONS" };
  }

  if (order.status !== "DELIVERED") {
    return { error: "REFUND_ONLY_FOR_DELIVERED_ORDERS" };
  }

  // ── Execute ──
  await db.order.update({
    where: { id: orderId },
    data: {
      status: "REFUND_REQUESTED",
      refundReason: parsed.data.reason,
    },
  });

  return { success: true };
}
