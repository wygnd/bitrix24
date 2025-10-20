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
} from '../../modules/bitirx/interfaces/bitrix-api.interface';
import { catchError, from, switchMap, throwError } from 'rxjs';
import { AxiosError, AxiosStatic, isAxiosError } from 'axios';
import { BitrixService } from '../../modules/bitirx/bitrix.service';

@Injectable()
export class BitrixResponseInterceptor<T>
  implements NestInterceptor<B24Response<T>, B24SuccessResponse<T>>
{
  constructor(private readonly bitrixService: BitrixService) {}

  intercept(context: ExecutionContext, next: CallHandler) {
    return next.handle().pipe(
      catchError((error: AxiosError | B24ErrorResponse | Error) => {
        console.log(error as AxiosError);

        if (isAxiosError(error)) {
          console.log('BITRIX INTERCEPTOR: Axios error: ', error);
          return throwError(() => error);
        }

        if ('error' in error) {
          console.log('BITRIX INTERCEPTOR: Bitrix error: ', error);

          switch (error.error) {
            case 'invalid_grant':
              return throwError(
                () =>
                  new HttpException(
                    'Invalid access token',
                    HttpStatus.UNAUTHORIZED,
                  ),
              );

            case 'insufficient_scope':
            case 'invalid_scope':
              return throwError(
                () => new HttpException('Forbidden', HttpStatus.FORBIDDEN),
              );

            default:
              return throwError(
                () => new HttpException('Bad request', HttpStatus.BAD_REQUEST),
              );
          }
        }

        console.log('BITRIX INTERCEPTOR: Unknown error: ', error);
        return throwError(() => error);
      }),
    );
  }
}
