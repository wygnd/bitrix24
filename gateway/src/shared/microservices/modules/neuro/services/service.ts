import { Injectable } from '@nestjs/common';
import { INeuroRequestData } from '@/shared/microservices/interfaces/interface';
import { WinstonLogger } from '@/config/winston.logger';
import { maybeCatchError } from '@/common/utils/catch-error';
import { IAnalyzeManagerCallRequest } from '../interfaces/interface';
import { NEURO_COMMANDS } from '@/shared/microservices/modules/neuro/constants/constants';

@Injectable()
export class NeuroService {
  private readonly logger = new WinstonLogger(
    NeuroService.name,
    'microservices:neuro'.split(':'),
  );

  constructor() {}
  /**
   * Base realization sending request to microservice
   *
   * ---
   *
   * Базовая реализация отправки данных в микросервис
   * @param {string} request.command - command name
   * @param {any} [request.data] - payload
   * @private
   */
  private async sendRequest<R = any>(request: INeuroRequestData) {
    try {
      return { status: true };
      // return await firstValueFrom<R>(
      // this.neuroClient.send({ cmd: request.command }, request.data ?? {}),
      // );
    } catch (error) {
      this.logger.error({
        handler: this.sendRequest.name,
        error: maybeCatchError(error),
      });

      throw error;
    }
  }

  /**
   * Health check
   *
   * ---
   *
   * Проверка работоспособности сервиса
   */
  public async checkHealth() {
    try {
      return this.sendRequest<{ status: boolean }>({
        command: NEURO_COMMANDS.HEALTH,
      });
    } catch (error) {
      return { status: false, detail: maybeCatchError(error) };
    }
  }

  /**
   * Send request to **neuro microservice**
   *
   * ---
   *
   * Отправляет запрос в **neuro микросервис**
   * @param data
   */
  public async maybeAnalyzeCall(data: IAnalyzeManagerCallRequest) {
    // return this.sendRequest({
    //   command: NEURO_COMMANDS.ANALYZE_MANAGER_CALLING,
    //   data: data,
    // });
  }
}
