import type { Metadata } from "next";
import { requireAdmin } from "@/lib/security/session";
import { logoutAction } from "@/modules/auth/actions";

export const metadata: Metadata = {
  title: "Admin dashboard",
  robots: { index: false, follow: false },
};

export default async function AdminHome() {
  const { admin } = await requireAdmin();

  return (
    <main className="min-h-screen bg-[#0b0a14] p-8 text-white">
      <h1 className="text-2xl font-bold">Welcome, {admin.fullName}</h1>
      <p className="mt-2 text-[#a9a4c9]">Signed in as {admin.username}.</p>
      <form action={logoutAction} className="mt-6">
        <button className="rounded-full border border-[#6a3df0] px-5 py-2 font-semibold">
          Sign out
        </button>
      </form>
    </main>
  );
}