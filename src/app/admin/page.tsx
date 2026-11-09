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
    <main className="min-h-screen p-8">
      <h1 className="font-display text-3xl font-bold text-gold">Welcome, {admin.fullName}</h1>
      <p className="mt-2 text-muted">Signed in as {admin.username}.</p>
      <form action={logoutAction} className="mt-6">
        <button className="rounded-full border border-gold px-5 py-2 font-semibold text-gold hover:bg-gold hover:text-background">
          Sign out
        </button>
      </form>
    </main>
  );
}