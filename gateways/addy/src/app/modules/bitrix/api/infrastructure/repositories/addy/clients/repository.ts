import { WinstonLogger } from '@shared/logger/winston.logger';
import {
  ConflictException,
  Injectable,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { B24AddyClientsModel } from '../../../persistence/models/addy/clients/model';
import { B24AddyClientsRepoPort } from '../../../../application/ports/addy/clients/repo/port';
import { maybeCatchError } from '@shared/utils/catch-error';
import {
  IB24AddyClientBulkUpdate,
  IB24AddyClientEntity,
  TB24AddyClientCreationEntity,
  TB24AddyClientGetClient,
  TB24AddyClientUpdateEntity,
} from '../../../../application/interfaces/addy/integration/clients/entities/entity';
import { FindOptions } from 'sequelize';
import { Sequelize } from 'sequelize-typescript';

@Injectable()
export class B24AddyClientsRepository implements B24AddyClientsRepoPort {
  private readonly logger = new WinstonLogger(
    B24AddyClientsRepository.name,
    'bitrix/addy/clients',
  );

  constructor(
    @InjectModel(B24AddyClientsModel)
    private readonly addyClientsRepo: typeof B24AddyClientsModel,
    private readonly sequelize: Sequelize,
  ) {}

  /**
   * Add new row in database
   *
   * ---
   *
   * Добавляет новую запись в БД
   * @param fields
   */
  public async addClient(
    fields: TB24AddyClientCreationEntity,
  ): Promise<B24AddyClientsModel> {
    try {
      const [client, wasCreated] = await this.addyClientsRepo.findOrCreate({
        where: {
          email: fields.email,
        },
        defaults: fields,
      });

      if (!wasCreated) throw new ConflictException('Клиент уже существует');

      return client;
    } catch (error) {
      this.logger.error({
        handler: this.addClient.name,
        request: fields,
        response: maybeCatchError(error),
      });

      throw error;
    }
  }

  /**
   * Get row by specific field
   *
   * ---
   *
   * Получает клиента по определенному полю
   * @param type
   * @param field
   */
  public async getClientBy(
    type: TB24AddyClientGetClient,
    field: string | number,
  ): Promise<B24AddyClientsModel> {
    try {
      let response: B24AddyClientsModel | null;

      switch (type) {
        case 'id':
          console.log(field);
          response = await this.addyClientsRepo.findByPk(field);
          break;

        case 'email':
          response = await this.addyClientsRepo.findOne({
            where: {
              [type]: field,
            },
          });
          break;

        default:
          throw new UnprocessableEntityException('Invalid type');
      }

      if (!response) throw new UnprocessableEntityException('Клиент не найден');

      return response;
    } catch (error) {
      this.logger.error({
        handler: this.getClientBy.name,
        request: { type, field },
        error: maybeCatchError(error),
      });

      throw error;
    }
  }

  /**
   * Update client fields
   *
   * ---
   *
   * Обновляет поля клиента
   * @param clientId
   * @param fields
   */
  public async updateClient(
    clientId: number,
    fields: TB24AddyClientUpdateEntity,
  ) {
    try {
      const [updatedCount] = await this.addyClientsRepo.update(fields, {
        where: {
          id: clientId,
        },
      });

      return updatedCount > 0;
    } catch (error) {
      this.logger.error({
        handler: this.updateClient.name,
        request: {
          clientId,
          fields,
        },
        error: maybeCatchError(error),
      });

      throw error;
    }
  }

  /**
   * Get client list by specific conditionals
   *
   * ---
   *
   * Получить список клиентов по определенным условиям
   */
  public async getClientList(options?: FindOptions<IB24AddyClientEntity>) {
    try {
      return await this.addyClientsRepo.findAll(options);
    } catch (error) {
      this.logger.error({
        handler: this.getClientList.name,
        request: options,
        error: maybeCatchError(error),
      });

      throw error;
    }
  }

  /**
   * Update some strokes
   *
   * ---
   *
   * Обновляет несколько строк
   */
  public async bulkUpdateClients(
    fields: IB24AddyClientBulkUpdate[],
  ): Promise<void> {
    try {
      await this.sequelize.transaction(async (transaction) => {
        for (const { clientId, fields: rows } of fields) {
          await this.addyClientsRepo.update(rows, {
            where: {
              id: clientId,
            },
            transaction: transaction,
          });
        }
      });
    } catch (error) {
      this.logger.error({
        handler: this.bulkUpdateClients.name,
        request: fields,
        error: maybeCatchError(error),
      });

      throw error;
    }
  }
}
