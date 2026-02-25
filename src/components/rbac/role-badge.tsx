import { cn } from "@/lib/utils";
import { getRoleDisplayName } from "@/lib/rbac";
import type { Role } from "@/generated/prisma/enums";

const ROLE_COLORS: Record<Role, string> = {
  USER: "bg-blue-100 text-blue-800",
  SELLER: "bg-green-100 text-green-800",
  ADMIN: "bg-amber-100 text-amber-800",
  SUPER_ADMIN: "bg-red-100 text-red-800",
};

type RoleBadgeProps = {
  role: Role;
  className?: string;
};

export function RoleBadge({ role, className }: RoleBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        ROLE_COLORS[role],
        className
      )}
    >
      {getRoleDisplayName(role)}
    </span>
  );
}
