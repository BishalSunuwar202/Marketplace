"use client";

import { useSession } from "next-auth/react";
import type { Role, AccountStatus } from "@/generated/prisma/enums";

export type CurrentUser = {
  id: string;
  name: string;
  email: string;
  image?: string | null;
  role: Role;
  accountStatus: AccountStatus;
};

export function useCurrentUser() {
  const { data: session, status } = useSession();

  const user: CurrentUser | null = session?.user
    ? {
        id: session.user.id,
        name: session.user.name ?? "",
        email: session.user.email ?? "",
        image: session.user.image,
        role: session.user.role,
        accountStatus: session.user.accountStatus,
      }
    : null;

  return {
    user,
    isLoading: status === "loading",
    isAuthenticated: status === "authenticated",
    isGuest: status === "unauthenticated",
  };
}
