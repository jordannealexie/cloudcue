"use client";

interface SocialSignInButtonsProps {
  compact?: boolean;
}

export default function SocialSignInButtons({ compact = false }: SocialSignInButtonsProps) {
  const gapClass = compact ? "gap-2" : "gap-3";

  return (
    <div className={`grid ${gapClass}`}>
      <button
        type="button"
        className="auth-social-btn"
        aria-label="Continue with Google"
      >
        <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" aria-hidden>
          <path
            fill="#4285F4"
            d="M23.49 12.27c0-.79-.07-1.54-.2-2.27H12v4.3h6.46a5.53 5.53 0 0 1-2.4 3.63v3h3.88c2.27-2.1 3.55-5.2 3.55-8.66Z"
          />
          <path
            fill="#34A853"
            d="M12 24c3.24 0 5.95-1.08 7.93-2.93l-3.88-3c-1.08.73-2.47 1.16-4.05 1.16-3.11 0-5.74-2.1-6.68-4.93H1.31v3.1A12 12 0 0 0 12 24Z"
          />
          <path
            fill="#FBBC05"
            d="M5.32 14.3A7.2 7.2 0 0 1 4.94 12c0-.8.14-1.56.38-2.3V6.6H1.31A12 12 0 0 0 0 12c0 1.94.46 3.78 1.31 5.4l4.01-3.1Z"
          />
          <path
            fill="#EA4335"
            d="M12 4.77c1.76 0 3.34.6 4.58 1.77l3.43-3.42C17.94 1.18 15.24 0 12 0A12 12 0 0 0 1.31 6.6l4.01 3.1C6.26 6.87 8.89 4.77 12 4.77Z"
          />
        </svg>
        <span>Continue with Google</span>
      </button>

      <button
        type="button"
        className="auth-social-btn"
        aria-label="Continue with Apple"
      >
        <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" aria-hidden>
          <path
            fill="currentColor"
            d="M17.57 12.62c.03 2.93 2.57 3.9 2.6 3.91-.02.07-.4 1.4-1.3 2.76-.79 1.18-1.6 2.36-2.9 2.39-1.27.03-1.68-.76-3.13-.76-1.46 0-1.92.74-3.1.78-1.24.05-2.2-1.25-2.99-2.42-1.62-2.34-2.86-6.6-1.2-9.48.83-1.43 2.31-2.34 3.93-2.37 1.23-.02 2.39.84 3.14.84.76 0 2.17-1.03 3.66-.88.62.03 2.38.25 3.5 1.9-.09.05-2.08 1.22-2.06 3.63Zm-2.6-9.93c.66-.8 1.11-1.9.99-3.01-.96.04-2.12.64-2.8 1.44-.62.71-1.16 1.85-1.02 2.94 1.08.08 2.17-.55 2.83-1.37Z"
          />
        </svg>
        <span>Continue with Apple</span>
      </button>
    </div>
  );
}
