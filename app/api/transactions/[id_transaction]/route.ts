import { makeGetTransactionUseCase } from "@/src/modules/accounting/infrastructure/composition";
import { accountingErrorResponse } from "@/src/modules/accounting/presentation/http/error-response";

type TransactionRouteContext = {
  params: Promise<{
    id_transaction: string;
  }>;
};

export async function GET(
  _request: Request,
  context: TransactionRouteContext,
): Promise<Response> {
  try {
    const { id_transaction: idTransaction } = await context.params;
    const transaction = await makeGetTransactionUseCase().execute(idTransaction);

    return Response.json({ data: transaction });
  } catch (error) {
    return accountingErrorResponse(error);
  }
}
