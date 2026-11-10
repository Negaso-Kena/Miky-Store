// Recovery: run from the project folder on the machine that has database access.
import "dotenv/config";
import { hash } from "@node-rs/argon2";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const { RESET_USERNAME, RESET_PASSWORD, DATABASE_URL } = process.env;
if (!RESET_USERNAME || !RESET_PASSWORD || !DATABASE_URL) {
  throw new Error("Set DATABASE_URL, RESET_USERNAME and RESET_PASSWORD");
}
if (RESET_PASSWORD.length < 12) throw new Error("Password must be at least 12 characters");

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: DATABASE_URL }) });

async function main() {
  const user = await db.adminUser.findUnique({
    where: { username: RESET_USERNAME!.toLowerCase() },
  });
  if (!user) throw new Error("No admin with that username. Check the AdminUser table.");

  const passwordHash = await hash(RESET_PASSWORD!, { algorithm: 2 }); // Argon2id

  await db.$transaction([
    db.adminUser.update({
      where: { id: user.id },
      data: { passwordHash, isActive: true },
    }),
    db.adminSession.updateMany({
      where: { adminUserId: user.id, revokedAt: null },
      data: { revokedAt: new Date() },
    }),
    db.auditLog.create({
      data: {
        adminUserId: user.id,
        action: "PASSWORD_RESET",
        entityType: "AdminUser",
        entityId: user.id,
      },
    }),
  ]);

  console.log(`Password reset for "${user.username}". All old sessions were signed out.`);
}

main().finally(() => db.$disconnect());