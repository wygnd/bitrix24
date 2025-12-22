import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { WinstonLogger } from '@/config/winston.logger';

@Injectable()
export class HttpLoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');
  private readonly fileLogger = new WinstonLogger('HTTP');

  use(req: Request, res: Response, next: NextFunction): void {
    const {
      method,
      originalUrl: url,
      body = {},
      params = {},
      query = {},
    } = req;
    const userAgent = req.get('user-agent') || '';
    const requestTime = Date.now();

    if (/Prometheus/gi.test(userAgent)) {
      next();
      return;
    }

    res.on('close', () => {
      const { statusCode } = res;

      let message = `[${statusCode}] ${method} ${url} - ${userAgent} => ${Date.now() - requestTime}ms`;

      this.logger.debug(message);
      this.fileLogger.info(
        `${message} | params: ${JSON.stringify(params)} | query: ${JSON.stringify(query)} | body: ${JSON.stringify(body)}`,
        true,
      );
    });

    next();
  }
}
