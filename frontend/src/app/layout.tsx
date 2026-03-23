import type { Metadata } from "next";
import "./globals.css";
import Providers from "../components/layout/Providers";
import AppErrorBoundary from "../components/layout/AppErrorBoundary";

export const metadata: Metadata = {
  title: "CloudCue",
  description: "Cloud-based task management built for focused teams"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <AppErrorBoundary>
          <Providers>{children}</Providers>
        </AppErrorBoundary>
      </body>
    </html>
  );
}
