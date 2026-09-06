import { configureStore } from "@reduxjs/toolkit";
import { transactionDraftReducer } from "@/src/features/accounting/store/transactionDraftSlice";

export const makeStore = () =>
  configureStore({
    reducer: {
      transactionDraft: transactionDraftReducer,
    },
  });

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
