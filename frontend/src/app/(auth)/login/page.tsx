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
    <main className="flex min-h-screen items-center justify-center p-4">
      <section className="surface-card w-full max-w-md p-6">
        <h1 className="mb-1 text-[28px] font-bold">Welcome back</h1>
        <p className="mb-6 text-[14px] text-[var(--text-secondary)]">Sign in to your CloudCue workspace.</p>

        <form className="space-y-4" onSubmit={handleSubmit(submit)}>
          <Input label="Email" type="email" placeholder="you@cloudcue.app" error={errors.email?.message} {...register("email")} />
          <Input label="Password" type="password" placeholder="********" error={errors.password?.message} {...register("password")} />
          <p className="text-right text-[12px]">
            <Link href="/forgot-password" className="text-[var(--accent)]">Forgot your password?</Link>
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

        <div className="grid gap-2">
          <button type="button" className="surface-elevated rounded-[10px] px-4 py-2 text-left text-[13px]">
            G Continue with Google
          </button>
          <button type="button" className="surface-elevated rounded-[10px] px-4 py-2 text-left text-[13px]">
            Apple Continue with Apple
          </button>
        </div>

        <p className="mt-4 text-[12px] text-[var(--text-secondary)]">
          Don't have an account? <Link href="/register" className="text-[var(--accent)]">Create one free</Link>
        </p>
      </section>
    </main>
  );
}
