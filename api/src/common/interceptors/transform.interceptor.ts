import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { StreamableFile } from '@nestjs/common';

export interface ApiResponse<T> {
  data: T;
  error: null;
  meta: Record<string, unknown> | null;
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<
  T,
  ApiResponse<unknown>
> {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponse<unknown>> {
    return next.handle().pipe(
      map((result) => {
        if (
          result instanceof StreamableFile ||
          result?.constructor?.name === 'StreamableFile'
        ) {
          return result;
        }

        if (
          result &&
          typeof result === 'object' &&
          'items' in result &&
          'meta' in result
        ) {
          return { data: result.items, error: null, meta: result.meta };
        }
        return { data: result, error: null, meta: null };
      }),
    );
  }
}
