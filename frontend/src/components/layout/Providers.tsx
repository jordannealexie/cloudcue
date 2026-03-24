"use client";

import { ReactNode, useEffect } from "react";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { ThemeProvider } from "next-themes";
import { persistor, store } from "../../store";
import { setAccessToken, setRefreshHandler } from "../../lib/apiClient";
import { clearSession, refreshAccessTokenThunk } from "../../store/slices/authSlice";

interface ProvidersProps {
  children: ReactNode;
}

function SessionBridge(): null {
  useEffect(() => {
    const persistedToken = store.getState().auth.accessToken;
    setAccessToken(persistedToken ?? null);

    setRefreshHandler(async () => {
      const result = await store.dispatch(refreshAccessTokenThunk());
      if (refreshAccessTokenThunk.fulfilled.match(result)) {
        return result.payload;
      }

      store.dispatch(clearSession());
      return null;
    });

    const storedFont = window.localStorage.getItem("cloudcue:fontFamily");
    if (storedFont) {
      document.documentElement.style.setProperty("--app-font-family", storedFont);
    }
  }, []);

  return null;
}

export default function Providers({ children }: ProvidersProps) {
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <ThemeProvider attribute="data-theme" defaultTheme="system" enableSystem>
          <SessionBridge />
          {children}
        </ThemeProvider>
      </PersistGate>
    </Provider>
  );
}
