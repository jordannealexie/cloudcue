"use client";

import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { ToastState } from "../../types";

interface UiState {
  sidebarOpen: boolean;
  activeModal: string | null;
  slideOverTaskId: string | null;
  toast: ToastState | null;
}

const initialState: UiState = {
  sidebarOpen: false,
  activeModal: null,
  slideOverTaskId: null,
  toast: null
};

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    setSidebarOpen(state, action: PayloadAction<boolean>) {
      state.sidebarOpen = action.payload;
    },
    setActiveModal(state, action: PayloadAction<string | null>) {
      state.activeModal = action.payload;
    },
    setSlideOverTaskId(state, action: PayloadAction<string | null>) {
      state.slideOverTaskId = action.payload;
    },
    setToast(state, action: PayloadAction<ToastState | null>) {
      state.toast = action.payload;
    }
  }
});

export const { setSidebarOpen, setActiveModal, setSlideOverTaskId, setToast } = uiSlice.actions;
export default uiSlice.reducer;
