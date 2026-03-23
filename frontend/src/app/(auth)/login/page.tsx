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

const loginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters")
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading, error, accessToken } = useAuth();
  const showDbHint = Boolean(error?.toLowerCase().includes("database"));

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema)
  });

  useEffect(() => {
    if (accessToken) {
      router.push("/dashboard");
    }
  }, [accessToken, router]);

  const submit = async (values: LoginForm): Promise<void> => {
    await login(values);
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
          <h1 className="mb-1 text-[30px] font-bold tracking-[-0.03em]">Welcome back</h1>
          <p className="mb-6 text-[14px] text-[var(--text-secondary)]">Sign in to continue where you left off.</p>

          <form className="space-y-4" onSubmit={handleSubmit(submit)}>
            <Input label="Email" type="email" placeholder="you@cloudcue.app" error={errors.email?.message} {...register("email")} />
            <Input label="Password" type="password" placeholder="********" error={errors.password?.message} {...register("password")} />
            <p className="text-right text-[12px] text-[var(--text-secondary)]">
              <Link href="/forgot-password" className="font-semibold text-[var(--accent)] hover:opacity-85">Forgot your password?</Link>
            </p>
            {error ? <p className="text-[12px] text-[var(--blush)]">{error}</p> : null}
            {showDbHint ? (
              <p className="rounded-[10px] border border-[var(--border)] bg-[var(--bg-card-2)] px-3 py-2 text-[12px] text-[var(--text-secondary)]">
                Local setup tip: start PostgreSQL, then retry sign in.
              </p>
            ) : null}
            <Button type="submit" className="w-full" isLoading={isLoading}>
              Sign in
            </Button>
          </form>

          <div className="my-4 flex items-center gap-2 text-[11px] text-[var(--text-secondary)]">
            <span className="h-px flex-1 bg-[var(--border-subtle)]" />
            <span>or continue with</span>
            <span className="h-px flex-1 bg-[var(--border-subtle)]" />
          </div>

          <SocialSignInButtons compact />

          <p className="mt-4 text-[12px] text-[var(--text-secondary)]">
            Don't have an account? <Link href="/register" className="font-semibold text-[var(--accent)] hover:opacity-85">Create one free</Link>
          </p>

          <AuthLegalLinks leadText="By continuing you agree to our" />
        </section>

        <aside className="auth-side-panel hidden lg:block">
          <AuthBrand
            variant="hero"
            subtitle="A clean workspace for projects, pages, and tasks. Built for focused teams that move fast without chaos."
          />
          <div className="auth-side-note">
            <p className="text-[12px] uppercase tracking-[0.18em] text-[var(--text-hint)]">Built for daily flow</p>
            <p className="mt-2 text-[14px] leading-relaxed text-[var(--text-secondary)]">
              Organize work, collaborate in real time, and keep context close with pages and comments.
            </p>
          </div>
        </aside>
      </div>
    </main>
  );
}
