import {
  makeCreateTransactionUseCase,
  makeListTransactionsUseCase,
} from "@/src/modules/accounting/infrastructure/composition";
import { accountingErrorResponse } from "@/src/modules/accounting/presentation/http/error-response";
import {
  parseCreateTransactionInput,
  readJsonObject,
} from "@/src/modules/accounting/presentation/http/request-parsers";

export async function GET(): Promise<Response> {
  try {
    const transactions = await makeListTransactionsUseCase().execute();

    return Response.json({ data: transactions });
  } catch (error) {
    return accountingErrorResponse(error);
  }
}

export async function POST(request: Request): Promise<Response> {
  try {
    const body = await readJsonObject(request);
    const input = parseCreateTransactionInput(body);
    const transaction = await makeCreateTransactionUseCase().execute(input);

    return Response.json({ data: transaction }, { status: 201 });
  } catch (error) {
    return accountingErrorResponse(error);
  }
}
