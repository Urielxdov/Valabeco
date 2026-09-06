"use client";

import Link from "next/link";
import {
  ArrowLeft,
  BadgeCheck,
  Banknote,
  BookOpen,
  Building2,
  CheckCircle2,
  FileText,
  Landmark,
  LayoutDashboard,
  LineChart,
  LockKeyhole,
  Plus,
  RefreshCw,
  Search,
  Send,
  ShieldCheck,
  Trash2,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  selectIsTransactionDraftBalanced,
  selectTransactionDraft,
  selectTransactionDraftTotals,
  toTransactionEntryInput,
  transactionDraftCleared,
  transactionDraftDateChanged,
  transactionDraftDescriptionChanged,
  transactionDraftEntryAdded,
  transactionDraftEntryRemoved,
  transactionDraftEntryUpdated,
  type DraftEntry,
  type TransactionDraft,
} from "@/src/features/accounting/store/transactionDraftSlice";
import { useAppDispatch, useAppSelector } from "@/src/store/hooks";

type AccountType = "ASSET" | "LIABILITY" | "EQUITY" | "REVENUE" | "EXPENSE";
type EntryType = "DEBIT" | "CREDIT";
type TransactionStatus = "DRAFT" | "POSTED" | "VOIDED";
type View = "summary" | "accounts" | "ledger" | "new-entry" | "entry-detail";

type Account = {
  idAccount: string;
  name: string;
  description: string | null;
  type: AccountType;
  balance: string;
};

type TransactionEntry = {
  idTransactionEntry: string;
  idTransaction: string;
  idAccount: string;
  amount: string;
  type: EntryType;
};

type Transaction = {
  idTransaction: string;
  date: string;
  description: string;
  status: TransactionStatus;
  entries: TransactionEntry[];
};

const accountTypeLabels: Record<AccountType, string> = {
  ASSET: "Activo",
  LIABILITY: "Pasivo",
  EQUITY: "Patrimonio",
  REVENUE: "Ingreso",
  EXPENSE: "Gasto",
};

const statusLabels: Record<TransactionStatus, string> = {
  DRAFT: "Borrador",
  POSTED: "Contabilizado",
  VOIDED: "Anulado",
};

const statusIcons = {
  DRAFT: FileText,
  POSTED: CheckCircle2,
  VOIDED: XCircle,
} satisfies Record<TransactionStatus, typeof FileText>;

const money = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
});

function parseAmount(value: string) {
  const amount = Number(value);
  return Number.isFinite(amount) ? amount : 0;
}

function formatMoney(value: number) {
  return money.format(value);
}

