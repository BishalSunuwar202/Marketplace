import { z } from "zod";

export const sellerApplicationSchema = z.object({
  businessName: z
    .string()
    .min(2, "Business name must be at least 2 characters")
    .max(200),
  businessDescription: z.string().max(2000).optional(),
  applicationData: z.record(z.string(), z.unknown()).optional(),
});

export const updateSellerProfileSchema = z.object({
  businessName: z.string().min(2).max(200).optional(),
  description: z.string().max(2000).optional(),
  logoUrl: z.string().url().optional(),
  returnPolicy: z.string().max(5000).optional(),
});

export type SellerApplicationInput = z.infer<typeof sellerApplicationSchema>;
export type UpdateSellerProfileInput = z.infer<typeof updateSellerProfileSchema>;
