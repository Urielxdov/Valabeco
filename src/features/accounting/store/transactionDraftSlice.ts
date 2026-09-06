import { createSlice, nanoid, type PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "@/src/store/store";

export type DraftEntry = {
  id: string;
  idAccount: string;
  debitAmount: string;
  creditAmount: string;
};

export type TransactionDraft = {
  description: string;
  date: string;
  entries: DraftEntry[];
};

type UpdateDraftEntryPayload = {
  id: string;
  changes: Partial<DraftEntry>;
};

const initialEntry = (): DraftEntry => ({
  id: nanoid(),
  idAccount: "",
  debitAmount: "",
  creditAmount: "",
});

const initialState = (): TransactionDraft => ({
  description: "",
  date: new Date().toISOString().slice(0, 10),
  entries: [initialEntry(), initialEntry()],
});

const transactionDraftSlice = createSlice({
  name: "transactionDraft",
  initialState: initialState(),
  reducers: {
    transactionDraftDescriptionChanged(state, action: PayloadAction<string>) {
      state.description = action.payload;
    },
    transactionDraftDateChanged(state, action: PayloadAction<string>) {
      state.date = action.payload;
    },
    transactionDraftEntryAdded(state, action: PayloadAction<DraftEntry>) {
      state.entries.push(action.payload);
    },
    transactionDraftEntryUpdated(state, action: PayloadAction<UpdateDraftEntryPayload>) {
      const entry = state.entries.find((item) => item.id === action.payload.id);

      if (!entry) {
        return;
      }

      Object.assign(entry, action.payload.changes);
    },
    transactionDraftEntryRemoved(state, action: PayloadAction<string>) {
      if (state.entries.length <= 2) {
        return;
      }

      state.entries = state.entries.filter((entry) => entry.id !== action.payload);
    },
    transactionDraftCleared() {
      return initialState();
    },
  },
});

export const {
  transactionDraftCleared,
  transactionDraftDateChanged,
  transactionDraftDescriptionChanged,
  transactionDraftEntryRemoved,
  transactionDraftEntryUpdated,
} = transactionDraftSlice.actions;

export const transactionDraftEntryAdded = () =>
  transactionDraftSlice.actions.transactionDraftEntryAdded(initialEntry());

export const transactionDraftReducer = transactionDraftSlice.reducer;

export const selectTransactionDraft = (state: RootState) => state.transactionDraft;

export const selectTransactionDraftTotals = (state: RootState) =>
  getDraftTotals(state.transactionDraft);

export const selectIsTransactionDraftBalanced = (state: RootState) =>
  isTransactionDraftBalanced(state.transactionDraft);

export function getDraftTotals(draft: TransactionDraft) {
  return draft.entries.reduce(
    (totals, entry) => ({
      debitTotal: totals.debitTotal + parseAmount(entry.debitAmount),
      creditTotal: totals.creditTotal + parseAmount(entry.creditAmount),
    }),
    { debitTotal: 0, creditTotal: 0 },
  );
}

export function toTransactionEntryInput(draft: TransactionDraft) {
  return draft.entries.flatMap(({ idAccount, debitAmount, creditAmount }) => {
    const entries: Array<{ idAccount: string; amount: string; type: "DEBIT" | "CREDIT" }> = [];

    if (parseAmount(debitAmount) > 0) {
      entries.push({ idAccount, amount: debitAmount, type: "DEBIT" });
    }

    if (parseAmount(creditAmount) > 0) {
      entries.push({ idAccount, amount: creditAmount, type: "CREDIT" });
    }

    return entries;
  });
}

function isTransactionDraftBalanced(draft: TransactionDraft) {
  const { debitTotal, creditTotal } = getDraftTotals(draft);
  const hasAccountForEveryAmount = draft.entries.every((entry) => {
    return !hasDraftAmount(entry) || Boolean(entry.idAccount);
  });
  const hasTwoEntries = draft.entries.filter(hasDraftAmount).length >= 2;

  return debitTotal > 0 && debitTotal === creditTotal && hasAccountForEveryAmount && hasTwoEntries;
}

function hasDraftAmount(entry: DraftEntry) {
  return parseAmount(entry.debitAmount) > 0 || parseAmount(entry.creditAmount) > 0;
}

function parseAmount(value: string) {
  const amount = Number(value);
  return Number.isFinite(amount) ? amount : 0;
}