function shortId(id: string) {
  return id.slice(0, 8).toUpperCase();
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-MX", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

type AccountingAppProps = {
  initialAccountId?: string;
  initialTransactionId?: string;
  initialView?: View;
};

export default function Home() {
  return <AccountingApp initialView="summary" />;
}

export function AccountingApp({
  initialAccountId = "",
  initialTransactionId = "",
  initialView = "summary",
}: AccountingAppProps) {
  const dispatch = useAppDispatch();
  const transactionDraft = useAppSelector(selectTransactionDraft);
  const { debitTotal, creditTotal } = useAppSelector(selectTransactionDraftTotals);
  const isBalanced = useAppSelector(selectIsTransactionDraftBalanced);
  const [view, setView] = useState<View>(initialView);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string>(initialAccountId);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [accountFilter, setAccountFilter] = useState<"ALL" | AccountType>("ALL");
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [accountForm, setAccountForm] = useState({
    name: "",
    description: "",
    type: "ASSET" as AccountType,
  });

  useEffect(() => {
    const controller = new AbortController();

    async function loadInitialAccounts() {
      try {
        const response = await fetch("/api/accounts", {
          cache: "no-store",
          signal: controller.signal,
        });
        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload?.error?.message ?? "No se pudo cargar cuentas.");
        }

        const data: Account[] = payload.data ?? [];
        setAccounts(data);
        setSelectedAccountId((current) => current || data[0]?.idAccount || "");
      } catch (caught) {
        if (caught instanceof DOMException && caught.name === "AbortError") {
          return;
        }

        setError(caught instanceof Error ? caught.message : "Error inesperado.");
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    void loadInitialAccounts();

    return () => controller.abort();
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    async function loadInitialTransactions() {
      try {
        const response = await fetch("/api/transactions", {
          cache: "no-store",
          signal: controller.signal,
        });
        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload?.error?.message ?? "No se pudo cargar movimientos.");
        }

        const data: Transaction[] = payload.data ?? [];
        setTransactions(data);

        if (initialTransactionId) {
          const transaction = data.find((item) => item.idTransaction === initialTransactionId);
          setSelectedTransaction(transaction ?? null);
        } else if (initialView === "entry-detail") {
          setSelectedTransaction(data[0] ?? null);
        }
      } catch (caught) {
        if (caught instanceof DOMException && caught.name === "AbortError") {
          return;
        }

        setError(caught instanceof Error ? caught.message : "Error inesperado.");
      }
    }

    void loadInitialTransactions();

    return () => controller.abort();
  }, [initialTransactionId, initialView]);

  useEffect(() => {
    if (initialTransactionId) {
      void refreshTransaction(initialTransactionId);
    }
  }, [initialTransactionId]);

  const accountById = useMemo(() => {
    return new Map(accounts.map((account) => [account.idAccount, account]));
  }, [accounts]);

  const totals = useMemo(() => {
    return accounts.reduce(
      (summary, account) => {
        summary[account.type] += parseAmount(account.balance);
        return summary;
      },
      { ASSET: 0, LIABILITY: 0, EQUITY: 0, REVENUE: 0, EXPENSE: 0 },
    );
  }, [accounts]);

  const filteredAccounts = accounts.filter((account) => {
    const matchesType = accountFilter === "ALL" || account.type === accountFilter;
    const term = search.trim().toLowerCase();
    const matchesSearch =
      !term ||
      account.name.toLowerCase().includes(term) ||
      account.idAccount.toLowerCase().includes(term);

    return matchesType && matchesSearch;
  });

  const selectedAccount = accountById.get(selectedAccountId) ?? accounts[0];
  const ledgerRows = transactions
    .flatMap((transaction) =>
      transaction.entries
        .filter((entry) => entry.idAccount === selectedAccount?.idAccount)
        .map((entry) => ({ transaction, entry })),
    )
    .sort(
      (left, right) =>
        new Date(left.transaction.date).getTime() - new Date(right.transaction.date).getTime(),
    );

  async function loadAccounts() {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/accounts", { cache: "no-store" });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error?.message ?? "No se pudo cargar cuentas.");
      }

      setAccounts(payload.data ?? []);
      setNotice("Informacion actualizada.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Error inesperado.");
    } finally {
      setIsLoading(false);
    }
  }

  async function createAccount(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice(null);
    setError(null);

    try {
      const response = await fetch("/api/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: accountForm.name,
          description: accountForm.description || null,
          type: accountForm.type,
        }),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error?.message ?? "No se pudo crear la cuenta.");
      }

      setAccounts((current) => [...current, payload.data]);
      setSelectedAccountId((current) => current || payload.data.idAccount);
      setAccountForm({ name: "", description: "", type: "ASSET" });
      setNotice("Cuenta creada correctamente.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Error inesperado.");
    }
  }

  async function createTransaction(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice(null);
    setError(null);

    try {
      const response = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: transactionDraft.description,
          date: transactionDraft.date,
          entries: toTransactionEntryInput(transactionDraft),
        }),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error?.message ?? "No se pudo crear el asiento.");
      }

      setTransactions((current) => [payload.data, ...current]);
      setSelectedTransaction(payload.data);
      dispatch(transactionDraftCleared());
      setView("entry-detail");
      window.history.pushState(null, "", `/transactions/${payload.data.idTransaction}`);
      setNotice("Asiento creado como borrador.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Error inesperado.");
    }
  }

  async function refreshTransaction(idTransaction: string) {
    setError(null);

    try {
      const response = await fetch(`/api/transactions/${idTransaction}`, { cache: "no-store" });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error?.message ?? "No se pudo consultar el asiento.");
      }

      setSelectedTransaction(payload.data);
      setTransactions((current) =>
        current.map((transaction) =>
          transaction.idTransaction === idTransaction ? payload.data : transaction,
        ),
      );
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Error inesperado.");
    }
  }

  async function changeTransactionStatus(action: "post" | "void") {
    if (!selectedTransaction) {
      return;
    }

    setError(null);
    setNotice(null);

    try {
      const response = await fetch(
        `/api/transactions/${selectedTransaction.idTransaction}/${action}`,
        { method: "POST" },
      );
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error?.message ?? "No se pudo actualizar el asiento.");
      }

      setSelectedTransaction(payload.data);
      setTransactions((current) =>
        current.map((transaction) =>
          transaction.idTransaction === selectedTransaction.idTransaction ? payload.data : transaction,
        ),
      );
      await loadAccounts();
      setNotice(action === "post" ? "Asiento contabilizado." : "Asiento anulado.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Error inesperado.");
    }
  }

  function updateEntry(id: string, changes: Partial<DraftEntry>) {
    dispatch(transactionDraftEntryUpdated({ id, changes }));
  }

  function openTransaction(transaction: Transaction) {
    setSelectedTransaction(transaction);
    setView("entry-detail");
    window.history.pushState(null, "", `/transactions/${transaction.idTransaction}`);
    void refreshTransaction(transaction.idTransaction);
  }

  return (
    <main className="min-h-screen bg-slate-100 text-slate-950">
      <div className="grid min-h-screen lg:grid-cols-[232px_1fr]">
        <Sidebar view={view} />

        <section className="min-w-0 px-4 py-6 sm:px-8 lg:px-10">
          <TopBar onRefresh={() => void loadAccounts()} />
          {(error || notice) && <Alert tone={error ? "error" : "success"}>{error ?? notice}</Alert>}

          {view === "summary" && (
            <SummaryScreen
              accountById={accountById}
              onOpenTransaction={openTransaction}
              totals={totals}
              transactions={transactions}
            />
          )}

          {view === "accounts" && (
            <AccountsScreen
              accountFilter={accountFilter}
              accountForm={accountForm}
              accounts={filteredAccounts}
              isLoading={isLoading}
              onAccountFormChange={setAccountForm}
              onCreateAccount={createAccount}
              onFilterChange={setAccountFilter}
              onOpenLedger={(idAccount) => {
                setSelectedAccountId(idAccount);
                setView("ledger");
                window.history.pushState(null, "", `/accounts/${idAccount}/ledger`);
              }}
              onSearchChange={setSearch}
              search={search}
            />
          )}

          {view === "ledger" && (
            <LedgerScreen
              account={selectedAccount}
              accountById={accountById}
              accounts={accounts}
              rows={ledgerRows}
              selectedAccountId={selectedAccountId}
              onAccountChange={setSelectedAccountId}
              onBack={() => {
                setView("accounts");
                window.history.pushState(null, "", "/accounts");
              }}
              onOpenTransaction={openTransaction}
            />
          )}

          {view === "new-entry" && (
            <NewEntryScreen
              accounts={accounts}
              creditTotal={creditTotal}
              debitTotal={debitTotal}
              form={transactionDraft}
              isBalanced={isBalanced}
              onAddLine={() =>
                dispatch(transactionDraftEntryAdded())
              }
              onCreateTransaction={createTransaction}
              onDateChange={(value) => dispatch(transactionDraftDateChanged(value))}
              onDescriptionChange={(value) => dispatch(transactionDraftDescriptionChanged(value))}
              onRemoveLine={(id) =>
                dispatch(transactionDraftEntryRemoved(id))
              }
              onUpdateEntry={updateEntry}
            />
          )}

          {view === "entry-detail" && (
            <EntryDetailScreen
              accountById={accountById}
              onBack={() => {
                setView("new-entry");
                window.history.pushState(null, "", "/transactions/new");
              }}
              onPost={() => void changeTransactionStatus("post")}
              onVoid={() => void changeTransactionStatus("void")}
              transaction={selectedTransaction}
            />
          )}
        </section>
      </div>
    </main>
  );
}

