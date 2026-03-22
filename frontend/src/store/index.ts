"use client";

import { configureStore, combineReducers } from "@reduxjs/toolkit";
import {
  FLUSH,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
  REHYDRATE,
  persistReducer,
  persistStore
} from "redux-persist";
import storage from "redux-persist/lib/storage";
import authReducer from "./slices/authSlice";
import projectsReducer from "./slices/projectsSlice";
import tasksReducer from "./slices/tasksSlice";
import uiReducer from "./slices/uiSlice";
import themeReducer from "./slices/themeSlice";
import workspaceReducer from "./slices/workspaceSlice";
import commentsReducer from "./slices/commentsSlice";
import notificationsReducer from "./slices/notificationsSlice";

const rootReducer = combineReducers({
  auth: authReducer,
  projects: projectsReducer,
  tasks: tasksReducer,
  ui: uiReducer,
  theme: themeReducer,
  workspace: workspaceReducer,
  comments: commentsReducer,
  notifications: notificationsReducer
});

const persistedReducer = persistReducer(
  {
    key: "cloudcue-root",
    storage,
    whitelist: ["auth", "theme"]
  },
  rootReducer
);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER]
      }
    })
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof rootReducer>;
export type AppDispatch = typeof store.dispatch;
