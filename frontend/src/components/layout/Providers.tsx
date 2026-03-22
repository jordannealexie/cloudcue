"use client";

import { ReactNode, useEffect } from "react";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { ThemeProvider } from "next-themes";
import { persistor, store } from "../../store";
import { setRefreshHandler } from "../../lib/apiClient";
import { refreshAccessTokenThunk } from "../../store/slices/authSlice";

interface ProvidersProps {
  children: ReactNode;
}

function SessionBridge(): null {
  useEffect(() => {
    setRefreshHandler(async () => {
      const result = await store.dispatch(refreshAccessTokenThunk());
      if (refreshAccessTokenThunk.fulfilled.match(result)) {
        return result.payload;
      }
      return null;
    });
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
