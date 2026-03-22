"use client";

import Image from "next/image";

interface AvatarProps {
  name: string;
  src?: string | null;
  size?: "sm" | "md" | "lg";
}

const sizeMap = {
  sm: "h-6 w-6 text-[10px]",
  md: "h-8 w-8 text-[11px]",
  lg: "h-10 w-10 text-[12px]"
};

export default function Avatar({ name, src, size = "md" }: AvatarProps) {
  const initials = name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div
      aria-label={`${name} avatar`}
      className={`${sizeMap[size]} inline-flex items-center justify-center overflow-hidden rounded-full border border-[var(--border)] bg-[var(--bg-card-2)] text-[var(--text-secondary)] font-semibold`}
    >
      {src ? <Image src={src} alt={`${name} avatar`} width={40} height={40} className="h-full w-full object-cover" /> : initials}
    </div>
  );
}
