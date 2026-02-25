import { z } from "zod";
import { ListingCondition, ListingStatus } from "@/generated/prisma/enums";

export const createListingSchema = z.object({
  title: z
    .string()
    .min(5, "Title must be at least 5 characters")
    .max(200, "Title must be less than 200 characters"),
  description: z
    .string()
    .min(20, "Description must be at least 20 characters")
    .max(5000, "Description must be less than 5000 characters"),
  model: z.string().max(100).optional(),
  categoryId: z.string().uuid().optional(),
  brandId: z.string().uuid().optional(),
  condition: z.nativeEnum(ListingCondition),
  price: z
    .number()
    .positive("Price must be positive")
    .max(99999999, "Price is too high"),
  images: z
    .array(z.string().url())
    .min(1, "At least one image is required")
    .max(10, "Maximum 10 images allowed"),
  specs: z.record(z.string(), z.unknown()).optional(),
  warrantyInfo: z.string().max(1000).optional(),
});

export const updateListingSchema = createListingSchema.partial();

export const updateListingStatusSchema = z.object({
  status: z.enum([ListingStatus.ACTIVE, ListingStatus.PAUSED, ListingStatus.SOLD]),
});

export const listingFilterSchema = z.object({
  search: z.string().optional(),
  categoryId: z.string().uuid().optional(),
  brandId: z.string().uuid().optional(),
  condition: z.nativeEnum(ListingCondition).optional(),
  minPrice: z.number().positive().optional(),
  maxPrice: z.number().positive().optional(),
  status: z.nativeEnum(ListingStatus).optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(50).default(20),
  sortBy: z.enum(["price", "createdAt", "viewCount"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export type CreateListingInput = z.infer<typeof createListingSchema>;
export type UpdateListingInput = z.infer<typeof updateListingSchema>;
export type ListingFilterInput = z.infer<typeof listingFilterSchema>;
