import { z } from "zod";
import { Role, AccountStatus } from "@/generated/prisma/enums";

export const suspendUserSchema = z.object({
  userId: z.string().uuid("Invalid user ID"),
  reason: z.string().min(5, "Reason must be at least 5 characters").max(500),
  expiresAt: z.string().datetime().optional(),
});

export const banUserSchema = z.object({
  userId: z.string().uuid("Invalid user ID"),
  reason: z.string().min(5, "Reason must be at least 5 characters").max(500),
});

export const updateUserRoleSchema = z.object({
  userId: z.string().uuid("Invalid user ID"),
  role: z.nativeEnum(Role),
});

export const reviewSellerApplicationSchema = z.object({
  applicationId: z.string().uuid("Invalid application ID"),
  action: z.enum(["APPROVE", "REJECT"]),
  rejectionReason: z.string().max(500).optional(),
});

export const userFilterSchema = z.object({
  search: z.string().optional(),
  role: z.nativeEnum(Role).optional(),
  accountStatus: z.nativeEnum(AccountStatus).optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
});

export const manageCategorySchema = z.object({
  name: z.string().min(2).max(100),
  slug: z
    .string()
    .min(2)
    .max(100)
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase with hyphens only"),
  description: z.string().max(500).optional(),
});

export const manageBrandSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase with hyphens only"),
  logoUrl: z.string().url().optional(),
});

export type SuspendUserInput = z.infer<typeof suspendUserSchema>;
export type BanUserInput = z.infer<typeof banUserSchema>;
export type UpdateUserRoleInput = z.infer<typeof updateUserRoleSchema>;
export type ReviewSellerApplicationInput = z.infer<typeof reviewSellerApplicationSchema>;
export type UserFilterInput = z.infer<typeof userFilterSchema>;
