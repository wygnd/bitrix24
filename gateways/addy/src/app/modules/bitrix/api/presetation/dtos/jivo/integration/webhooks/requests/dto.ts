import { IB24JivoIntegrationWebhookRequest } from '../../../../../../application/interfaces/jivo/integration/webhooks/requests/interface';
import {
  IsIn,
  IsInt,
  IsNotEmpty,
  IsString,
  ValidateNested,
} from 'class-validator';
import { IJivoWebhookVisitor } from '../../../../../../application/interfaces/jivo/integration/webhooks/interface';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class B24JivoIntegrationWebhooksVisitorDTO implements IJivoWebhookVisitor {
  @ApiProperty({
    type: String,
    description: 'Имя клиента',
    required: true,
    example: 'Илья',
  })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({
    type: String,
    description: 'Почта клиента',
    required: true,
    example: 'example@gmail.com',
  })
  @IsNotEmpty()
  @IsString()
  email: string;

  @ApiProperty({
    type: String,
    description: 'Номер телефона клиента',
    required: true,
    example: '+79344563421',
  })
  @IsNotEmpty()
  @IsString()
  phone: string;

  @ApiProperty({
    type: String,
    description: 'Описание',
    required: true,
    example: 'Some description',
  })
  @IsNotEmpty()
  @IsString()
  description: string;

  @ApiProperty({
    type: String,
    description: 'Номер',
    required: true,
    example: '1',
  })
  @IsNotEmpty()
  @IsString()
  number: string;

  @ApiProperty({
    type: Number,
    description: 'Кол-во чатов',
    required: true,
    example: 2,
  })
  @IsNotEmpty()
  @Type(() => Number)
  @IsInt()
  chats_count: number;
}

export class B24JivoIntegrationWebhooksRequestDTO implements IB24JivoIntegrationWebhookRequest {
  @IsNotEmpty()
  @IsIn(['chat_accepted', 'chat_finished'])
  @IsString()
  event_name: string;

  @ApiProperty({
    type: B24JivoIntegrationWebhooksVisitorDTO,
    description: 'Данные клиента',
    required: true,
  })
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => B24JivoIntegrationWebhooksVisitorDTO)
  visitor: B24JivoIntegrationWebhooksVisitorDTO;
}
