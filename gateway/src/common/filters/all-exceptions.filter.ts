import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { WinstonLogger } from '@/config/winston.logger';
import safeJSONStringify from 'safe-json-stringify';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new WinstonLogger('exceptions');

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    let statusCode: number;
    let message: string | object;

    switch (true) {
      case exception instanceof HttpException:
        statusCode = exception.getStatus();
        message =
          typeof exception.getResponse() === 'object'
            ? exception.getResponse()
            : exception;
        break;

      case exception instanceof Error:
        statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
        message = exception.message;
        break;

      default:
        statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
        message = 'Internal Server error';
    }

    this.logger.error(
      `[${statusCode}]: Exception error: ${safeJSONStringify(message)}`,
    );

    if (typeof message === 'string') {
      response.status(statusCode).json({
        statusCode: statusCode,
        message: message,
      });
    } else {
      response.status(statusCode).json({
        statusCode: statusCode,
        ...message,
      });
    }
  }
}
