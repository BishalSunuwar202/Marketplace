import { auth } from "@/lib/auth/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { formatDistanceToNow } from "date-fns";

export default async function SellerDashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/auth/login");

  const sellerId = session.user.id;

  const [activeListings, totalSales, pendingOrders, revenueResult, recentOrders] =
    await Promise.all([
      db.listing.count({
        where: { sellerId, status: "ACTIVE" },
      }),
      db.order.count({
        where: { sellerId, status: "DELIVERED" },
      }),
      db.order.count({
        where: { sellerId, status: { in: ["PENDING", "CONFIRMED"] } },
      }),
      db.order.aggregate({
        where: { sellerId, status: "DELIVERED" },
        _sum: { totalAmount: true },
      }),
      db.order.findMany({
        where: { sellerId },
        orderBy: { createdAt: "desc" },
        take: 5,
        include: {
          listing: { select: { title: true } },
          buyer: { select: { name: true } },
        },
      }),
    ]);

  const revenue = Number(revenueResult._sum.totalAmount ?? 0);

  const statusColors: Record<string, string> = {
    PENDING: "bg-yellow-100 text-yellow-800",
    CONFIRMED: "bg-blue-100 text-blue-800",
    SHIPPED: "bg-purple-100 text-purple-800",
    DELIVERED: "bg-green-100 text-green-800",
    CANCELLED: "bg-gray-100 text-gray-600",
    REFUND_REQUESTED: "bg-orange-100 text-orange-800",
    REFUNDED: "bg-red-100 text-red-800",
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Seller Dashboard</h1>
      <p className="mt-2 text-gray-600">
        Manage your listings, track sales, and grow your business.
      </p>

      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h3 className="text-sm font-medium text-gray-500">Active Listings</h3>
          <p className="mt-2 text-3xl font-semibold text-gray-900">
            {activeListings}
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h3 className="text-sm font-medium text-gray-500">Total Sales</h3>
          <p className="mt-2 text-3xl font-semibold text-gray-900">
            {totalSales}
          </p>
          <p className="mt-1 text-xs text-gray-400">Delivered orders</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h3 className="text-sm font-medium text-gray-500">Pending Orders</h3>
          <p className="mt-2 text-3xl font-semibold text-amber-600">
            {pendingOrders}
          </p>
          <p className="mt-1 text-xs text-gray-400">Needs action</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h3 className="text-sm font-medium text-gray-500">Revenue</h3>
          <p className="mt-2 text-3xl font-semibold text-green-600">
            ${revenue.toFixed(2)}
          </p>
          <p className="mt-1 text-xs text-gray-400">From delivered orders</p>
        </div>
      </div>

      <div className="mt-10">
        <h2 className="text-lg font-semibold text-gray-900">Recent Orders</h2>
        {recentOrders.length === 0 ? (
          <div className="mt-4 rounded-lg border border-dashed border-gray-200 bg-white p-10 text-center">
            <p className="text-sm text-gray-500">No orders yet.</p>
          </div>
        ) : (
          <div className="mt-4 overflow-hidden rounded-lg border border-gray-200 bg-white">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Listing
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Buyer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {order.listing.title}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {order.buyer.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      ${Number(order.totalAmount).toFixed(2)}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[order.status] ?? "bg-gray-100 text-gray-600"}`}
                      >
                        {order.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400">
                      {formatDistanceToNow(order.createdAt, {
                        addSuffix: true,
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
