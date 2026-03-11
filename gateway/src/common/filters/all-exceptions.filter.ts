import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { WinstonLogger } from '@/config/winston.logger';
import safeJSONStringify from 'safe-json-stringify';
import { RpcException } from '@nestjs/microservices';
export interface RpcErrorPayload {
  error: {
    type: string;
    exception: string | object;
    statusCode: number;
  };
  message: string;
}

export function isRpcErrorObject(
  exception: unknown,
): exception is RpcException & RpcErrorPayload {
  if (typeof exception !== 'object' || exception === null) {
    return false;
  }

  // Check if it's an RpcException
  if (exception instanceof RpcException) {
    const error = exception.getError();
    if (typeof error !== 'object' || error === null) {
      return false;
    }

    // Check for our custom fields
    return 'type' in error || 'exception' in error;
  }

  // Fallback for other potential wrapped errors
  const err = exception as { error?: unknown };
  if (typeof err.error !== 'object' || err.error === null) {
    return false;
  }

  const errorPayload = err as RpcErrorPayload;
  return 'type' in errorPayload.error || 'exception' in errorPayload.error;
}

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

      case exception instanceof Error && !!exception.message:
        statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
        message = exception.message;
        break;

      case exception instanceof AggregateError:
        statusCode = HttpStatus.BAD_GATEWAY;
        message = 'Invalid Connection';
        break;

      // Обработка ошибок на стороне микросервисов
      case isRpcErrorObject(exception):
        const { error } = exception as RpcErrorPayload;
        statusCode = error.statusCode;
        message = {
          message: error.exception,
        };
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
