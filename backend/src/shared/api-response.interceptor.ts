import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from "@nestjs/common";
import { map, type Observable } from "rxjs";
import type { ApiResponse } from "@valabeco/contracts";

@Injectable()
export class ApiResponseInterceptor implements NestInterceptor {
  intercept(_context: ExecutionContext, next: CallHandler): Observable<ApiResponse<unknown>> {
    return next.handle().pipe(
      map((data: unknown) => ({
        success: true,
        data,
        error: null,
      })),
    );
  }
}
