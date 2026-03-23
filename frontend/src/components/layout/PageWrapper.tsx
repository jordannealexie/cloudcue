"use client";

import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import Sidebar from "./Sidebar";
import MobileNav from "./MobileNav";
import Toast from "../ui/Toast";

interface PageWrapperProps {
  children: ReactNode;
}

export default function PageWrapper({ children }: PageWrapperProps) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-[var(--bg-page)] text-[var(--text-primary)]">
      <div className="flex min-h-screen w-full overflow-hidden">
        <Sidebar />
        <motion.main
          key={pathname}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.16, ease: "easeOut" }}
          className="page-enter flex-1 px-4 pb-24 pt-4 md:px-6 lg:px-8 lg:pb-8"
        >
          {children}
        </motion.main>
      </div>
      <MobileNav />
      <Toast />
    </div>
  );
}
