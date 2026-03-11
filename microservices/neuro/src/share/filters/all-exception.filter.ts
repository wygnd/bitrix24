import {
  ArgumentsHost,
  BadRequestException,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  RpcExceptionFilter,
} from '@nestjs/common';
import { BaseRpcExceptionFilter, RpcException } from '@nestjs/microservices';
import { throwError } from 'rxjs';
import { Response } from 'express';
import { WinstonLogger } from '../logger/main';

@Catch()
export class AllExceptionsFilter extends BaseRpcExceptionFilter {
  private readonly logger = new WinstonLogger(AllExceptionsFilter.name,'exceptions');

  catch(exception: unknown, host: ArgumentsHost) {
    let statusCode: number;
    let message: any;
    const [requestData, tcpArgs] = host.getArgs();

    switch (true) {
      case exception instanceof HttpException:
        statusCode = exception.getStatus();
        const exceptionResponse = exception.getResponse();

        if (typeof exceptionResponse === 'string') {
          message = exceptionResponse;
          break;
        }

        if ('message' in exceptionResponse) {
          message = exceptionResponse.message;
          break;
        }

        message = 'Internal Error';

        break;

      case exception instanceof Error && !!exception.message:
        statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
        message = exception.message;
        break;

      default:
        statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
        message = 'Internal Server Error';
        break;
    }

    this.logger.error({
      cmd: JSON.parse(tcpArgs.args[1]).cmd,
      request: requestData,
      exception,
    });

    return throwError(
      () =>
        new RpcException({
          type: host.getType(),
          exception: message,
          statusCode,
        }),
    );
  }
}
