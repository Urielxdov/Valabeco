import {
  ApiResponseSchema,
  type ApiError,
  type ApiResponse,
  type Result,
} from "@valabeco/contracts";
import type { z } from "zod";

const CONTRACT_ERROR: ApiError = {
  code: "CONTRACT_ERROR",
  message: "The API response does not match the expected contract.",
};

const NETWORK_ERROR: ApiError = {
  code: "NETWORK_ERROR",
  message: "The API request could not be completed.",
};

export class ApiClient {
  constructor(private readonly baseUrl: string) {}

  get<TSchema extends z.ZodType>(
    path: string,
    dataSchema: TSchema,
    init?: RequestInit,
  ): Promise<Result<z.infer<TSchema>>> {
    return this.request(path, dataSchema, {
      ...init,
      method: "GET",
    });
  }

  post<TSchema extends z.ZodType>(
    path: string,
    dataSchema: TSchema,
    body?: unknown,
    init?: RequestInit,
  ): Promise<Result<z.infer<TSchema>>> {
    const headers = new Headers(init?.headers);
    headers.set("Content-Type", "application/json");

    return this.request(path, dataSchema, {
      ...init,
      method: "POST",
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  }

  patch<TSchema extends z.ZodType>(
    path: string,
    dataSchema: TSchema,
    body?: unknown,
    init?: RequestInit,
  ): Promise<Result<z.infer<TSchema>>> {
    const headers = new Headers(init?.headers);
    headers.set("Content-Type", "application/json");

    return this.request(path, dataSchema, {
      ...init,
      method: "PATCH",
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  }

  private async request<TSchema extends z.ZodType>(
    path: string,
    dataSchema: TSchema,
    init: RequestInit,
  ): Promise<Result<z.infer<TSchema>>> {
    let response: Response;

    try {
      response = await fetch(`${this.baseUrl}${path}`, init);
    } catch {
      return { ok: false, error: NETWORK_ERROR };
    }

    let body: unknown;

    try {
      body = await response.json();
    } catch {
      return { ok: false, error: CONTRACT_ERROR };
    }

    const parsed = ApiResponseSchema(dataSchema).safeParse(body);

    if (!parsed.success) {
      return { ok: false, error: CONTRACT_ERROR };
    }

    const envelope = parsed.data as ApiResponse<z.infer<TSchema>>;

    if (!envelope.success) {
      return {
        ok: false,
        error: envelope.error,
        meta: envelope.meta,
      };
    }

    if (!response.ok) {
      return {
        ok: false,
        error: {
          code: "HTTP_ERROR",
          message: `Unexpected HTTP status ${response.status}.`,
        },
        meta: envelope.meta,
      };
    }

    return {
      ok: true,
      data: envelope.data,
      meta: envelope.meta,
    };
  }
}

export function toErrorMessage(error: ApiError): string {
  return error.message;
}
