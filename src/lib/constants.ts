export const ORDER_STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  CONFIRMED: "bg-blue-100 text-blue-800",
  SHIPPED: "bg-purple-100 text-purple-800",
  DELIVERED: "bg-green-100 text-green-800",
  CANCELLED: "bg-gray-100 text-gray-600",
  REFUND_REQUESTED: "bg-orange-100 text-orange-800",
  REFUNDED: "bg-red-100 text-red-800",
};

export const ROLE_COLORS: Record<string, string> = {
  USER: "bg-gray-100 text-gray-700",
  SELLER: "bg-blue-100 text-blue-700",
  ADMIN: "bg-purple-100 text-purple-700",
  SUPER_ADMIN: "bg-red-100 text-red-700",
};

export function formatLabel(value: string): string {
  return value.replaceAll("_", " ");
}
