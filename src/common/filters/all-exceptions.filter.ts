import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { WinstonLogger } from '@/config/winston.logger';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new WinstonLogger('exceptions');

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    let status: number;
    let message: string | object;
    let stack: string;

    switch (true) {
      case exception instanceof HttpException:
        status = exception.getStatus();
        message = exception.getResponse();
        stack = exception.stack ?? '';
        break;

      case exception instanceof Error:
        status = HttpStatus.INTERNAL_SERVER_ERROR;
        message = exception.message;
        stack = exception.stack ?? '';
        break;

      default:
        status = HttpStatus.INTERNAL_SERVER_ERROR;
        message = 'Internal server error';
        stack = '';
    }

    this.logger.error(
      `[${status}]: Exception error: ${JSON.stringify(message)}`,
    );

    response.status(status).json({
      statusCode: status,
      message: message,
      stack: stack,
    });
  }
}
