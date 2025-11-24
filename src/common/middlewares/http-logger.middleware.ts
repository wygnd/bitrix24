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

      let message = `[${statusCode}] ${method} ${url} - ${userAgent} => ${Date.now() - requestTime}ms`;

      this.logger.verbose(message);
    });

    next();
  }
}
