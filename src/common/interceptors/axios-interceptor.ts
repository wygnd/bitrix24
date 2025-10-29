import {
  BadRequestException,
  CallHandler,
  ExecutionContext,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  MethodNotAllowedException,
  NestInterceptor,
  NotFoundException,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { catchError, Observable, throwError } from 'rxjs';
import { AxiosError } from 'axios';
import { B24ErrorResponse } from '@/modules/bitirx/interfaces/bitrix-api.interface';

@Injectable()
export class AxiosGlobalInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler) {
    return next.handle().pipe(
      catchError((error: AxiosError<B24ErrorResponse>) => {

        if (!error.response?.data) return throwError(() => error);

        const { data } = error.response;

        if ('error' in data) {
          const { error: errorName, error_description: errorDesc } = data;
          const errorMessage = `BITRIX ERROR: ${errorName}: ${errorDesc}`;

          switch (errorName) {
            // 400
            case 'invalid_request':
            case 'ERROR_BATCH_LENGTH_EXCEEDED':
            case 'INVALID_REQUEST':
              return throwError(() => new BadRequestException(data));

            //   401
            case 'invalid_client':
            case 'NO_AUTH_FOUND':
            case 'expired_token':
            case 'invalid_grant':
              return throwError(() => new UnauthorizedException(data));

            //   403
            case 'invalid_scope':
            case 'insufficient_scope':
            case 'ACCESS_DENIED':
            case 'INVALID_CREDENTIALS':
            case 'user_access_error':
              return throwError(() => new ForbiddenException(data));

            //   404
            case 'ERROR_MANIFEST_IS_NOT_AVAILABLE':
              return throwError(() => new NotFoundException(data));

            //   405
            case 'ERROR_BATCH_METHOD_NOT_ALLOWED':
              return throwError(() => new MethodNotAllowedException(data));

            //   500
            case 'INTERNAL_SERVER_ERROR':
            case 'ERROR_UNEXPECTED_ANSWER':
              return throwError(() => new InternalServerErrorException(data));

            //   503
            case 'QUERY_LIMIT_EXCEEDED':
            case 'OVERLOAD_LIMIT':
              return throwError(() => new ServiceUnavailableException(data));
          }
        }

        return throwError(
          () =>
            new HttpException(
              `Unknown error: ${error.toJSON()}`,
              HttpStatus.INTERNAL_SERVER_ERROR,
            ),
        );
      }),
    );
  }
}
