import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { authorize } from "@/lib/rbac";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  // ── Authenticate ──
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
  }

  // ── Authorize ──
  const authResult = authorize(
    session.user.role,
    session.user.accountStatus,
    "moderation.approveSellers"
  );
  if (!authResult.authorized) {
    return NextResponse.json(
      { error: "FORBIDDEN", message: authResult.error },
      { status: 403 }
    );
  }

  const searchParams = request.nextUrl.searchParams;
  const status = searchParams.get("status") ?? "PENDING";
  const page = Number(searchParams.get("page") ?? 1);
  const limit = Number(searchParams.get("limit") ?? 20);
  const skip = (page - 1) * limit;

  const [applications, total] = await Promise.all([
    db.sellerApplication.findMany({
      where: { status: status as "PENDING" | "APPROVED" | "REJECTED" },
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { name: true, email: true, createdAt: true } },
      },
    }),
    db.sellerApplication.count({
      where: { status: status as "PENDING" | "APPROVED" | "REJECTED" },
    }),
  ]);

  return NextResponse.json({
    data: applications,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}
