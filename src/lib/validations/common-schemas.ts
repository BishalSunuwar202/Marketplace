import { z } from "zod";

export const uuidSchema = z.string().uuid("Invalid ID format");

export const paginationSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
});

export const profileUpdateSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  avatarUrl: z.string().url().optional(),
  phone: z.string().max(20).optional(),
});

export const shippingAddressSchema = z.object({
  fullName: z.string().min(2).max(100),
  street: z.string().min(5).max(200),
  city: z.string().min(2).max(100),
  state: z.string().min(2).max(100),
  zipCode: z.string().min(3).max(20),
  country: z.string().min(2).max(100),
  phone: z.string().max(20).optional(),
  isDefault: z.boolean().default(false),
});

export const reviewSchema = z.object({
  listingId: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(2000).optional(),
});

export const reportSchema = z.object({
  listingId: z.string().uuid().optional(),
  reason: z.string().min(5).max(200),
  description: z.string().max(2000).optional(),
});

export type PaginationInput = z.infer<typeof paginationSchema>;
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
export type ShippingAddressInput = z.infer<typeof shippingAddressSchema>;
export type ReviewInput = z.infer<typeof reviewSchema>;
export type ReportInput = z.infer<typeof reportSchema>;
