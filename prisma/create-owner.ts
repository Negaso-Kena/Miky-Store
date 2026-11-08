// One-time setup: npm run owner (reads OWNER_* from the environment, not from source code).
import "dotenv/config";
import { hash } from "@node-rs/argon2";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const { OWNER_NAME, OWNER_USERNAME, OWNER_PASSWORD, DATABASE_URL } = process.env;
if (!OWNER_NAME || !OWNER_USERNAME || !OWNER_PASSWORD || !DATABASE_URL) {
  throw new Error("Set DATABASE_URL, OWNER_NAME, OWNER_USERNAME and OWNER_PASSWORD");
}
if (OWNER_PASSWORD.length < 12) throw new Error("Password must be at least 12 characters");

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: DATABASE_URL }) });

async function main() {
  if (await db.adminUser.count()) throw new Error("An admin already exists; use the dashboard to add staff");
  const passwordHash = await hash(OWNER_PASSWORD!, { algorithm: 2 }); // Argon2id
  await db.adminUser.create({
    data: { fullName: OWNER_NAME!, username: OWNER_USERNAME!.toLowerCase(), passwordHash, accountType: "OWNER" },
  });
  await db.storeSettings.upsert({
    where: { id: "default" }, update: {},
    create: { id: "default", storeName: "Miky Sound Systems & Electronics" },
  });
  console.log("Owner account and default store settings created.");
}
main().finally(() => db.$disconnect());
