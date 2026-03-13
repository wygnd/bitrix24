import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { WinstonLogger } from '@shared/logger/winston.logger';
import { NextFunction, Request, Response } from 'express';

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

    res.on('close', () => {
      const { statusCode } = res;

      let message = `[${statusCode}] ${method} ${url} - ${userAgent} => ${Date.now() - requestTime}ms`;

      if (!/Prometheus/gi.test(userAgent)) this.logger.debug(message);

      this.fileLogger.debug(
        `${message} | params: ${JSON.stringify(params)} | query: ${JSON.stringify(query)} | body: ${JSON.stringify(body)}`,
      );
    });

    next();
  }
}
