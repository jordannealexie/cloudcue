"use client";

import { ReactNode } from "react";
import Sidebar from "./Sidebar";
import MobileNav from "./MobileNav";
import Toast from "../ui/Toast";

interface PageWrapperProps {
  children: ReactNode;
}

export default function PageWrapper({ children }: PageWrapperProps) {
  return (
    <div className="min-h-screen bg-[var(--bg-page)] text-[var(--text-primary)]">
      <div className="flex min-h-screen w-full overflow-hidden">
        <Sidebar />
        <main className="page-enter flex-1 px-4 pb-24 pt-4 md:px-6 lg:px-8 lg:pb-8">{children}</main>
      </div>
      <MobileNav />
      <Toast />
    </div>
  );
}
