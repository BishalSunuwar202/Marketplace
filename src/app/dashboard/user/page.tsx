import { auth } from "@/lib/auth/auth";
import { redirect } from "next/navigation";

export default async function UserDashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/auth/login");

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">
        Welcome, {session.user.name}
      </h1>
      <p className="mt-2 text-gray-600">
        Manage your orders, wishlist, and account settings.
      </p>

      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h3 className="text-sm font-medium text-gray-500">My Orders</h3>
          <p className="mt-2 text-3xl font-semibold text-gray-900">--</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h3 className="text-sm font-medium text-gray-500">Wishlist Items</h3>
          <p className="mt-2 text-3xl font-semibold text-gray-900">--</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h3 className="text-sm font-medium text-gray-500">Reviews Written</h3>
          <p className="mt-2 text-3xl font-semibold text-gray-900">--</p>
        </div>
      </div>
    </div>
  );
}
