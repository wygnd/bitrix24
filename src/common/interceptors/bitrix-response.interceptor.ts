import {
  CallHandler,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import {
  B24Response,
  B24SuccessResponse,
} from '../../modules/bitirx/interfaces/bitrix-api.interface';
import { catchError, map, Observable, throwError } from 'rxjs';
import { isObject } from 'class-validator';

@Injectable()
export class BitrixResponseInterceptor<T>
  implements NestInterceptor<B24Response<T>, B24SuccessResponse<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler<B24Response<T>>,
  ): Observable<B24SuccessResponse<T>> {
    return next.handle().pipe(
      map((data: B24Response<T>) => {
        if (!data)
          throw new HttpException('Response is empty', HttpStatus.BAD_GATEWAY);

        if (!isObject(data)) return data;

        if ('error' in data) {
          throw new HttpException(
            `BITRIX EXCEPTION: ${data.error} - ${data.error_description}`,
            HttpStatus.BAD_REQUEST,
          );
        }

        return data;
      }),
      catchError((error: Error) => {
        console.log('BITRIX INTERCEPTOR: Unknown error: ', error);
        return throwError(() => error);
      }),
    );
  }
}
