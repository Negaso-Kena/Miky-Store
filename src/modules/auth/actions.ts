"use server";

import { hash, verify } from "@node-rs/argon2";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db/client";
import {
  createSession,
  destroySession,
  getAdminSession,
} from "@/lib/security/session";
import {
  clearFailures,
  isBlocked,
  recordFailure,
} from "@/lib/security/rate-limit";

const loginSchema = z.object({
  username: z.string().trim().min(1).max(60),
  password: z.string().min(1).max(200),
});

// Used so a wrong username takes about as long to reject as a wrong password.
const DUMMY_HASH = hash("not-a-real-password", { algorithm: 2 });

export async function loginAction(
  _prev: { error?: string },
  formData: FormData,
): Promise<{ error?: string }> {
  const parsed = loginSchema.safeParse({
    username: formData.get("username"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: "Enter your username and password." };

  const username = parsed.data.username.toLowerCase();
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  const key = `${ip}:${username}`;

  if (isBlocked(key)) {
    return { error: "Too many failed attempts. Try again in 15 minutes." };
  }

  const user = await db.adminUser.findUnique({ where: { username } });
  const passwordOk = await verify(
    user?.passwordHash ?? (await DUMMY_HASH),
    parsed.data.password,
  );

  if (!user || !user.isActive || !passwordOk) {
    recordFailure(key);
    return { error: "Incorrect username or password." };
  }

  clearFailures(key);
  await createSession(user.id);
  await db.auditLog.create({
    data: { adminUserId: user.id, action: "LOGIN", entityType: "AdminUser", entityId: user.id },
  });

  redirect("/admin");
}

export async function logoutAction() {
  const session = await getAdminSession();
  await destroySession();
  if (session) {
    await db.auditLog.create({
      data: {
        adminUserId: session.admin.id,
        action: "LOGOUT",
        entityType: "AdminUser",
        entityId: session.admin.id,
      },
    });
  }
  redirect("/admin/login");
}