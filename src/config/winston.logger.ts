import { Injectable, Logger } from '@nestjs/common';
import winston from 'winston';
import { join } from 'path';
import 'winston-daily-rotate-file';

@Injectable()
export class WinstonLogger {
  private readonly logger: winston.Logger;
  private readonly consoleLogger: Logger;

  constructor(name: string, filePath: string[] = []) {
    const loggerDir = join(process.cwd(), 'logs');
    this.consoleLogger = new Logger(name);

    const transportOptions = {
      file: new winston.transports.DailyRotateFile({
        level: 'info',
        filename: `${name}-%DATE%.log`,
        dirname: join(loggerDir, ...filePath, name),
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
      transports: [transportOptions.file],
      exceptionHandlers: [transportOptions.file],
      exitOnError: false,
    });
  }

  public error(
    message: string,
    trace?: string,
    disableConsoleLog: boolean = false,
  ) {
    const log = trace ? `${message} - ${trace}` : message;

    this.logger.error(log);
    if (!disableConsoleLog) this.consoleLogger.error(log);
  }

  public warn(message: string, disableConsoleLog: boolean = false) {
    this.logger.warn(message);

    if (!disableConsoleLog) this.consoleLogger.warn(message);
  }

  public info(message: string, disableConsoleLog: boolean = false) {
    this.logger.info(message);

    if (!disableConsoleLog) this.consoleLogger.debug(message);
  }
}
