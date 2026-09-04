import { makePostTransactionUseCase } from "@/src/modules/accounting/infrastructure/composition";
import { accountingErrorResponse } from "@/src/modules/accounting/presentation/http/error-response";

type PostTransactionRouteContext = {
  params: Promise<{
    id_transaction: string;
  }>;
};

export async function POST(
  _request: Request,
  context: PostTransactionRouteContext,
): Promise<Response> {
  try {
    const { id_transaction: idTransaction } = await context.params;
    const transaction = await makePostTransactionUseCase().execute(idTransaction);

    return Response.json({ data: transaction });
  } catch (error) {
    return accountingErrorResponse(error);
  }
}
