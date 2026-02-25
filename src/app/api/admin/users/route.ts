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
    "admin.manageUsers"
  );
  if (!authResult.authorized) {
    return NextResponse.json(
      { error: "FORBIDDEN", message: authResult.error },
      { status: 403 }
    );
  }

  const searchParams = request.nextUrl.searchParams;
  const page = Number(searchParams.get("page") ?? 1);
  const limit = Number(searchParams.get("limit") ?? 20);
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};
  const role = searchParams.get("role");
  const status = searchParams.get("status");
  const search = searchParams.get("search");

  if (role) where.role = role;
  if (status) where.accountStatus = status;
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
    ];
  }

  const [users, total] = await Promise.all([
    db.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        accountStatus: true,
        createdAt: true,
      },
    }),
    db.user.count({ where }),
  ]);

  return NextResponse.json({
    data: users,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}
