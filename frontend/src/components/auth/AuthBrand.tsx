"use client";

interface AuthBrandProps {
  subtitle: string;
  variant?: "compact" | "hero";
}

const CloudLogo = ({ hero = false }: { hero?: boolean }) => (
  <svg
    className={`cloudcue-logo ${hero ? "cloudcue-logo-hero" : ""}`.trim()}
    viewBox="0 0 120 70"
    role="img"
    aria-label="CloudCue logo"
  >
    <defs>
      <linearGradient id="cloudcueStroke" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#3D5387" />
        <stop offset="100%" stopColor="#7C83AD" />
      </linearGradient>
    </defs>
    <path
      className="cloudcue-logo-path"
      d="M22 49h66c10 0 18-7 18-17 0-10-8-18-18-18-1.9 0-3.7.3-5.4.8A20 20 0 0 0 45 18a15 15 0 0 0-23 13c0 9.9 8.2 18 18 18Z"
      fill="none"
      stroke="url(#cloudcueStroke)"
      strokeWidth="5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      className="cloudcue-logo-accent"
      d="M33 43h36"
      fill="none"
      stroke="#BFA9BA"
      strokeWidth="4"
      strokeLinecap="round"
    />
  </svg>
);

export default function AuthBrand({ subtitle, variant = "compact" }: AuthBrandProps) {
  if (variant === "hero") {
    return (
      <div className="auth-brand-hero">
        <span className="inline-flex" aria-hidden>
          <CloudLogo hero />
        </span>

        <h2 className="mt-4 text-[72px] font-extrabold tracking-[-0.05em] text-[var(--text-primary)]">CloudCue</h2>
        <p className="mt-3 max-w-[460px] text-[15px] leading-relaxed text-[var(--text-secondary)]">{subtitle}</p>
      </div>
    );
  }

  return (
    <div className="mb-7">
      <div className="mb-4 inline-flex items-center gap-3 rounded-full border border-[var(--border-subtle)] bg-[color-mix(in_srgb,var(--bg-card)_80%,white)] px-3 py-2">
        <span className="cloudcue-logo-wrap" aria-hidden>
          <CloudLogo />
        </span>
        <span className="text-[19px] font-extrabold tracking-[-0.02em] text-[var(--text-primary)]">CloudCue</span>
      </div>

      <p className="text-[13px] text-[var(--text-secondary)]">{subtitle}</p>
    </div>
  );
}
