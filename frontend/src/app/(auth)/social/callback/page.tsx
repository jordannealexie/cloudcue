"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "../../../../hooks/useAuth";

export default function SocialAuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refresh, me } = useAuth();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const completeSocialLogin = async () => {
      const error = searchParams.get("error");

      if (error) {
        if (!cancelled) {
          setErrorMessage(error);
        }
        return;
      }

      const refreshed = await refresh();

      if ((refreshed as { meta?: { requestStatus?: string } })?.meta?.requestStatus !== "fulfilled") {
        if (!cancelled) {
          setErrorMessage("Unable to finalize social login. Please try again.");
        }
        return;
      }

      await me();

      if (!cancelled) {
        router.replace("/dashboard");
      }
    };

    completeSocialLogin();

    return () => {
      cancelled = true;
    };
  }, [me, refresh, router, searchParams]);

  return (
    <main className="auth-shell">
      <div className="auth-bg-orb auth-bg-orb-left" aria-hidden />
      <div className="auth-bg-orb auth-bg-orb-right" aria-hidden />
      <div className="auth-bg-grid" aria-hidden />
      <div className="auth-bg-arc" aria-hidden />
      <section className="auth-card mx-auto w-full max-w-[460px] p-6 sm:p-7">
        <h1 className="mb-2 text-[26px] font-bold tracking-[-0.03em]">Finishing sign in</h1>
        {errorMessage ? (
          <>
            <p className="rounded-[10px] border border-[var(--border)] bg-[var(--bg-card-2)] px-3 py-2 text-[13px] text-[var(--blush)]">
              {errorMessage}
            </p>
            <p className="mt-4 text-[12px] text-[var(--text-secondary)]">
              You can return to <Link href="/login" className="font-semibold text-[var(--accent)] hover:opacity-85">Sign in</Link>.
            </p>
          </>
        ) : (
          <p className="text-[13px] text-[var(--text-secondary)]">Please wait while CloudCue verifies your account.</p>
        )}
      </section>
    </main>
  );
}
