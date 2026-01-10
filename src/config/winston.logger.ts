import { Injectable, Logger, LogLevel } from '@nestjs/common';
import winston from 'winston';
import { join } from 'path';
import 'winston-daily-rotate-file';
import safeJsonStringify from 'safe-json-stringify';

@Injectable()
export class WinstonLogger {
  private readonly logger: winston.Logger;
  private readonly consoleLogger: Logger;

  constructor(name: string, filePath: string[] = []) {
    const loggerDir = join(process.cwd(), 'logs');
    this.consoleLogger = new Logger(name);

    const transportOptions = {
      file: new winston.transports.DailyRotateFile({
        filename: `${name}-%DATE%.log`,
        dirname: join(loggerDir, ...filePath, name),
        format: winston.format.combine(
          winston.format.timestamp(),
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

    transportOptions.file.setMaxListeners(0);

    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.json(),
      transports: [transportOptions.file],
      exceptionHandlers: [transportOptions.file],
      exitOnError: false,
    });
  }

  public error<T>(message: T, enableConsoleLog: boolean = false) {
    const msg = this.toSaveJson(message);
    this.logger.error(msg);

    if (enableConsoleLog) this.consoleLogger.error(msg);
  }

  public warn<T>(message: T, enableConsoleLog: boolean = false) {
    const msg = this.toSaveJson(message);
    this.logger.warn(msg);

    if (enableConsoleLog) this.consoleLogger.warn(msg);
  }

  public debug<T>(message: T, enableConsoleLog: boolean = false) {
    const msg = this.toSaveJson(message);
    this.logger.info(msg);

    if (enableConsoleLog) this.consoleLogger.debug(msg);
  }

  public log<T>(message: T, level: LogLevel = 'debug') {
    const msg = this.toSaveJson(message);

    this.consoleLogger[level](msg);
  }

  private toSaveJson(data: any) {
    return safeJsonStringify(data) as string;
  }
}