function Sidebar({ view }: { view: View }) {
  const items = [
    ["summary", "Resumen", "/", LayoutDashboard],
    ["accounts", "Plan de cuentas", "/accounts", BookOpen],
    ["new-entry", "Asientos", "/transactions/new", FileText],
    ["ledger", "Libro mayor", "/ledger", Landmark],
    ["entry-detail", "Detalle", "/transactions", BadgeCheck],
  ] satisfies Array<[View, string, string, typeof LayoutDashboard]>;

  const LogoIcon = LineChart;

  return (
    <aside className="bg-slate-950 px-5 py-6 text-white">
      <div className="mb-10 flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-md bg-teal-500">
          <LogoIcon className="h-6 w-6" aria-hidden="true" />
        </div>
        <div>
          <p className="text-lg font-semibold">Edeco</p>
          <p className="text-xs text-slate-400">Libro mayor</p>
        </div>
      </div>

      <nav className="space-y-2 text-sm">
        {items.map(([itemView, label, href, Icon]) => (
          <Link
            className={`flex h-11 w-full items-center gap-3 rounded-md px-3 text-left ${
              view === itemView
                ? "bg-teal-600 text-white"
                : "text-slate-300 hover:bg-slate-900 hover:text-white"
            }`}
            href={href}
            key={itemView}
          >
            <Icon className="h-4 w-4" aria-hidden="true" />
            {label}
          </Link>
        ))}
      </nav>

      <div className="mt-16 border-t border-slate-800 pt-5 text-xs text-slate-400">
        <p className="font-semibold text-white">Maria Jimenez</p>
        <p>Empresa Demo</p>
      </div>
    </aside>
  );
}

