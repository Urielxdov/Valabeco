import type { ApiError } from "./error";
import type { ApiMeta } from "./meta";

export type Result<T> =
  | {
      ok: true;
      data: T;
      meta?: ApiMeta;
    }
  | {
      ok: false;
      error: ApiError;
      meta?: ApiMeta;
    };
