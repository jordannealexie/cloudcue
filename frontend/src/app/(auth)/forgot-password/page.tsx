"use client";

import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import Input from "../../../components/ui/Input";
import Button from "../../../components/ui/Button";
import { apiClient, getApiErrorMessage } from "../../../lib/apiClient";

const forgotSchema = z.object({
  email: z.string().email("Enter a valid email")
});

type ForgotForm = z.infer<typeof forgotSchema>;

export default function ForgotPasswordPage() {
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<ForgotForm>({
    resolver: zodResolver(forgotSchema)
  });

  const submit = async (values: ForgotForm): Promise<void> => {
    try {
      setIsSubmitting(true);
      setError(null);
      await apiClient.post("/auth/forgot-password", values);
      setSubmittedEmail(values.email);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, "Unable to send reset link"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <section className="surface-card w-full max-w-md p-6">
        {submittedEmail ? (
          <div className="space-y-4">
            <h1 className="text-[28px] font-bold">Check your inbox</h1>
            <p className="text-[14px] text-[var(--text-secondary)]">
              We sent a reset link to {submittedEmail}. It expires in 30 minutes.
            </p>
            <Button onClick={() => void submit({ email: submittedEmail })} isLoading={isSubmitting} className="w-full">
              Resend reset link
            </Button>
            <p className="text-[12px] text-[var(--text-secondary)]">
              <Link href="/login" className="text-[var(--accent)]">Back to sign in</Link>
            </p>
          </div>
        ) : (
          <>
            <h1 className="mb-1 text-[28px] font-bold">Reset your password</h1>
            <p className="mb-6 text-[14px] text-[var(--text-secondary)]">
              Enter your email and we will send you a reset link.
            </p>

            <form className="space-y-4" onSubmit={handleSubmit(submit)}>
              <Input
                label="Email address"
                type="email"
                placeholder="your@email.com"
                error={errors.email?.message}
                {...register("email")}
              />
              {error ? <p className="text-[12px] text-[var(--blush)]">{error}</p> : null}
              <Button type="submit" className="w-full" isLoading={isSubmitting}>
                Send reset link
              </Button>
            </form>

            <p className="mt-4 text-[12px] text-[var(--text-secondary)]">
              <Link href="/login" className="text-[var(--accent)]">Back to sign in</Link>
            </p>
          </>
        )}
      </section>
    </main>
  );
}
