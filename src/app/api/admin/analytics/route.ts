import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { authorize } from "@/lib/rbac";
import { db } from "@/lib/db";

export async function GET() {
  // ── Authenticate ──
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
  }

  // ── Authorize ──
  const authResult = authorize(
    session.user.role,
    session.user.accountStatus,
    "admin.viewAnalytics"
  );
  if (!authResult.authorized) {
    return NextResponse.json(
      { error: "FORBIDDEN", message: authResult.error },
      { status: 403 }
    );
  }

  // ── Gather analytics ──
  const [
    totalUsers,
    totalSellers,
    totalListings,
    activeListings,
    totalOrders,
    pendingOrders,
    pendingApplications,
  ] = await Promise.all([
    db.user.count(),
    db.user.count({ where: { role: "SELLER" } }),
    db.listing.count(),
    db.listing.count({ where: { status: "ACTIVE" } }),
    db.order.count(),
    db.order.count({ where: { status: "PENDING" } }),
    db.sellerApplication.count({ where: { status: "PENDING" } }),
  ]);

  return NextResponse.json({
    data: {
      totalUsers,
      totalSellers,
      totalListings,
      activeListings,
      totalOrders,
      pendingOrders,
      pendingApplications,
    },
  });
}
