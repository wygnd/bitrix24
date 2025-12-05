import { Injectable } from '@nestjs/common';
import winston from 'winston';
import { join } from 'path';
import 'winston-daily-rotate-file';

@Injectable()
export class WinstonLogger {
  private readonly logger: winston.Logger;

  constructor(name: string) {
    const loggerDir = join(process.cwd(), 'logs');

    const transportOptions = {
      file: new winston.transports.DailyRotateFile({
        filename: `${name}-%DATE%.log`,
        dirname: join(loggerDir, name),
        format: winston.format.combine(
          winston.format.timestamp({
            format: 'YYYY-MM-DD HH:mm:ss',
          }),
          winston.format.errors({ stack: true }),
          winston.format.printf(
            ({ timestamp, level, message }) =>
              `${timestamp} [${level}]: ${message}`,
          ),
        ),
        zippedArchive: true,
        datePattern: 'YYYY-MM-DD',
        maxFiles: '30d',
        auditFile: join(loggerDir, 'audit.json'),
      }),
      console: new winston.transports.Console({
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.colorize({ all: true }),
          winston.format.printf(
            ({ timestamp, level, message }) =>
              `${timestamp} [${level}]: ${message}`,
          ),
        ),
      }),
    };

    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.json(),
      transports: [transportOptions.file, transportOptions.console],
      exceptionHandlers: [transportOptions.file, transportOptions.console],
      exitOnError: false,
    });
  }

  public error(message: string, trace?: string) {
    this.logger.error(trace ? `${message} - ${trace}` : message);
  }

  public warn(message: string) {
    this.logger.warn(message);
  }

  public info(message: string) {
    this.logger.info(message);
  }

  public debug(message: string) {
    this.logger.debug(message);
  }
}
