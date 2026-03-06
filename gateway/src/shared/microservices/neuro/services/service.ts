import { Inject, Injectable } from '@nestjs/common';
import { MICROSERVICES } from '@/constants/constants';
import { ClientProxy } from '@nestjs/microservices';
import { INeuroRequestData } from '@/shared/microservices/neuro/interfaces/interface';
import { WinstonLogger } from '@/config/winston.logger';
import { maybeCatchError } from '@/common/utils/catch-error';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class NeuroService {
  private readonly logger = new WinstonLogger(
    NeuroService.name,
    'microservices:neuro'.split(':'),
  );

  constructor(
    // @Inject(MICROSERVICES.USERS) private readonly neuroClient: ClientProxy,
  ) {}
  /**
   * Base realization sending request to microservice
   *
   * ---
   *
   * Базовая реализация отправки данных в микросервис
   * @param request
   * @private
   */
  private async sendRequest<R = any>(request: INeuroRequestData) {
    try {
      return {status: true}
      // return await firstValueFrom<R>(
      //   this.neuroClient.send({ cmd: request.command }, request.data ?? {}),
      // );
    } catch (error) {
      this.logger.error({
        handler: this.sendRequest.name,
        error: maybeCatchError(error),
      });

      throw error;
    }
  }

  public async checkHealth() {
    try {
      return this.sendRequest<{ status: boolean }>({ command: 'health' });
    } catch (error) {
      return { status: false, detail: maybeCatchError(error) };
    }
  }

  public async maybeAnalyzeCall() {
    return {
      status: true,
      detail: 'mock implementation',
    };
  }
}
