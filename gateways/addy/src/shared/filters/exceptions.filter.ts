import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { WinstonLogger } from '@shared/logger/winston.logger';
import { Response } from 'express';
import { IResolveException } from '@shared/interfaces/filters/exceptions/interface';

@Catch()
export class ExceptionsFilter implements ExceptionFilter {
  private readonly logger = new WinstonLogger(
    ExceptionsFilter.name,
    'EXCEPTIONS',
  );

  catch(exception: any, host: ArgumentsHost): any {
    const context = host.switchToHttp();
    const response = context.getResponse<Response>();

    const {
      statusCode,
      message,
      stack = '',
    } = this.resolveException(exception);

    this.logger.error({
      status_code: statusCode,
      message: message,
      stack: stack,
    });

    response.status(statusCode).json({
      statusCode,
      ...(typeof message == 'string' ? { message } : message),
    });
  }

  private resolveException(exception: unknown): IResolveException {
    if (exception instanceof HttpException) {
      return {
        statusCode: exception.getStatus(),
        message: exception.getResponse(),
      };
    }

    if (exception instanceof Error) {
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: exception.message,
        stack: exception.stack,
      };
    }

    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Непредвиденная ошибка',
    };
  }
}
