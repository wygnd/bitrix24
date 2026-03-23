import { BitrixBotCommandsAttributes } from '@/modules/bitrix/application/interfaces/bot/bot-commands.interface';
import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class BitrixBotCommandsDTO implements BitrixBotCommandsAttributes {
  @Expose()
  @ApiProperty({
    type: Number,
    required: true,
    description: 'ID записи',
    example: 1,
  })
  id: number;

  @Expose()
  @ApiProperty({
    type: Number,
    required: true,
    description: 'ID бота в bitrix',
    example: 3712,
  })
  botId: number;

  @Expose()
  @ApiProperty({
    type: Number,
    description: 'ID команды в bitrix',
    required: true,
    example: 1,
  })
  commandId: number;

  @Expose()
  @ApiProperty({
    type: String,
    required: true,
    description: 'Команда',
    example: 'approveSite',
  })
  command: string;

  @Expose()
  @ApiProperty({
    type: String,
    required: false,
    description: 'Описание',
    example: 'some description',
  })
  description?: string;

  @Expose()
  @ApiProperty({
    type: String,
    required: true,
    description: 'Ссылка на обработчик',
    example: 'https://handler.example.com',
  })
  handler: string;
}
