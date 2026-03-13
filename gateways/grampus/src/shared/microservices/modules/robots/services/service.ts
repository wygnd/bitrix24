import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { MICROSERVICES } from '@/shared/microservices/constants/constants';
import { catchError, firstValueFrom, of, timeout } from 'rxjs';
import { WinstonLogger } from '@/config/winston.logger';
import { maybeCatchError } from '@/common/utils/catch-error';
import { IRobotsYandexDirectQueryParams } from '@/shared/microservices/modules/robots/interfaces/yandex/direct/request/invoice.interface';

@Injectable()
export class RobotsService {
  private readonly logger = new WinstonLogger(
    RobotsService.name,
    'microservices:robots'.split(':'),
  );

  constructor(
    @Inject(MICROSERVICES.ROBOTS)
    private readonly robotsClient: ClientProxy,
  ) {}

  /**
   * Check health microservice
   *
   * ---
   *
   * Проверка работоспособности сервиса
   */
  public async checkHealth() {
    const observable = this.robotsClient.send({ cmd: 'health' }, {}).pipe(
      timeout(300),
      catchError((err) => {
        const errorMessage = maybeCatchError(err);
        this.logger.error({
          handler: this.checkHealth.name,
          error: errorMessage,
        });
        return of({
          status: false,
          detail: errorMessage,
        });
      }),
    );

    return firstValueFrom(observable);
  }

  /**
   * Send request in **robots microservice** for set invoice
   *
   * ---
   *
   * Отправляет запрос в **микросервис robots** для выставления счета
   * @param data
   */
  public async sendRequestForGetInvoiceNumber(
    data: IRobotsYandexDirectQueryParams,
  ) {
    const observable = this.robotsClient
      .send({ cmd: 'yandex.direct.get.invoice' }, data)
      .pipe(
        timeout(30000), // 30 секунд
        catchError((err) => {
          this.logger.error({
            handler: this.sendRequestForGetInvoiceNumber.name,
            request: data,
            error: maybeCatchError(err),
          });

          return of({
            status: false,
            invoice_number: null,
          });
        }),
      );

    return firstValueFrom<{ status: boolean; invoice_number: string | null }>(
      observable,
    );
  }
}
