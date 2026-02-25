"use server";

import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db";
import { authorize } from "@/lib/rbac";
import { Role } from "@/generated/prisma/enums";
import type { Prisma } from "@/generated/prisma/client";
import {
  sellerApplicationSchema,
  updateSellerProfileSchema,
} from "@/lib/validations/seller-schemas";

export async function submitSellerApplication(data: {
  businessName: string;
  businessDescription?: string;
  applicationData?: Record<string, unknown>;
}) {
  // ── Authenticate ──
  const session = await auth();
  if (!session?.user) {
    return { error: "UNAUTHENTICATED" };
  }

  // ── Only Users can apply (not already a Seller/Admin) ──
  if (session.user.role !== Role.USER) {
    return { error: "ONLY_USERS_CAN_APPLY" };
  }

  // ── Authorize ──
  const authResult = authorize(session.user.role, session.user.accountStatus, "auth.login");
  if (!authResult.authorized) {
    return { error: authResult.error };
  }

  // ── Validate ──
  const parsed = sellerApplicationSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  // ── Check for existing pending application ──
  const existingApplication = await db.sellerApplication.findFirst({
    where: { userId: session.user.id, status: "PENDING" },
  });

  if (existingApplication) {
    return { error: "APPLICATION_ALREADY_PENDING" };
  }

  // ── Execute ──
  const application = await db.sellerApplication.create({
    data: {
      userId: session.user.id,
      businessName: parsed.data.businessName,
      businessDescription: parsed.data.businessDescription,
      applicationData: parsed.data.applicationData as Prisma.InputJsonValue | undefined,
    },
  });

  return { data: application };
}

export async function updateSellerProfile(data: {
  businessName?: string;
  description?: string;
  logoUrl?: string;
  returnPolicy?: string;
}) {
  // ── Authenticate ──
  const session = await auth();
  if (!session?.user) {
    return { error: "UNAUTHENTICATED" };
  }

  // ── Must be a seller ──
  if (session.user.role !== Role.SELLER && session.user.role !== Role.SUPER_ADMIN) {
    return { error: "SELLER_ONLY" };
  }

  // ── Validate ──
  const parsed = updateSellerProfileSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  // ── Execute ──
  const profile = await db.sellerProfile.update({
    where: { userId: session.user.id },
    data: parsed.data,
  });

  return { data: profile };
}

export async function getSellerProfile() {
  // ── Authenticate ──
  const session = await auth();
  if (!session?.user) {
    return { error: "UNAUTHENTICATED" };
  }

  const profile = await db.sellerProfile.findUnique({
    where: { userId: session.user.id },
    include: {
      user: {
        select: { name: true, email: true, avatarUrl: true, createdAt: true },
      },
    },
  });

  if (!profile) {
    return { error: "SELLER_PROFILE_NOT_FOUND" };
  }

  return { data: profile };
}

export async function getApplicationStatus() {
  // ── Authenticate ──
  const session = await auth();
  if (!session?.user) {
    return { error: "UNAUTHENTICATED" };
  }

  const application = await db.sellerApplication.findFirst({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      status: true,
      businessName: true,
      rejectionReason: true,
      createdAt: true,
      reviewedAt: true,
    },
  });

  return { data: application };
}
