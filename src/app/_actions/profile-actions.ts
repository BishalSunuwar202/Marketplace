"use server";

import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db";
import { authorize } from "@/lib/rbac";
import { profileUpdateSchema } from "@/lib/validations/common-schemas";
import { changePasswordSchema } from "@/lib/validations/auth-schemas";
import bcrypt from "bcryptjs";

export async function getProfile() {
  // ── Authenticate ──
  const session = await auth();
  if (!session?.user) {
    return { error: "UNAUTHENTICATED" };
  }

  // ── Authorize ──
  const authResult = authorize(session.user.role, session.user.accountStatus, "profile.viewOwn");
  if (!authResult.authorized) {
    return { error: authResult.error };
  }

  // ── Execute ──
  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      avatarUrl: true,
      phone: true,
      role: true,
      createdAt: true,
    },
  });

  return { data: user };
}

export async function updateProfile(data: { name?: string; avatarUrl?: string; phone?: string }) {
  // ── Authenticate ──
  const session = await auth();
  if (!session?.user) {
    return { error: "UNAUTHENTICATED" };
  }

  // ── Authorize ──
  const authResult = authorize(session.user.role, session.user.accountStatus, "profile.editOwn");
  if (!authResult.authorized) {
    return { error: authResult.error };
  }

  // ── Validate ──
  const parsed = profileUpdateSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  // ── Execute ──
  const updated = await db.user.update({
    where: { id: session.user.id },
    data: parsed.data,
    select: { id: true, name: true, email: true, avatarUrl: true, phone: true },
  });

  return { data: updated };
}

export async function changePassword(data: {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}) {
  // ── Authenticate ──
  const session = await auth();
  if (!session?.user) {
    return { error: "UNAUTHENTICATED" };
  }

  // ── Authorize ──
  const authResult = authorize(session.user.role, session.user.accountStatus, "profile.editOwn");
  if (!authResult.authorized) {
    return { error: authResult.error };
  }

  // ── Validate ──
  const parsed = changePasswordSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  // ── Verify current password ──
  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { passwordHash: true },
  });

  if (!user?.passwordHash) {
    return { error: "Password change not available for OAuth accounts" };
  }

  const isValid = await bcrypt.compare(parsed.data.currentPassword, user.passwordHash);
  if (!isValid) {
    return { error: "Current password is incorrect" };
  }

  // ── Execute ──
  const newHash = await bcrypt.hash(parsed.data.newPassword, 12);
  await db.user.update({
    where: { id: session.user.id },
    data: { passwordHash: newHash },
  });

  return { success: true };
}

export async function deleteAccount() {
  // ── Authenticate ──
  const session = await auth();
  if (!session?.user) {
    return { error: "UNAUTHENTICATED" };
  }

  // ── Authorize ──
  const authResult = authorize(session.user.role, session.user.accountStatus, "profile.deleteOwn");
  if (!authResult.authorized) {
    return { error: authResult.error };
  }

  // ── Execute (soft delete via suspension) ──
  await db.user.update({
    where: { id: session.user.id },
    data: {
      accountStatus: "BANNED",
      suspensionReason: "Account deleted by user",
    },
  });

  return { success: true };
}
