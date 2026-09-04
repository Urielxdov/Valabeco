import { AccountingApplicationError } from "../../application/errors";
import { AccountingDomainError } from "../../domain/errors";

type ErrorBody = Readonly<{
  error: {
    code: string;
    message: string;
  };
}>;

export function accountingErrorResponse(error: unknown): Response {
  if (error instanceof AccountingApplicationError) {
    return Response.json(toErrorBody(error.code, error.message), {
      status: getApplicationStatus(error.code),
    });
  }

  if (error instanceof AccountingDomainError) {
    return Response.json(toErrorBody(error.name, error.message), {
      status: 422,
    });
  }

  console.error(error);

  return Response.json(toErrorBody("INTERNAL_SERVER_ERROR", "Unexpected server error."), {
    status: 500,
  });
}

function getApplicationStatus(code: string): number {
  if (code === "ACCOUNTING_NOT_FOUND") {
    return 404;
  }

  if (code === "ACCOUNTING_CONFLICT") {
    return 409;
  }

  return 400;
}

function toErrorBody(code: string, message: string): ErrorBody {
  return {
    error: {
      code,
      message,
    },
  };
}
