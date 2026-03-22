"use client";

import { useMemo } from "react";
import { useTheme as useNextTheme } from "next-themes";
import { useAppDispatch, useAppSelector } from "./useAppStore";
import { setThemeMode } from "../store/slices/themeSlice";

export const useTheme = () => {
  const dispatch = useAppDispatch();
  const mode = useAppSelector((state) => state.theme.mode);
  const { theme, setTheme } = useNextTheme();

  return useMemo(
    () => ({
      mode,
      resolvedTheme: theme,
      setMode: (nextMode: "light" | "dark" | "system") => {
        dispatch(setThemeMode(nextMode));
        setTheme(nextMode);
      }
    }),
    [dispatch, mode, setTheme, theme]
  );
};
