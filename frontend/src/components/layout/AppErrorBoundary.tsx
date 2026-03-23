"use client";

import { Component, ErrorInfo, ReactNode } from "react";
import Button from "../ui/Button";

interface AppErrorBoundaryProps {
  children: ReactNode;
}

interface AppErrorBoundaryState {
  hasError: boolean;
}

export default class AppErrorBoundary extends Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = {
    hasError: false
  };

  static getDerivedStateFromError(): AppErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, _errorInfo: ErrorInfo): void {
    console.error("CloudCue render error boundary caught:", error);
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <main className="flex min-h-screen items-center justify-center p-4">
        <section className="surface-card w-full max-w-lg p-6 text-center">
          <h1 className="text-[28px] font-bold">Something went wrong</h1>
          <p className="mt-2 text-[14px] text-[var(--text-secondary)]">
            We hit an unexpected issue while rendering this page.
          </p>
          <div className="mt-5 flex justify-center">
            <Button
              onClick={() => {
                window.location.reload();
              }}
            >
              Reload page
            </Button>
          </div>
        </section>
      </main>
    );
  }
}
