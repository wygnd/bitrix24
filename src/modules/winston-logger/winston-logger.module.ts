import { Module } from '@nestjs/common';
import { WinstonLogger, WinstonModule } from 'nest-winston';
import winston from 'winston';
import { join } from 'path';
import DailyRotateFile from 'winston-daily-rotate-file';

@Module({
  imports: [
    WinstonModule.forRootAsync({
      useFactory: () => {
        const loggerDirectory = join(process.cwd(), '..', '..', '..', 'logs');

        return {
          level: 'info',
          exitOnError: false,
          transports: [
            new DailyRotateFile({
              filename: join(loggerDirectory, 'logger-%DATE%.log'),
              datePattern: 'YYYY-MM-DD',
              maxFiles: '60d',
              format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.errors({ stack: true }),
                winston.format.json(),
              ),
            }),
          ],
        };
      },
    }),
  ],
  providers: [WinstonLogger],
  exports: [WinstonLogger],
})
export class WinstonLoggerModule {}
