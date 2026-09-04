import {
  makeCreateAccountUseCase,
  makeListAccountsUseCase,
} from "@/src/modules/accounting/infrastructure/composition";
import { accountingErrorResponse } from "@/src/modules/accounting/presentation/http/error-response";
import {
  parseCreateAccountInput,
  readJsonObject,
} from "@/src/modules/accounting/presentation/http/request-parsers";

export async function GET(): Promise<Response> {
  try {
    const accounts = await makeListAccountsUseCase().execute();

    return Response.json({ data: accounts });
  } catch (error) {
    return accountingErrorResponse(error);
  }
}

export async function POST(request: Request): Promise<Response> {
  try {
    const body = await readJsonObject(request);
    const input = parseCreateAccountInput(body);
    const account = await makeCreateAccountUseCase().execute(input);

    return Response.json({ data: account }, { status: 201 });
  } catch (error) {
    return accountingErrorResponse(error);
  }
}
