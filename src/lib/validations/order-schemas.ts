import { z } from "zod";
import { OrderStatus } from "@/generated/prisma/enums";

export const createOrderSchema = z.object({
  listingId: z.string().uuid("Invalid listing ID"),
  shippingAddressId: z.string().uuid("Invalid shipping address ID"),
  notes: z.string().max(500).optional(),
});

export const updateOrderStatusSchema = z.object({
  status: z.nativeEnum(OrderStatus),
  trackingNumber: z.string().max(100).optional(),
  trackingUrl: z.string().url().optional(),
});

export const cancelOrderSchema = z.object({
  reason: z
    .string()
    .min(5, "Please provide a reason for cancellation")
    .max(500),
});

export const refundRequestSchema = z.object({
  reason: z
    .string()
    .min(10, "Please provide a detailed reason for the refund")
    .max(1000),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;
export type CancelOrderInput = z.infer<typeof cancelOrderSchema>;
export type RefundRequestInput = z.infer<typeof refundRequestSchema>;
