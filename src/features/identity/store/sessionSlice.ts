import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { AuthResponse } from "@valabeco/contracts";

type SessionState = { current: AuthResponse | null };
const initialState: SessionState = { current: null };
const slice = createSlice({
  name: "session", initialState,
  reducers: {
    sessionStarted(state, action: PayloadAction<AuthResponse>) { state.current = action.payload; },
    sessionEnded(state) { state.current = null; },
  },
});
export const { sessionStarted, sessionEnded } = slice.actions;
export const sessionReducer = slice.reducer;
export const selectSession = (state: { session: SessionState }) => state.session.current;
