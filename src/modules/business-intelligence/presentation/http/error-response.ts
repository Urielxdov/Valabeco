import { BusinessIntelligenceError } from "../../application/errors";

export function businessIntelligenceErrorResponse(error: unknown): Response {
  if (error instanceof BusinessIntelligenceError) {
    return Response.json(
      {
        error: {
          code: error.code,
          message: error.message,
        },
      },
      { status: 400 },
    );
  }

  console.error(error);

  return Response.json(
    {
      error: {
        code: "BI_INTERNAL_ERROR",
        message: "Unexpected business intelligence error.",
      },
    },
    { status: 500 },
  );
}
