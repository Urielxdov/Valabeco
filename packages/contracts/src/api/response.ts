import { z } from "zod";
import { ApiErrorSchema, type ApiError } from "./error";
import { ApiMetaSchema, type ApiMeta } from "./meta";

export type ApiSuccess<T> = {
  success: true;
  data: T;
  error: null;
  meta?: ApiMeta;
};

export type ApiFailure = {
  success: false;
  data: null;
  error: ApiError;
  meta?: ApiMeta;
};

export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

export function ApiSuccessSchema<TSchema extends z.ZodType>(dataSchema: TSchema) {
  return z.object({
    success: z.literal(true),
    data: dataSchema,
    error: z.null(),
    meta: ApiMetaSchema.optional(),
  });
}

export const ApiFailureSchema = z.object({
  success: z.literal(false),
  data: z.null(),
  error: ApiErrorSchema,
  meta: ApiMetaSchema.optional(),
});

export function ApiResponseSchema<TSchema extends z.ZodType>(dataSchema: TSchema) {
  return z.discriminatedUnion("success", [
    ApiSuccessSchema(dataSchema),
    ApiFailureSchema,
  ]);
}
