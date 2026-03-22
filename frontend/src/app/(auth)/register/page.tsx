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
    <main className="flex min-h-screen items-center justify-center p-4">
      <section className="surface-card w-full max-w-md p-6">
        <h1 className="mb-1 text-[28px] font-bold">Create your account</h1>
        <p className="mb-6 text-[14px] text-[var(--text-secondary)]">Free forever. No credit card needed.</p>

        <form className="space-y-4" onSubmit={handleSubmit(submit)}>
          <Input label="Full name" placeholder="Jane Smith" error={errors.name?.message} {...register("name")} />
          <Input label="Work email" type="email" placeholder="jane@company.com" error={errors.email?.message} {...register("email")} />
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
          <p className="text-[11px] text-[var(--text-secondary)]">
            By creating an account you agree to our Terms of Service and Privacy Policy.
          </p>
        </form>

        <p className="mt-4 text-[12px] text-[var(--text-secondary)]">
          Already have an account? <Link href="/login" className="text-[var(--accent)]">Sign in</Link>
        </p>
      </section>
    </main>
  );
}
