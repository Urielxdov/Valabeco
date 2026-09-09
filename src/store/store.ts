import { configureStore } from "@reduxjs/toolkit";
import { transactionDraftReducer } from "@/src/features/accounting/store/transactionDraftSlice";
import { sessionReducer } from "@/src/features/identity/store/sessionSlice";

export const makeStore = () =>
  configureStore({
    reducer: {
      transactionDraft: transactionDraftReducer,
      session: sessionReducer,
    },
  });

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
