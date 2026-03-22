"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import Input from "../../../components/ui/Input";
import Button from "../../../components/ui/Button";
import { apiClient, getApiErrorMessage } from "../../../lib/apiClient";

const resetSchema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(8, "Please confirm your password")
  })
  .refine((value) => value.password === value.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match"
  });

type ResetForm = z.infer<typeof resetSchema>;

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDone, setIsDone] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<ResetForm>({
    resolver: zodResolver(resetSchema)
  });

  const submit = async (values: ResetForm): Promise<void> => {
    try {
      setIsSubmitting(true);
      setError(null);

      if (!token) {
        setError("Missing reset token");
        return;
      }

      await apiClient.post("/auth/reset-password", {
        token,
        password: values.password
      });

      setIsDone(true);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, "Unable to reset password"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <section className="surface-card w-full max-w-md p-6">
        {isDone ? (
          <div className="space-y-4">
            <h1 className="text-[28px] font-bold">Password updated</h1>
            <p className="text-[14px] text-[var(--text-secondary)]">Your password has been reset. You can sign in now.</p>
            <Link href="/login" className="text-[13px] text-[var(--accent)]">
              Go to sign in
            </Link>
          </div>
        ) : (
          <>
            <h1 className="mb-1 text-[28px] font-bold">Set a new password</h1>
            <p className="mb-6 text-[14px] text-[var(--text-secondary)]">Choose a secure password for your account.</p>

            <form className="space-y-4" onSubmit={handleSubmit(submit)}>
              <Input
                label="New password"
                type="password"
                placeholder="********"
                error={errors.password?.message}
                {...register("password")}
              />
              <Input
                label="Confirm new password"
                type="password"
                placeholder="********"
                error={errors.confirmPassword?.message}
                {...register("confirmPassword")}
              />
              {error ? <p className="text-[12px] text-[var(--blush)]">{error}</p> : null}
              <Button type="submit" className="w-full" isLoading={isSubmitting}>
                Reset password
              </Button>
            </form>
          </>
        )}
      </section>
    </main>
  );
}
