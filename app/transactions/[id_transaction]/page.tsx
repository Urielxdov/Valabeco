import { AccountingApp } from "../../page";

export default async function TransactionDetailPage({
  params,
}: PageProps<"/transactions/[id_transaction]">) {
  const { id_transaction: idTransaction } = await params;

  return <AccountingApp initialTransactionId={idTransaction} initialView="entry-detail" />;
}
