import {
  CallHandler,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import {
  B24ErrorResponse,
  B24Response,
  B24SuccessResponse,
} from '@/modules/bitirx/interfaces/bitrix-api.interface';
import { catchError, throwError } from 'rxjs';
import { AxiosError } from 'axios';

@Injectable()
export class BitrixResponseInterceptor<T>
  implements NestInterceptor<B24Response<T>, B24SuccessResponse<T>>
{
  constructor() {}

  intercept(context: ExecutionContext, next: CallHandler) {
    return next.handle().pipe(
      catchError((error: AxiosError) => {
        if (!error.response) return throwError(() => error.message);

        if ('error' in error.response) {
          const { error: errorName } = error as unknown as B24ErrorResponse;

          switch (errorName) {
            case 'invalid_scope':
            case 'insufficient_scope':
              return throwError(
                () => new HttpException(errorName, HttpStatus.FORBIDDEN),
              );

            case 'invalid_client':
            case 'invalid_grant':
              return throwError(
                () => new HttpException(errorName, HttpStatus.UNAUTHORIZED),
              );

            case 'invalid_request':
              return throwError(
                () => new HttpException(errorName, HttpStatus.BAD_REQUEST),
              );
          }
        }

        return throwError(() => error.message);
      }),
    );
  }
}
