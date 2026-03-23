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

const avatarPalette = [
  "#3D5387",
  "#7C83AD",
  "#BFA9BA",
  "#243060",
  "#1E3A5F",
  "#4A5075",
  "#2E5B8A",
  "#3C4A6B"
];

const hashName = (value: string): number => {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return hash;
};

export default function Avatar({ name, src, size = "md" }: AvatarProps) {
  const initials = name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const bgColor = avatarPalette[hashName(name.trim().toLowerCase()) % avatarPalette.length];

  return (
    <div
      aria-label={`${name} avatar`}
      style={src ? undefined : { backgroundColor: bgColor, color: "#F6F8FF" }}
      className={`${sizeMap[size]} inline-flex items-center justify-center overflow-hidden rounded-full border border-[var(--border)] bg-[var(--bg-card-2)] font-semibold`}
    >
      {src ? <Image src={src} alt={`${name} avatar`} width={40} height={40} className="h-full w-full object-cover" /> : initials}
    </div>
  );
}
