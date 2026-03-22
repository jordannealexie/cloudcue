"use client";

import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../../hooks/useAppStore";
import { setToast } from "../../store/slices/uiSlice";

export default function Toast() {
  const dispatch = useAppDispatch();
  const toast = useAppSelector((state) => state.ui.toast);

  useEffect(() => {
    if (!toast) {
      return;
    }

    const timer = setTimeout(() => {
      dispatch(setToast(null));
    }, 3000);

    return () => clearTimeout(timer);
  }, [dispatch, toast]);

  if (!toast) {
    return null;
  }

  const toneClass =
    toast.type === "success"
      ? "bg-[var(--accent)] text-[var(--accent-text)]"
      : toast.type === "error"
        ? "bg-[var(--blush)] text-[var(--text-primary)]"
        : "bg-[var(--bg-modal)] text-[var(--text-primary)] border border-[var(--border)]";

  return (
    <div className="pointer-events-none fixed left-1/2 top-4 z-[100] w-[calc(100%-2rem)] -translate-x-1/2 sm:left-auto sm:right-4 sm:w-[320px] sm:translate-x-0">
      <div className={`rounded-xl px-4 py-3 text-[14px] font-medium shadow-lg animate-[slide-in_240ms_ease-out] ${toneClass}`}>
        {toast.message}
      </div>
    </div>
  );
}
