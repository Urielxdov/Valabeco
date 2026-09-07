import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import { AccountingApplicationError } from "../modules/accounting/application/errors";
import { BusinessIntelligenceApplicationError } from "../modules/business-intelligence/application/errors";
import { DomainError } from "./domain/errors";

@Catch()
export class DomainExceptionFilter implements ExceptionFilter {
  catch(error: unknown, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<{
      status(statusCode: number): { json(body: unknown): void };
    }>();
    const mapped = mapError(error);

    if (mapped.status === HttpStatus.INTERNAL_SERVER_ERROR) {
      console.error(error);
    }

    response.status(mapped.status).json({
      success: false,
      data: null,
      error: {
        code: mapped.code,
        message: mapped.message,
      },
    });
  }
}

function mapError(error: unknown) {
  if (error instanceof AccountingApplicationError) {
    return {
      code: error.code,
      message: error.message,
      status: getAccountingApplicationStatus(error.code),
    };
  }

  if (error instanceof BusinessIntelligenceApplicationError) {
    return {
      code: error.code,
      message: error.message,
      status: HttpStatus.BAD_REQUEST,
    };
  }

  if (error instanceof DomainError) {
    return {
      code: error.name,
      message: error.message,
      status: HttpStatus.UNPROCESSABLE_ENTITY,
    };
  }

  if (error instanceof HttpException) {
    const exceptionResponse = error.getResponse();
    const apiError =
      typeof exceptionResponse === "object" && exceptionResponse !== null
        ? readApiError(exceptionResponse)
        : null;

    return {
      code: apiError?.code ?? "HTTP_EXCEPTION",
      message: apiError?.message ?? (typeof exceptionResponse === "string" ? exceptionResponse : error.message),
      status: error.getStatus(),
    };
  }

  return {
    code: "INTERNAL_SERVER_ERROR",
    message: "Unexpected server error.",
    status: HttpStatus.INTERNAL_SERVER_ERROR,
  };
}

function getAccountingApplicationStatus(code: string): number {
  if (code === "ACCOUNTING_NOT_FOUND") {
    return HttpStatus.NOT_FOUND;
  }

  if (code === "ACCOUNTING_CONFLICT") {
    return HttpStatus.CONFLICT;
  }

  return HttpStatus.BAD_REQUEST;
}

function readApiError(value: object): { code?: string; message?: string } | null {
  const record = value as Record<string, unknown>;
  const nested = record["error"];

  if (typeof nested === "object" && nested !== null) {
    const error = nested as Record<string, unknown>;

    return {
      code: typeof error["code"] === "string" ? error["code"] : undefined,
      message: typeof error["message"] === "string" ? error["message"] : undefined,
    };
  }

  return {
    code: typeof record["code"] === "string" ? record["code"] : undefined,
    message: typeof record["message"] === "string" ? record["message"] : undefined,
  };
}
