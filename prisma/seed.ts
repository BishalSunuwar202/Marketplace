import { PrismaClient, Role } from "@/generated/prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const admins = [
    {
      email: "admin@system.com",
      name: "System Admin",
      role: Role.ADMIN,
      password: process.env.ADMIN1_PASSWORD,
    },
  ];

  for (const admin of admins) {
    if (!admin.password) {
      console.warn(`No password set for ${admin.email}, skipping...`);
      continue;
    }

    const hashed = await hash(admin.password, 12);

    await prisma.user.upsert({
      where: { email: admin.email },
      update: {},
      create: {
        email: admin.email,
        name: admin.name,
        passwordHash: hashed, // ✅ correct field name
        role: admin.role,     // ✅ use enum properly
      },
    });

    console.log(`Admin ${admin.email} created or already exists ✅`);
  }
} // ✅ close main function properly

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });