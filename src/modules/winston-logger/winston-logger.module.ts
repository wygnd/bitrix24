import { Module } from '@nestjs/common';
import { WinstonModule } from 'nest-winston';
import winston from 'winston';
import { join } from 'path';

@Module({
  imports: [
    WinstonModule.forRootAsync({
      useFactory: () => {
        const loggerDirectory = join(process.cwd(), '..', '..', '..', 'logs');

        return {
          exitOnError: false,
          transports: [
            new winston.transports.DailyRotateFile({
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
})
export class WinstonLoggerModule {}
