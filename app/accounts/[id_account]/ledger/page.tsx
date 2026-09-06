import { AccountingApp } from "../../../page";

export default async function AccountLedgerPage({
  params,
}: PageProps<"/accounts/[id_account]/ledger">) {
  const { id_account: idAccount } = await params;

  return <AccountingApp initialAccountId={idAccount} initialView="ledger" />;
}
