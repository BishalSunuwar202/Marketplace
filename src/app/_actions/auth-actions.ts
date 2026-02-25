"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { signIn } from "@/lib/auth/auth";
import { registerSchema, loginSchema } from "@/lib/validations/auth-schemas";

export async function registerUser(formData: FormData) {
  const rawData = {
    name: formData.get("name") as string,
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };

  // ── Validate ──
  const parsed = registerSchema.safeParse(rawData);
  if (!parsed.success) {
    redirect("/auth/register?error=validation");
    return;
  }

  const { name, email, password } = parsed.data;

  // ── Check existing user ──
  const existingUser = await db.user.findUnique({ where: { email } });
  if (existingUser) {
    redirect("/auth/register?error=exists");
    return;
  }

  // ── Create user ──
  const passwordHash = await bcrypt.hash(password, 12);

  await db.user.create({
    data: {
      name,
      email,
      passwordHash,
    },
  });

  redirect("/auth/login?registered=true");
}

export async function loginUser(formData: FormData) {
  const rawData = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };

  // ── Validate ──
  const parsed = loginSchema.safeParse(rawData);
  if (!parsed.success) {
    redirect("/auth/login?error=validation");
    return;
  }

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirect: false,
    });
  } catch {
    redirect("/auth/login?error=credentials");
    return;
  }

  redirect("/dashboard/user");
}
