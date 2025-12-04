import { Module } from '@nestjs/common';
import { LoggerModule } from 'nestjs-pino';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [
    LoggerModule.forRootAsync({
      imports: [ConfigService],
      useFactory: () => ({
        pinoHttp: {
          level: 'info',
          customLogLevel: (res, err) => {
            if (err || (res.statusCode && res.statusCode >= 500))
              return 'error';
            if (res.statusCode && res.statusCode >= 400) return 'warn';
            return 'info';
          },
          customSuccessMessage: (req, res) =>
            `${req.method} ${req.url} -> ${res.statusCode}`,
          customErrorMessage: (req, res, err) =>
            `ERROR ${req.method} ${req.url} -> ${res.statusCode}: 
                      ${err?.message}`,
          serializers: {
            req(req) {
              return {
                method: req.method,
                url: req.url,
              };
            },
            res(res) {
              return {
                statusCode: res.statusCode,
                responseTime: res.responseTime,
              };
            },
            err(err) {
              if (!err) return undefined;
              return {
                message: err.message,
              };
            },
          },
          transport: {
            target: 'pino-loki',
            options: {
              host: 'http://localhost:3100',
              json: true,
              batch: true,
              labels: { app: 'nestjs-loki-grafana' },
            },
          },
        },
      }),
      inject: [ConfigService],
    }),
  ],
})
export class PinoModule {}