function TopBar({ onRefresh }: { onRefresh: () => void }) {
  const trustItems = [
    ["Informacion confiable", ShieldCheck],
    ["Trazabilidad total", FileText],
    ["Inmutabilidad", LockKeyhole],
    ["Listo para crecer", LineChart],
  ] satisfies Array<[string, LucideIcon]>;

  return (
    <header className="mb-8 flex flex-col justify-between gap-4 xl:flex-row xl:items-center">
      <div>
        <h1 className="text-3xl font-bold tracking-normal">Edeco</h1>
        <p className="text-sm text-slate-500">Contabilidad simple. Decisiones mas grandes.</p>
      </div>
      <div className="flex flex-wrap gap-3 text-xs text-slate-600">
        {trustItems.map(([item, Icon]) => (
            <span
              className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 shadow-sm"
              key={item}
            >
              <Icon className="h-4 w-4 text-teal-600" aria-hidden="true" />
              <span>{item}</span>
            </span>
        ))}
        <button
          className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 font-medium text-slate-700 shadow-sm hover:bg-slate-50"
          onClick={onRefresh}
          type="button"
        >
          <RefreshCw className="h-4 w-4" aria-hidden="true" />
          Actualizar
        </button>
      </div>
    </header>
  );
}

function SummaryScreen({
  accountById,
  onOpenTransaction,
  totals,
  transactions,
}: {
  accountById: Map<string, Account>;
  onOpenTransaction: (transaction: Transaction) => void;
  totals: Record<AccountType, number>;
  transactions: Transaction[];
}) {
  return (
    <>
      <ScreenTitle title="Resumen contable" subtitle="Vista general de tu situacion financiera." />
      <section className="mb-5 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {([
          ["Activos", totals.ASSET, Landmark],
          ["Pasivos", totals.LIABILITY, Banknote],
          ["Patrimonio", totals.EQUITY, Building2],
          ["Ingresos", totals.REVENUE, LineChart],
          ["Gastos", totals.EXPENSE, FileText],
        ] satisfies Array<[string, number, LucideIcon]>).map(([label, value, Icon]) => (
          <article className="rounded-md border border-slate-200 bg-white p-5 shadow-sm" key={label}>
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-slate-600">{label}</p>
              <Icon className="h-5 w-5 text-teal-600" aria-hidden="true" />
            </div>
            <p className="mt-3 text-2xl font-bold">{formatMoney(Number(value))}</p>
            <p className="mt-2 text-xs font-medium text-teal-700">Saldo acumulado</p>
          </article>
        ))}
      </section>

      <section className="mb-5 rounded-md bg-teal-50 px-5 py-6 text-teal-950 ring-1 ring-teal-100">
        <div className="grid items-center gap-4 text-center md:grid-cols-[1fr_auto_1fr_auto_1fr]">
          <Metric label="Activos" value={totals.ASSET} />
          <span className="text-2xl font-bold">=</span>
          <Metric label="Pasivos" value={totals.LIABILITY} />
          <span className="text-2xl font-bold">+</span>
          <Metric label="Patrimonio" value={totals.EQUITY} />
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <Panel title="Composicion contable">
          <div className="grid gap-3">
            {[
              ["Activos", totals.ASSET],
              ["Pasivos", totals.LIABILITY],
              ["Patrimonio", totals.EQUITY],
              ["Ingresos", totals.REVENUE],
              ["Gastos", totals.EXPENSE],
            ].map(([label, value]) => (
              <div
                className="flex items-center justify-between rounded-md border border-slate-200 bg-slate-50 px-4 py-3"
                key={label}
              >
                <span className="text-sm font-semibold text-slate-600">{label}</span>
                <span className="font-bold">{formatMoney(Number(value))}</span>
              </div>
            ))}
          </div>
        </Panel>
        <Panel title="Actividad reciente">
          <TransactionTable
            accountById={accountById}
            emptyText="Aun no hay asientos creados en esta sesion."
            onOpenTransaction={onOpenTransaction}
            transactions={transactions}
          />
        </Panel>
      </section>
    </>
  );
}

