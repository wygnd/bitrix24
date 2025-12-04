import { CallHandler, ExecutionContext, Injectable, NestInterceptor, RequestTimeoutException, } from '@nestjs/common';
import { catchError, throwError, timeout, TimeoutError } from 'rxjs';

@Injectable()
export class TimeoutInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler<any>) {
    return next.handle().pipe(
      timeout(30000),
      catchError((err) => {
        if (err instanceof TimeoutError)
          return throwError(
            () => new RequestTimeoutException('Request timed out'),
          );

        return throwError(() => err);
      }),
    );
  }
}
