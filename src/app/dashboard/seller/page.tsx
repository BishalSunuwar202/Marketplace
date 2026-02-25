import { auth } from "@/lib/auth/auth";
import { redirect } from "next/navigation";

export default async function SellerDashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/auth/login");

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Seller Dashboard</h1>
      <p className="mt-2 text-gray-600">
        Manage your listings, track sales, and grow your business.
      </p>

      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h3 className="text-sm font-medium text-gray-500">Active Listings</h3>
          <p className="mt-2 text-3xl font-semibold text-gray-900">--</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h3 className="text-sm font-medium text-gray-500">Total Sales</h3>
          <p className="mt-2 text-3xl font-semibold text-gray-900">--</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h3 className="text-sm font-medium text-gray-500">Pending Orders</h3>
          <p className="mt-2 text-3xl font-semibold text-gray-900">--</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h3 className="text-sm font-medium text-gray-500">Revenue</h3>
          <p className="mt-2 text-3xl font-semibold text-gray-900">--</p>
        </div>
      </div>
    </div>
  );
}
