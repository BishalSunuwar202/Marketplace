import { Navbar } from "@/components/layout/navbar";
import { Sidebar } from "@/components/layout/sidebar";

const USER_LINKS = [
  { href: "/dashboard/user", label: "Overview" },
  { href: "/dashboard/user/orders", label: "My Orders" },
  { href: "/dashboard/user/wishlist", label: "Wishlist" },
  { href: "/dashboard/user/reviews", label: "My Reviews" },
  { href: "/dashboard/user/messages", label: "Messages" },
  { href: "/dashboard/user/profile", label: "Profile Settings" },
  { href: "/dashboard/user/become-seller", label: "Become a Seller" },
];

export default function UserDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <div className="flex flex-1">
        <Sidebar title="User Dashboard" links={USER_LINKS} />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
