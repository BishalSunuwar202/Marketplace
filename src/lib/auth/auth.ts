import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { AccountStatus } from "@/generated/prisma/enums";

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: {
    strategy: "jwt",
    maxAge: 5 * 60, // 5 minutes — short-lived for quick role propagation
  },

  pages: {
    signIn: "/auth/login",
    error: "/auth/login",
  },

  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await db.user.findUnique({
          where: { email: credentials.email as string },
        });

        if (!user || !user.passwordHash) {
          return null;
        }

        const passwordMatch = await bcrypt.compare(
          credentials.password as string,
          user.passwordHash
        );

        if (!passwordMatch) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.avatarUrl,
          role: user.role,
          accountStatus: user.accountStatus,
        };
      },
    }),
  ],

  callbacks: {
    async signIn({ user }) {
      // Block suspended and banned users at sign-in
      if (user.accountStatus === AccountStatus.SUSPENDED) {
        return false;
      }
      if (user.accountStatus === AccountStatus.BANNED) {
        return false;
      }
      return true;
    },

    async jwt({ token, user, trigger }) {
      // On initial sign-in, populate token with user data
      if (user) {
        token.id = user.id!;
        token.role = user.role;
        token.accountStatus = user.accountStatus;
      }

      // On token refresh or session update, re-fetch from database
      if (trigger === "update" || !user) {
        const dbUser = await db.user.findUnique({
          where: { id: token.id },
          select: { role: true, accountStatus: true },
        });

        if (dbUser) {
          token.role = dbUser.role;
          token.accountStatus = dbUser.accountStatus;
        }
      }

      return token;
    },

    async session({ session, token }) {
      // Map JWT claims onto session object
      session.user.id = token.id;
      session.user.role = token.role;
      session.user.accountStatus = token.accountStatus;
      return session;
    },
  },
});
