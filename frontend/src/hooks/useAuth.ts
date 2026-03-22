"use client";

import { useCallback, useMemo } from "react";
import { useAppDispatch, useAppSelector } from "./useAppStore";
import { fetchMeThunk, loginThunk, logoutThunk, refreshAccessTokenThunk, registerThunk } from "../store/slices/authSlice";

export const useAuth = () => {
  const dispatch = useAppDispatch();
  const auth = useAppSelector((state) => state.auth);

  const register = useCallback(
    (payload: { email: string; name: string; password: string }) => dispatch(registerThunk(payload)),
    [dispatch]
  );
  const login = useCallback(
    (payload: { email: string; password: string }) => dispatch(loginThunk(payload)),
    [dispatch]
  );
  const refresh = useCallback(() => dispatch(refreshAccessTokenThunk()), [dispatch]);
  const me = useCallback(() => dispatch(fetchMeThunk()), [dispatch]);
  const logout = useCallback(() => dispatch(logoutThunk()), [dispatch]);

  return useMemo(
    () => ({
      ...auth,
      register,
      login,
      refresh,
      me,
      logout
    }),
    [auth, login, logout, me, refresh, register]
  );
};
