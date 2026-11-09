"use client";

import { useActionState } from "react";
import { loginAction } from "@/modules/auth/actions";

export default function LoginForm() {
  const [state, action, pending] = useActionState(
    loginAction,
    {} as { error?: string },
  );

    return (
    <form action={action} className="w-full max-w-sm rounded-2xl border border-line bg-surface p-6">
      <h1 className="mb-6 font-display text-2xl font-bold text-gold">Admin login</h1>

      <label htmlFor="username" className="mb-1 block text-sm font-semibold">
        Username
      </label>
      <input
        id="username"
        name="username"
        autoComplete="username"
        required
        className="mb-4 w-full rounded-xl border border-line bg-background px-3 py-3"
      />

      <label htmlFor="password" className="mb-1 block text-sm font-semibold">
        Password
      </label>
      <input
        id="password"
        name="password"
        type="password"
        autoComplete="current-password"
        required
        className="mb-4 w-full rounded-xl border border-line bg-background px-3 py-3"
      />

      <p role="alert" aria-live="polite" className="mb-3 min-h-5 text-sm text-danger">
        {state.error}
      </p>

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-full bg-gold py-3 font-bold text-background hover:bg-gold-light disabled:opacity-60"
      >
        {pending ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}