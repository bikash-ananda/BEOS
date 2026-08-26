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

interface Values {
  token: string;
  password: string;
  confirmPassword: string;
  fullName?: string;
}

export function TokenPasswordForm({ mode }: { mode: "invite" | "reset" }) {
  const search = useSearchParams();
  const router = useRouter();
  const client = useQueryClient();
  const schema = z
    .object({
      token: z.string().min(20, "Paste the complete secure token").max(512),
      password: z.string().min(12, "Use at least 12 characters").max(128),
      confirmPassword: z.string().max(128),
      fullName: z.string().max(120).optional(),
    })
    .superRefine((value, context) => {
      if (value.password !== value.confirmPassword) {
        context.addIssue({
          code: "custom",
          path: ["confirmPassword"],
          message: "Passwords do not match",
        });
      }
      if (
        mode === "invite" &&
        (!value.fullName || value.fullName.trim().length < 2)
      ) {
        context.addIssue({
          code: "custom",
          path: ["fullName"],
          message: "Enter your full name",
        });
      }
    });
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      token: search.get("token") ?? "",
      fullName: "",
    },
  });

  const submit = form.handleSubmit(async (values) => {
    try {
      if (mode === "invite") {
        const session = await apiFetch<{ user: AuthUser }>(
          "/auth/accept-invite",
          {
            method: "POST",
            ...jsonBody({
              token: values.token,
              fullName: values.fullName!,
              password: values.password,
            }),
          },
        );
        client.setQueryData(["session"], session);
        router.replace("/");
      } else {
        await apiFetch<void>("/auth/complete-password-reset", {
          method: "POST",
          ...jsonBody({ token: values.token, password: values.password }),
        });
        router.replace("/login?reset=complete");
      }
    } catch (error) {
      form.setError("root", {
        message: error instanceof Error ? error.message : "Request failed",
      });
    }
  });

  return (
    <form className="auth-form" onSubmit={submit}>
      {mode === "invite" && (
        <Field
          label="Full name"
          autoComplete="name"
          maxLength={120}
          error={form.formState.errors.fullName?.message}
          {...form.register("fullName")}
        />
      )}
      <Field
        label="Secure token"
        autoComplete="off"
        maxLength={512}
        error={form.formState.errors.token?.message}
        {...form.register("token")}
      />
      <Field
        label="New password"
        type="password"
        autoComplete="new-password"
        maxLength={128}
        error={form.formState.errors.password?.message}
        {...form.register("password")}
      />
      <Field
        label="Confirm password"
        type="password"
        autoComplete="new-password"
        maxLength={128}
        error={form.formState.errors.confirmPassword?.message}
        {...form.register("confirmPassword")}
      />
      {form.formState.errors.root && (
        <p className="form-error" role="alert">
          {form.formState.errors.root.message}
        </p>
      )}
      <Button type="submit" disabled={form.formState.isSubmitting}>
        {form.formState.isSubmitting
          ? "Saving…"
          : mode === "invite"
            ? "Create my account"
            : "Set new password"}
      </Button>
      <p className="form-help">
        <Link href="/login">Return to sign in</Link>
      </p>
    </form>
  );
}
