"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { usePermission } from "@/hooks/use-permission";

type SidebarLink = {
  href: string;
  label: string;
  permission?: Parameters<ReturnType<typeof usePermission>["can"]>[0];
};

type SidebarProps = {
  links: SidebarLink[];
  title: string;
};

export function Sidebar({ links, title }: SidebarProps) {
  const pathname = usePathname();
  const { can } = usePermission();

  const visibleLinks = links.filter(
    (link) => !link.permission || can(link.permission)
  );

  return (
    <aside className="w-64 border-r border-gray-200 bg-gray-50 p-4">
      <h2 className="mb-4 text-lg font-semibold text-gray-900">{title}</h2>
      <nav className="flex flex-col gap-1">
        {visibleLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "rounded-md px-3 py-2 text-sm transition-colors",
              pathname === link.href
                ? "bg-gray-200 font-medium text-gray-900"
                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            )}
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
