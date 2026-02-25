import { auth } from "@/lib/auth/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";

export default async function AdminDashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/auth/login");

  const [userCount, sellerCount, listingCount, orderCount, pendingApps] =
    await Promise.all([
      db.user.count(),
      db.user.count({ where: { role: "SELLER" } }),
      db.listing.count({ where: { status: "ACTIVE" } }),
      db.order.count(),
      db.sellerApplication.count({ where: { status: "PENDING" } }),
    ]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
      <p className="mt-2 text-gray-600">
        Platform overview and management tools.
      </p>

      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h3 className="text-sm font-medium text-gray-500">Total Users</h3>
          <p className="mt-2 text-3xl font-semibold text-gray-900">{userCount}</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h3 className="text-sm font-medium text-gray-500">Sellers</h3>
          <p className="mt-2 text-3xl font-semibold text-gray-900">{sellerCount}</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h3 className="text-sm font-medium text-gray-500">Active Listings</h3>
          <p className="mt-2 text-3xl font-semibold text-gray-900">{listingCount}</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h3 className="text-sm font-medium text-gray-500">Total Orders</h3>
          <p className="mt-2 text-3xl font-semibold text-gray-900">{orderCount}</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h3 className="text-sm font-medium text-gray-500">Pending Apps</h3>
          <p className="mt-2 text-3xl font-semibold text-amber-600">{pendingApps}</p>
        </div>
      </div>
    </div>
  );
}
