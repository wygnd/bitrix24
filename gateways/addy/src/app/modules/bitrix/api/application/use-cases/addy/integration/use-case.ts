import { Injectable } from '@nestjs/common';
import { IB24AddyIntegrationRegisterClientRequest } from '../../../interfaces/addy/integration/clients/registration/requests/interface';

@Injectable()
export class B24AddyIntegrationUseCase {
  constructor() {}

  /**
   * Handle client register in Addy service
   *
   * ---
   *
   * Обработка регистрации клиента в сервисе Addy
   * @param data
   */
  public async handleEmitRegisterEvent(
    data: IB24AddyIntegrationRegisterClientRequest,
  ) {}
}
