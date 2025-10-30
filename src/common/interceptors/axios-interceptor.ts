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
import { catchError, throwError } from 'rxjs';
import { AxiosError } from 'axios';
import { B24ErrorResponse } from '@/modules/bitirx/interfaces/bitrix-api.interface';
import { Request } from 'express';
import { ConfigService } from '@nestjs/config';
import { HeadHunterService } from '@/modules/headhunter/headhunter.service';

@Injectable()
export class AxiosGlobalInterceptor implements NestInterceptor {
  constructor(private readonly headHunterService: HeadHunterService) {}

  intercept(context: ExecutionContext, next: CallHandler) {
    return next.handle().pipe(
      catchError((error: AxiosError<B24ErrorResponse>) => {
        if (
          (error.status && error.status === HttpStatus.UNAUTHORIZED) ||
          error.status === HttpStatus.FORBIDDEN
        ) {
          const { host } = error.request as Request;

          switch (host) {
            case 'api.hh.ru':
              this.headHunterService.notifyAboutInvalidCredentials();
              return throwError(
                () =>
                  new HttpException(
                    error,
                    error.status || HttpStatus.UNAUTHORIZED,
                  ),
              );
          }
        }

        if (!error.response?.data) {
          return throwError(
            () =>
              new HttpException(
                error,
                error.status || HttpStatus.INTERNAL_SERVER_ERROR,
              ),
          );
        }

        if (error.response?.data && 'error' in error.response.data) {
          const { data } = error.response;
          const { error: errorName } = data;

          switch (errorName) {
            // 400
            case 'invalid_request':
            case 'ERROR_BATCH_LENGTH_EXCEEDED':
            case 'INVALID_REQUEST':
            case 'ERROR_CORE':
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

        return throwError(() => error);
      }),
    );
  }
}
