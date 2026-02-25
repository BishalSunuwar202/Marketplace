import { Navbar } from "@/components/layout/navbar";
import { Sidebar } from "@/components/layout/sidebar";

const SELLER_LINKS = [
  { href: "/dashboard/seller", label: "Overview" },
  { href: "/dashboard/seller/listings", label: "My Listings" },
  { href: "/dashboard/seller/orders", label: "Sales & Orders" },
  { href: "/dashboard/seller/analytics", label: "Analytics" },
  { href: "/dashboard/seller/messages", label: "Messages" },
  { href: "/dashboard/seller/profile", label: "Seller Profile" },
  { href: "/dashboard/seller/payouts", label: "Payouts" },
];

export default function SellerDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <div className="flex flex-1">
        <Sidebar title="Seller Dashboard" links={SELLER_LINKS} />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
