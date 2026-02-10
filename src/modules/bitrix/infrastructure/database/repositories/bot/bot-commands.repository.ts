import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { BitrixBotCommandsModel } from '@/modules/bitrix/infrastructure/database/entities/bot/bot-commands.entity';
import { BitrixBotCommandsRepositoryPort } from '@/modules/bitrix/application/ports/bot/bot-commands-repository.port';
import { BitrixBotCommandsDTO } from '@/modules/bitrix/application/dtos/bot/bot-commands.dto';
import {
  BitrixBotCommandsAttributes,
  BitrixBotCommandsCreationalAttributes,
  BitrixBotCommandsUpdateAttributes,
} from '@/modules/bitrix/application/interfaces/bot/bot-commands.interface';
import { plainToInstance } from 'class-transformer';
import { WinstonLogger } from '@/config/winston.logger';
import { FindOptions } from 'sequelize';

@Injectable()
export class BitrixBotCommandsRepository implements BitrixBotCommandsRepositoryPort {
  private readonly logger = new WinstonLogger(
    BitrixBotCommandsRepository.name,
    'bitrix:bot'.split(':'),
  );

  constructor(
    @InjectModel(BitrixBotCommandsModel)
    private readonly botCommandsRepository: typeof BitrixBotCommandsModel,
  ) {}

  /**
   * Get command list with specific fields
   *
   * ---
   *
   * Получить спиоск команд по определенным свойствам
   */
  async getCommands(
    options: FindOptions<BitrixBotCommandsAttributes>,
  ): Promise<BitrixBotCommandsDTO[]> {
    try {
      const response = await this.botCommandsRepository.findAll(options);
      this.logger.debug(response);
      return response.map((r) => this.formDTO(r));
    } catch (error) {
      this.logger.error(error);
      return [];
    }
  }

  /**
   * Get bot command by command id
   *
   * ---
   *
   * Получить команду по ID
   * @param commandId
   */
  async getCommand(commandId: number): Promise<BitrixBotCommandsDTO | null> {
    try {
      const response = await this.botCommandsRepository.findOne({
        where: {
          id: commandId,
        },
      });
      this.logger.debug(response);
      return response ? this.formDTO(response) : null;
    } catch (error) {
      this.logger.error(error);
      return null;
    }
  }

  /**
   * Create new row about command in database
   *
   * ---
   *
   * Создать новую запись команды в БД
   * @param fields
   */
  async createCommand(
    fields: BitrixBotCommandsCreationalAttributes,
  ): Promise<BitrixBotCommandsDTO | null> {
    try {
      const response = await this.botCommandsRepository.create(fields);
      this.logger.debug(response);
      return this.formDTO(response);
    } catch (error) {
      this.logger.error(error);
      return null;
    }
  }

  /**
   * Update command fields in database
   *
   * ---
   *
   * Обновить поля команды в БД
   * @param commandId
   * @param fields
   */
  async updateCommand(
    commandId: number,
    fields: BitrixBotCommandsUpdateAttributes,
  ): Promise<boolean> {
    try {
      const [response] = await this.botCommandsRepository.update(fields, {
        where: {
          id: commandId,
        },
      });
      this.logger.debug(response);
      return response > 0;
    } catch (error) {
      this.logger.error(error);
      return false;
    }
  }

  /**
   * Delete command from database
   *
   * ---
   *
   * Удалить команду из БД
   * @param commandId
   */
  async removeCommand(commandId: number): Promise<boolean> {
    try {
      const response = await this.botCommandsRepository.destroy({
        where: {
          commandId: commandId,
        },
      });
      this.logger.debug(response);
      return response > 0;
    } catch (error) {
      this.logger.error(error);
      return false;
    }
  }

  private formDTO(model: BitrixBotCommandsModel) {
    return plainToInstance(BitrixBotCommandsDTO, model, {
      excludeExtraneousValues: true,
    });
  }
}
