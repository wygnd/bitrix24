import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { catchError, tap } from 'rxjs';
import { WinstonLogger } from 'src/shared/logger/main';

@Injectable()
export class LoggerInterceptor implements NestInterceptor {
  private readonly logger = new WinstonLogger('requests', 'requests');

  intercept(context: ExecutionContext, next: CallHandler) {
    const requestStart = Date.now();
    const data = context.switchToRpc().getData();

    this.logger.log(data);

    return next.handle().pipe(
      tap(() => {
        this.logger.debug({
          time: `${Date.now() - requestStart}ms`,
          data,
        });
      }),
      catchError((err) => {
        this.logger.error({
          time: `${Date.now() - requestStart}ms`,
          request: data,
          error: err,
        });
        throw err;
      }),
    );
  }
}
