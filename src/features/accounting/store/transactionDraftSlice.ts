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
  const totals = draft.entries.reduce(
    (summary, entry) => ({
      debitCents: summary.debitCents + parseMoneyCents(entry.debitAmount),
      creditCents: summary.creditCents + parseMoneyCents(entry.creditAmount),
    }),
    { debitCents: 0, creditCents: 0 },
  );

  return {
    debitTotal: centsToDecimalString(totals.debitCents),
    creditTotal: centsToDecimalString(totals.creditCents),
    debitTotalCents: totals.debitCents,
    creditTotalCents: totals.creditCents,
  };
}

export function toTransactionEntryInput(draft: TransactionDraft) {
  return draft.entries.flatMap(({ idAccount, debitAmount, creditAmount }) => {
    const entries: Array<{ idAccount: string; amount: string; type: "DEBIT" | "CREDIT" }> = [];

    if (parseMoneyCents(debitAmount) > 0) {
      entries.push({ idAccount, amount: debitAmount, type: "DEBIT" });
    }

    if (parseMoneyCents(creditAmount) > 0) {
      entries.push({ idAccount, amount: creditAmount, type: "CREDIT" });
    }

    return entries;
  });
}

function isTransactionDraftBalanced(draft: TransactionDraft) {
  const { debitTotalCents, creditTotalCents } = getDraftTotals(draft);
  const hasAccountForEveryAmount = draft.entries.every((entry) => {
    return !hasDraftAmount(entry) || Boolean(entry.idAccount);
  });
  const hasTwoEntries = draft.entries.filter(hasDraftAmount).length >= 2;

  return (
    debitTotalCents > 0 &&
    debitTotalCents === creditTotalCents &&
    hasAccountForEveryAmount &&
    hasTwoEntries
  );
}

function hasDraftAmount(entry: DraftEntry) {
  return parseMoneyCents(entry.debitAmount) > 0 || parseMoneyCents(entry.creditAmount) > 0;
}

function parseMoneyCents(value: string) {
  const normalized = value.trim();

  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) {
    return 0;
  }

  const [units, cents = ""] = normalized.split(".");
  return parseInt(units, 10) * 100 + parseInt(cents.padEnd(2, "0"), 10);
}

function centsToDecimalString(cents: number) {
  const units = Math.trunc(cents / 100);
  const remainder = String(cents % 100).padStart(2, "0");

  return `${units}.${remainder}`;
}
