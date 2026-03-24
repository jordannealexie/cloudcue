"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import Input from "../../../components/ui/Input";
import Button from "../../../components/ui/Button";
import { useAuth } from "../../../hooks/useAuth";
import AuthBrand from "../../../components/auth/AuthBrand";
import SocialSignInButtons from "../../../components/auth/SocialSignInButtons";
import AuthLegalLinks from "../../../components/auth/AuthLegalLinks";

const registerSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Enter a valid email"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(8, "Please confirm your password")
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"]
  });

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const { register: registerAccount, isLoading, error, accessToken } = useAuth();
  const showDbHint = Boolean(error?.toLowerCase().includes("database"));

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema)
  });

  useEffect(() => {
    if (accessToken) {
      router.push("/dashboard");
    }
  }, [accessToken, router]);

  const submit = async (values: RegisterForm): Promise<void> => {
    await registerAccount({ email: values.email, name: values.name, password: values.password });
  };

  return (
    <main className="auth-shell">
      <div className="auth-bg-orb auth-bg-orb-left" aria-hidden />
      <div className="auth-bg-orb auth-bg-orb-right" aria-hidden />
      <div className="auth-bg-grid" aria-hidden />
      <div className="auth-bg-arc" aria-hidden />
      <div className="auth-bg-spark" aria-hidden />
      <div className="auth-bg-ribbon" aria-hidden />
      <div className="auth-bg-dots" aria-hidden />
      <div className="auth-bg-beam auth-bg-beam-left" aria-hidden />
      <div className="auth-bg-beam auth-bg-beam-right" aria-hidden />
      <div className="auth-bg-ring-small" aria-hidden />

      <div className="auth-split w-full max-w-[1180px] items-center">
        <section className="auth-card w-full max-w-[440px] p-6 sm:p-7">
          <h1 className="mb-1 text-[30px] font-bold tracking-[-0.03em]">Create your account</h1>
          <p className="mb-6 text-[14px] text-[var(--text-secondary)]">Free forever. No credit card needed.</p>

          <form className="space-y-4" onSubmit={handleSubmit(submit)}>
            <Input label="Full name" placeholder="Full Name" error={errors.name?.message} {...register("name")} />
            <Input label="Email" type="email" placeholder="email@example.com" error={errors.email?.message} {...register("email")} />
            <Input label="Password" type="password" placeholder="Create a strong password" error={errors.password?.message} {...register("password")} />
            <Input label="Confirm Password" type="password" placeholder="********" error={errors.confirmPassword?.message} {...register("confirmPassword")} />
            {error ? <p className="text-[12px] text-[var(--blush)]">{error}</p> : null}
            {showDbHint ? (
              <p className="rounded-[10px] border border-[var(--border)] bg-[var(--bg-card-2)] px-3 py-2 text-[12px] text-[var(--text-secondary)]">
                Local setup tip: start PostgreSQL, then retry creating your account.
              </p>
            ) : null}
            <Button type="submit" className="w-full" isLoading={isLoading}>
              Create account
            </Button>
            <AuthLegalLinks leadText="By creating an account you agree to our" />
          </form>

          <div className="my-4 flex items-center gap-2 text-[11px] text-[var(--text-secondary)]">
            <span className="h-px flex-1 bg-[var(--border-subtle)]" />
            <span>or continue with</span>
            <span className="h-px flex-1 bg-[var(--border-subtle)]" />
          </div>

          <SocialSignInButtons compact />

          <p className="mt-4 text-[12px] text-[var(--text-secondary)]">
            Already have an account? <Link href="/login" className="font-semibold text-[var(--accent)] hover:opacity-85">Sign in</Link>
          </p>
        </section>

        <aside className="auth-side-panel hidden lg:block">
          <AuthBrand
            variant="hero"
            subtitle="Start with one project, scale to many teams. Keep tasks, pages, and comments in one calm workspace."
          />
          <div className="auth-side-note">
            <p className="text-[12px] uppercase tracking-[0.18em] text-[var(--text-hint)]">Minimal, focused, collaborative</p>
            <p className="mt-2 text-[14px] leading-relaxed text-[var(--text-secondary)]">
              CloudCue is designed to keep your team aligned without visual clutter.
            </p>
          </div>
        </aside>
      </div>
    </main>
  );
}
