"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { apiFetch, jsonBody } from "@/lib/api";
import type { AuthUser } from "@/lib/types";
import { Button, Field } from "../ui";

const schema = z.object({
  email: z.email("Enter a valid email address"),
  password: z.string().min(1, "Enter your password"),
});
type Values = z.infer<typeof schema>;

export function LoginForm() {
  const router = useRouter();
  const search = useSearchParams();
  const client = useQueryClient();
  const form = useForm<Values>({ resolver: zodResolver(schema) });

  const submit = form.handleSubmit(async (values) => {
    try {
      const session = await apiFetch<{ user: AuthUser }>("/auth/login", {
        method: "POST",
        ...jsonBody(values),
      });
      client.setQueryData(["session"], session);
      router.replace(
        search.get("next")?.startsWith("/") ? search.get("next")! : "/",
      );
    } catch (error) {
      form.setError("root", {
        message: error instanceof Error ? error.message : "Sign in failed",
      });
    }
  });

  return (
    <form className="auth-form" onSubmit={submit}>
      <Field
        label="Work email"
        type="email"
        autoComplete="email"
        placeholder="name@company.com"
        error={form.formState.errors.email?.message}
        {...form.register("email")}
      />
      <Field
        label="Password"
        type="password"
        autoComplete="current-password"
        error={form.formState.errors.password?.message}
        {...form.register("password")}
      />
      {form.formState.errors.root && (
        <p className="form-error" role="alert">
          {form.formState.errors.root.message}
        </p>
      )}
      <Button type="submit" disabled={form.formState.isSubmitting}>
        {form.formState.isSubmitting ? "Signing in…" : "Enter workspace"}
      </Button>
      <p className="form-help">
        Need access? Ask a BEOS administrator for an invitation. If you received
        a reset link, <Link href="/reset-password">use it here</Link>.
      </p>
    </form>
  );
}
