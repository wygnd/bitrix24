import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class HttpLoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  use(req: Request, res: Response, next: NextFunction): void {
    const { ip, method, originalUrl: url } = req;
    const userAgent = req.get('user-agent') || '';
    const requestTime = Date.now();

    res.on('close', () => {
      const { statusCode } = res;

      let message = `[INCOMING] [${statusCode}] ${method} ${url} - ${userAgent}: ${ip} => ${Date.now() - requestTime}ms`;

      this.logger.log(message);
    });

    next();
  }
}
