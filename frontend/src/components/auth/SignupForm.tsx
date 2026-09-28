"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button, ErrorText, Field, Input } from "@/components/common/ui";
import { useAuth } from "@/stores/auth";

export function SignupForm() {
  const signup = useAuth((s) => s.signup);
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "", username: "", display_name: "" });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [key]: e.target.value });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await signup(form);
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Signup failed");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="mx-auto flex max-w-sm flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold">Create an account</h1>
        <p className="mt-1 text-sm text-subtle">Like, comment on, save and follow the work you love.</p>
      </div>
      <Field label="Name">
        <Input required maxLength={100} value={form.display_name} onChange={set("display_name")} />
      </Field>
      <Field label="Username" hint="3 to 30 letters, numbers or underscores.">
        <Input required pattern="[A-Za-z0-9_]{3,30}" value={form.username} onChange={set("username")} />
      </Field>
      <Field label="Email">
        <Input type="email" required autoComplete="email" value={form.email} onChange={set("email")} />
      </Field>
      <Field label="Password" hint="At least 8 characters.">
        <Input
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          value={form.password}
          onChange={set("password")}
        />
      </Field>
      <ErrorText>{error}</ErrorText>
      <Button type="submit" disabled={busy}>
        {busy ? "Creating account…" : "Sign up"}
      </Button>
      <p className="text-sm text-subtle">
        Already have an account? <Link href="/login" className="underline">Log in</Link>
      </p>
    </form>
  );
}
