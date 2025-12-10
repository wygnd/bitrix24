import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { Transform } from 'class-transformer';

export class IncomingWebhookAuthOptionsDto {
  @ApiProperty({
    type: String,
    description: 'source webhook domain',
    example: 'domain.bitrix24.ru',
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  domain: string;

  @ApiProperty({
    type: String,
    description: 'source client domain',
    example: 'https://domain.bitrix24.ru/rest',
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  client_endpoint: string;

  @ApiProperty({
    type: String,
    description: 'server endpoint',
    example: 'https://oauth.bitrix24.tech/rest/',
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  server_endpoint: string;

  @ApiProperty({
    type: String,
    description: 'member id',
    example: 'd8gewgejtyrbfdcfe17dd4bbca56b884467u865',
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  member_id: string;
}

export class IncomingWebhookDto {
  @ApiProperty({
    type: [String],
    description: 'entity data',
    example: ['crm', 'CCrmDocumentDeal', 'DEAL_1234'],
  })
  @IsNotEmpty()
  @Transform(({ value }) => {
    value[2] = value[2].split('_')[1];
    return value;
  })
  document_id: string[];

  @ApiProperty({
    type: IncomingWebhookAuthOptionsDto,
    example: IncomingWebhookAuthOptionsDto,
    description: 'Auth data',
    required: true,
  })
  @IsNotEmpty()
  auth: IncomingWebhookAuthOptionsDto;
}
