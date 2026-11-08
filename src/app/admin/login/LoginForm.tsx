"use client";

import { useActionState } from "react";
import { loginAction } from "@/modules/auth/actions";

export default function LoginForm() {
  const [state, action, pending] = useActionState(
    loginAction,
    {} as { error?: string },
  );

  return (
    <form action={action} className="w-full max-w-sm rounded-2xl border border-[#2e2a54] bg-[#15132a] p-6">
      <h1 className="mb-6 text-2xl font-bold">Admin login</h1>

      <label htmlFor="username" className="mb-1 block text-sm font-semibold">
        Username
      </label>
      <input
        id="username"
        name="username"
        autoComplete="username"
        required
        className="mb-4 w-full rounded-xl border border-[#2e2a54] bg-[#0f0d20] px-3 py-3"
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
        className="mb-4 w-full rounded-xl border border-[#2e2a54] bg-[#0f0d20] px-3 py-3"
      />

      <p role="alert" aria-live="polite" className="mb-3 min-h-5 text-sm text-[#ff8da1]">
        {state.error}
      </p>

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-full bg-gradient-to-r from-[#6a3df0] to-[#c24bf0] py-3 font-bold disabled:opacity-60"
      >
        {pending ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}