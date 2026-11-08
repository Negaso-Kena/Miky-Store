import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/security/session";
import LoginForm from "./LoginForm";

export const metadata: Metadata = {
  title: "Admin login",
  robots: { index: false, follow: false },
};

export default async function LoginPage() {
  if (await getAdminSession()) redirect("/admin");

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0b0a14] p-5 text-white">
      <LoginForm />
    </main>
  );
}