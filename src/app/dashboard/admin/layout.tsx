import { Navbar } from "@/components/layout/navbar";
import { Sidebar } from "@/components/layout/sidebar";
import type { Permission } from "@/lib/rbac";

const ADMIN_LINKS: { href: string; label: string; permission?: Permission }[] = [
  { href: "/dashboard/admin", label: "Overview" },
  { href: "/dashboard/admin/users", label: "User Management", permission: "admin.manageUsers" },
  { href: "/dashboard/admin/sellers", label: "Seller Applications", permission: "moderation.approveSellers" },
  { href: "/dashboard/admin/listings", label: "All Listings", permission: "listing.editAny" },
  { href: "/dashboard/admin/orders", label: "All Orders", permission: "order.viewAll" },
  { href: "/dashboard/admin/reports", label: "Reports", permission: "moderation.reviewReports" },
  { href: "/dashboard/admin/analytics", label: "Analytics", permission: "admin.viewAnalytics" },
  { href: "/dashboard/admin/audit-logs", label: "Audit Logs", permission: "moderation.viewAuditLogs" },
  { href: "/dashboard/admin/settings", label: "System Settings", permission: "admin.systemConfig" },
];

export default function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <div className="flex flex-1">
        <Sidebar title="Admin Dashboard" links={ADMIN_LINKS} />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