function AccountsScreen({
  accountFilter,
  accountForm,
  accounts,
  isLoading,
  onAccountFormChange,
  onCreateAccount,
  onFilterChange,
  onOpenLedger,
  onSearchChange,
  search,
}: {
  accountFilter: "ALL" | AccountType;
  accountForm: { name: string; description: string; type: AccountType };
  accounts: Account[];
  isLoading: boolean;
  onAccountFormChange: (form: { name: string; description: string; type: AccountType }) => void;
  onCreateAccount: (event: FormEvent<HTMLFormElement>) => void;
  onFilterChange: (filter: "ALL" | AccountType) => void;
  onOpenLedger: (idAccount: string) => void;
  onSearchChange: (value: string) => void;
  search: string;
}) {
  return (
    <>
      <ScreenTitle
        action={
          <Link
            className="inline-flex items-center gap-2 rounded-md bg-teal-600 px-4 py-2 text-sm font-semibold text-white"
            href="/accounts"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Nueva cuenta
          </Link>
        }
        title="Plan de cuentas"
        subtitle="Estructura de cuentas de tu empresa."
      />
      <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
        <Panel title="Cuentas">
          <div className="mb-4 flex flex-col gap-3 lg:flex-row">
            <label className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" aria-hidden="true" />
              <input
                className="h-10 w-full rounded-md border border-slate-300 px-9 text-sm outline-none focus:border-teal-500"
                onChange={(event) => onSearchChange(event.target.value)}
                placeholder="Buscar cuentas por codigo o nombre..."
                value={search}
              />
            </label>
            <select
              className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm outline-none focus:border-teal-500"
              onChange={(event) => onFilterChange(event.target.value as "ALL" | AccountType)}
              value={accountFilter}
            >
              <option value="ALL">Todas</option>
              {Object.entries(accountTypeLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Codigo</th>
                  <th className="px-4 py-3">Cuenta</th>
                  <th className="px-4 py-3">Tipo</th>
                  <th className="px-4 py-3 text-right">Saldo</th>
                  <th className="px-4 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr>
                    <td className="px-4 py-8 text-center text-slate-500" colSpan={5}>
                      Cargando cuentas...
                    </td>
                  </tr>
                ) : accounts.length === 0 ? (
                  <tr>
                    <td className="px-4 py-8 text-center text-slate-500" colSpan={5}>
                      No hay cuentas para mostrar.
                    </td>
                  </tr>
                ) : (
                  accounts.map((account) => (
                    <tr key={account.idAccount}>
                      <td className="px-4 py-3 font-mono text-xs text-slate-500">
                        {shortId(account.idAccount)}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-semibold">{account.name}</p>
                        <p className="text-xs text-slate-500">{account.description ?? "Sin descripcion"}</p>
                      </td>
                      <td className="px-4 py-3">
                        <Badge>{accountTypeLabels[account.type]}</Badge>
                      </td>
                      <td className="px-4 py-3 text-right font-semibold">
                        {formatMoney(parseAmount(account.balance))}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-semibold hover:bg-slate-50"
                          onClick={() => onOpenLedger(account.idAccount)}
                          type="button"
                        >
                          <span className="inline-flex items-center gap-1.5">
                            <Landmark className="h-3.5 w-3.5" aria-hidden="true" />
                            Ver mayor
                          </span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel title="Crear cuenta">
          <form className="space-y-4" id="crear-cuenta" onSubmit={onCreateAccount}>
            <Input
              label="Nombre"
              onChange={(value) => onAccountFormChange({ ...accountForm, name: value })}
              required
              value={accountForm.name}
            />
            <Input
              label="Descripcion"
              onChange={(value) => onAccountFormChange({ ...accountForm, description: value })}
              value={accountForm.description}
            />
            <label className="block text-sm font-medium text-slate-700">
              Tipo
              <select
                className="mt-1 h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm outline-none focus:border-teal-500"
                onChange={(event) =>
                  onAccountFormChange({ ...accountForm, type: event.target.value as AccountType })
                }
                value={accountForm.type}
              >
                {Object.entries(accountTypeLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <button className="h-10 w-full rounded-md bg-slate-950 text-sm font-semibold text-white">
              Guardar cuenta
            </button>
          </form>
        </Panel>
      </div>
    </>
  );
}

function LedgerScreen({
  account,
  accounts,
  rows,
  selectedAccountId,
  onAccountChange,
  onBack,
  onOpenTransaction,
}: {
  account: Account | undefined;
  accountById: Map<string, Account>;
  accounts: Account[];
  rows: Array<{ transaction: Transaction; entry: TransactionEntry }>;
  selectedAccountId: string;
  onAccountChange: (idAccount: string) => void;
  onBack: () => void;
  onOpenTransaction: (transaction: Transaction) => void;
}) {
  return (
    <>
      <ScreenTitle
        action={
          <select
            className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm outline-none focus:border-teal-500"
            onChange={(event) => onAccountChange(event.target.value)}
            value={selectedAccountId}
          >
            {accounts.map((item) => (
              <option key={item.idAccount} value={item.idAccount}>
                {item.name}
              </option>
            ))}
          </select>
        }
        title={`Libro mayor${account ? ` - ${account.name}` : ""}`}
        subtitle={account?.description ?? "Movimientos asociados a una cuenta."}
      />
      <button className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-teal-700" onClick={onBack} type="button">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Volver al plan de cuentas
      </button>
      <Panel title="Movimientos">
        <div className="mb-4 grid gap-4 rounded-md bg-slate-50 p-4 md:grid-cols-4">
          <Metric label="Saldo inicial" value={0} />
          <Metric
            label="Total debitos"
            value={rows.reduce((sum, row) => sum + (row.entry.type === "DEBIT" ? parseAmount(row.entry.amount) : 0), 0)}
          />
          <Metric
            label="Total creditos"
            value={rows.reduce(
              (sum, row) => sum + (row.entry.type === "CREDIT" ? parseAmount(row.entry.amount) : 0),
              0,
            )}
          />
          <Metric label="Saldo actual" value={parseAmount(account?.balance ?? "0")} />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Fecha</th>
                <th className="px-4 py-3">Asiento</th>
                <th className="px-4 py-3">Descripcion</th>
                <th className="px-4 py-3 text-right">Debe</th>
                <th className="px-4 py-3 text-right">Haber</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.length === 0 ? (
                <tr>
                  <td className="px-4 py-8 text-center text-slate-500" colSpan={5}>
                    No hay movimientos disponibles para esta cuenta en la sesion actual.
                  </td>
                </tr>
              ) : (
                rows.map(({ transaction, entry }) => (
                  <tr key={entry.idTransactionEntry}>
                    <td className="px-4 py-3">{formatDate(transaction.date)}</td>
                    <td className="px-4 py-3">
                      <button
                        className="font-semibold text-teal-700"
                        onClick={() => onOpenTransaction(transaction)}
                        type="button"
                      >
                        {shortId(transaction.idTransaction)}
                      </button>
                    </td>
                    <td className="px-4 py-3">{transaction.description}</td>
                    <td className="px-4 py-3 text-right">
                      {entry.type === "DEBIT" ? formatMoney(parseAmount(entry.amount)) : "-"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {entry.type === "CREDIT" ? formatMoney(parseAmount(entry.amount)) : "-"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Panel>
    </>
  );
}

function NewEntryScreen({
  accounts,
  creditTotal,
  debitTotal,
  form,
  isBalanced,
  onAddLine,
  onCreateTransaction,
  onDateChange,
  onDescriptionChange,
  onRemoveLine,
  onUpdateEntry,
}: {
  accounts: Account[];
  creditTotal: number;
  debitTotal: number;
  form: TransactionDraft;
  isBalanced: boolean;
  onAddLine: () => void;
  onCreateTransaction: (event: FormEvent<HTMLFormElement>) => void;
  onDateChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onRemoveLine: (id: string) => void;
  onUpdateEntry: (id: string, changes: Partial<DraftEntry>) => void;
}) {
  return (
    <>
      <ScreenTitle title="Nuevo asiento" subtitle="Registra una nueva transaccion contable." />
      <Panel title="Captura del asiento">
        <form className="space-y-4" onSubmit={onCreateTransaction}>
          <div className="grid gap-4 md:grid-cols-[1fr_180px]">
            <Input
              label="Descripcion"
              onChange={onDescriptionChange}
              required
              value={form.description}
            />
            <Input
              label="Fecha"
              onChange={onDateChange}
              required
              type="date"
              value={form.date}
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-3 py-3 text-left">#</th>
                  <th className="px-3 py-3 text-left">Cuenta</th>
                  <th className="px-3 py-3 text-right">Debe</th>
                  <th className="px-3 py-3 text-right">Haber</th>
                  <th className="px-3 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {form.entries.map((entry, index) => (
                  <tr key={entry.id}>
                    <td className="px-3 py-3">{index + 1}</td>
                    <td className="px-3 py-3">
                      <select
                        className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 outline-none focus:border-teal-500"
                        onChange={(event) => onUpdateEntry(entry.id, { idAccount: event.target.value })}
                        required
                        value={entry.idAccount}
                      >
                        <option value="">Selecciona cuenta</option>
                        {accounts.map((account) => (
                          <option key={account.idAccount} value={account.idAccount}>
                            {account.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-3 py-3">
                      <MoneyInput
                        onChange={(value) => onUpdateEntry(entry.id, { debitAmount: value })}
                        value={entry.debitAmount}
                      />
                    </td>
                    <td className="px-3 py-3">
                      <MoneyInput
                        onChange={(value) => onUpdateEntry(entry.id, { creditAmount: value })}
                        value={entry.creditAmount}
                      />
                    </td>
                    <td className="px-3 py-3 text-right">
                      <button
                        className="inline-flex items-center gap-1.5 rounded-md border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-600 disabled:opacity-40"
                        disabled={form.entries.length <= 2}
                        onClick={() => onRemoveLine(entry.id)}
                        type="button"
                      >
                        <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button className="inline-flex items-center gap-2 text-sm font-semibold text-teal-700" onClick={onAddLine} type="button">
            <Plus className="h-4 w-4" aria-hidden="true" />
            Agregar linea
          </button>

          <div className="grid gap-4 rounded-md bg-slate-50 p-4 md:grid-cols-[1fr_auto_auto_auto] md:items-center">
            <div className={isBalanced ? "text-teal-700" : "text-amber-700"}>
              <p className="font-semibold">
                {isBalanced ? "El asiento esta balanceado" : "Debe y Haber deben ser iguales"}
              </p>
              <p className="text-sm">La suma del Debe y el Haber controla si se puede guardar.</p>
            </div>
            <Metric label="Total debe" value={debitTotal} />
            <Metric label="Total haber" value={creditTotal} />
            <button
              className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-teal-600 px-5 text-sm font-semibold text-white disabled:bg-slate-300"
              disabled={!isBalanced}
            >
              <FileText className="h-4 w-4" aria-hidden="true" />
              Guardar borrador
            </button>
          </div>
        </form>
      </Panel>
    </>
  );
}

function EntryDetailScreen({
  accountById,
  onBack,
  onPost,
  onVoid,
  transaction,
}: {
  accountById: Map<string, Account>;
  onBack: () => void;
  onPost: () => void;
  onVoid: () => void;
  transaction: Transaction | null;
}) {
  if (!transaction) {
    return (
      <>
        <ScreenTitle title="Detalle de asiento" subtitle="Selecciona o crea un asiento para revisar su detalle." />
        <Panel title="Sin asiento seleccionado">
          <p className="text-sm text-slate-500">Crea un asiento nuevo o abre uno desde actividad reciente.</p>
        </Panel>
      </>
    );
  }

  const debitTotal = transaction.entries.reduce(
    (sum, entry) => sum + (entry.type === "DEBIT" ? parseAmount(entry.amount) : 0),
    0,
  );
  const creditTotal = transaction.entries.reduce(
    (sum, entry) => sum + (entry.type === "CREDIT" ? parseAmount(entry.amount) : 0),
    0,
  );

  return (
    <>
      <button className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-teal-700" onClick={onBack} type="button">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Volver a asientos
      </button>
      <ScreenTitle
        action={
          <div className="flex gap-2">
            <button
              className="inline-flex items-center gap-2 rounded-md bg-teal-600 px-4 py-2 text-sm font-semibold text-white disabled:bg-slate-300"
              disabled={transaction.status !== "DRAFT"}
              onClick={onPost}
              type="button"
            >
              <Send className="h-4 w-4" aria-hidden="true" />
              Contabilizar
            </button>
            <button
              className="inline-flex items-center gap-2 rounded-md border border-rose-300 px-4 py-2 text-sm font-semibold text-rose-600 disabled:opacity-40"
              disabled={transaction.status === "VOIDED"}
              onClick={onVoid}
              type="button"
            >
              <XCircle className="h-4 w-4" aria-hidden="true" />
              Anular asiento
            </button>
          </div>
        }
        title={`Asiento #${shortId(transaction.idTransaction)}`}
        subtitle={transaction.description}
      />
      <div className="grid gap-5 xl:grid-cols-[1fr_320px]">
        <Panel title="Detalle">
          <div className="mb-4 grid gap-4 md:grid-cols-3">
            <Info label="Fecha" value={formatDate(transaction.date)} />
            <Info label="Tipo" value="Asiento normal" />
            <Info label="Estado" value={statusLabels[transaction.status]} />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">#</th>
                  <th className="px-4 py-3">Cuenta</th>
                  <th className="px-4 py-3 text-right">Debe</th>
                  <th className="px-4 py-3 text-right">Haber</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transaction.entries.map((entry, index) => (
                  <tr key={entry.idTransactionEntry}>
                    <td className="px-4 py-3">{index + 1}</td>
                    <td className="px-4 py-3">{accountById.get(entry.idAccount)?.name ?? entry.idAccount}</td>
                    <td className="px-4 py-3 text-right">
                      {entry.type === "DEBIT" ? formatMoney(parseAmount(entry.amount)) : "-"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {entry.type === "CREDIT" ? formatMoney(parseAmount(entry.amount)) : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 flex justify-end gap-6">
            <Metric label="Total debe" value={debitTotal} />
            <Metric label="Total haber" value={creditTotal} />
          </div>
        </Panel>

        <Panel title="Historial del asiento">
          <ol className="space-y-4 text-sm">
            <li>
              <p className="flex items-center gap-2 font-semibold">
                <FileText className="h-4 w-4 text-teal-600" aria-hidden="true" />
                Creado
              </p>
              <p className="text-slate-500">{formatDate(transaction.date)} por Maria Jimenez</p>
            </li>
            {transaction.status !== "DRAFT" && (
              <li>
                <p className="flex items-center gap-2 font-semibold">
                  {transaction.status === "POSTED" ? (
                    <CheckCircle2 className="h-4 w-4 text-teal-600" aria-hidden="true" />
                  ) : (
                    <XCircle className="h-4 w-4 text-rose-600" aria-hidden="true" />
                  )}
                  {transaction.status === "POSTED" ? "Contabilizado" : "Anulado"}
                </p>
                <p className="text-slate-500">Saldos y estado actualizados por endpoint.</p>
              </li>
            )}
          </ol>
        </Panel>
      </div>
    </>
  );
}

function TransactionTable({
  accountById,
  emptyText,
  onOpenTransaction,
  transactions,
}: {
  accountById: Map<string, Account>;
  emptyText: string;
  onOpenTransaction: (transaction: Transaction) => void;
  transactions: Transaction[];
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[560px] text-left text-sm">
        <thead className="bg-slate-50 text-xs uppercase text-slate-500">
          <tr>
            <th className="px-3 py-3">Fecha</th>
            <th className="px-3 py-3">Asiento</th>
            <th className="px-3 py-3">Descripcion</th>
            <th className="px-3 py-3">Estado</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {transactions.length === 0 ? (
            <tr>
              <td className="px-3 py-8 text-center text-slate-500" colSpan={4}>
                {emptyText}
              </td>
            </tr>
          ) : (
            transactions.slice(0, 7).map((transaction) => (
              <tr key={transaction.idTransaction}>
                <td className="px-3 py-3">{formatDate(transaction.date)}</td>
                <td className="px-3 py-3">
                  <button
                    className="font-semibold text-teal-700"
                    onClick={() => onOpenTransaction(transaction)}
                    type="button"
                  >
                    {shortId(transaction.idTransaction)}
                  </button>
                </td>
                <td className="px-3 py-3">
                  <p>{transaction.description}</p>
                  <p className="text-xs text-slate-500">
                    {transaction.entries
                      .map((entry) => accountById.get(entry.idAccount)?.name)
                      .filter(Boolean)
                      .join(" / ")}
                  </p>
                </td>
                <td className="px-3 py-3">
                  <StatusBadge status={transaction.status} />
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

function Panel({ children, title }: { children: React.ReactNode; title: string }) {
  return (
    <section className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="mb-4 text-lg font-bold">{title}</h2>
      {children}
    </section>
  );
}

function ScreenTitle({
  action,
  subtitle,
  title,
}: {
  action?: React.ReactNode;
  subtitle: string;
  title: string;
}) {
  return (
    <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
      <div>
        <h2 className="text-2xl font-bold">{title}</h2>
        <p className="text-sm text-slate-500">{subtitle}</p>
      </div>
      {action}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <p className="text-sm font-semibold text-slate-600">{label}</p>
      <p className="mt-1 text-xl font-bold text-slate-950">{formatMoney(value)}</p>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-slate-50 p-4">
      <p className="text-xs font-semibold uppercase text-slate-500">{label}</p>
      <p className="mt-1 font-semibold">{value}</p>
    </div>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex rounded-md border border-teal-200 bg-teal-50 px-2.5 py-1 text-xs font-semibold text-teal-800">
      {children}
    </span>
  );
}

function StatusBadge({ status }: { status: TransactionStatus }) {
  const Icon = statusIcons[status];
  const tone =
    status === "VOIDED"
      ? "border-rose-200 bg-rose-50 text-rose-700"
      : status === "DRAFT"
        ? "border-sky-200 bg-sky-50 text-sky-700"
        : "border-teal-200 bg-teal-50 text-teal-800";

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-semibold ${tone}`}>
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      {statusLabels[status]}
    </span>
  );
}

function Alert({ children, tone }: { children: React.ReactNode; tone: "error" | "success" }) {
  return (
    <div
      className={`mb-5 rounded-md border px-4 py-3 text-sm ${
        tone === "error"
          ? "border-rose-200 bg-rose-50 text-rose-700"
          : "border-emerald-200 bg-emerald-50 text-emerald-700"
      }`}
    >
      {children}
    </div>
  );
}

function Input({
  label,
  onChange,
  required,
  type = "text",
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  required?: boolean;
  type?: string;
  value: string;
}) {
  return (
    <label className="block text-sm font-medium text-slate-700">
      {label}
      <input
        className="mt-1 h-10 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-teal-500"
        onChange={(event) => onChange(event.target.value)}
        required={required}
        type={type}
        value={value}
      />
    </label>
  );
}

function MoneyInput({ onChange, value }: { onChange: (value: string) => void; value: string }) {
  return (
    <input
      className="h-10 w-full rounded-md border border-slate-300 px-3 text-right text-sm outline-none focus:border-teal-500 disabled:bg-slate-50"
      min="0.01"
      onChange={(event) => onChange(event.target.value)}
      placeholder="-"
      step="0.01"
      type="number"
      value={value}
    />
  );
}
