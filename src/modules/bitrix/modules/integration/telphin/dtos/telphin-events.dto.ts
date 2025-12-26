import { BitrixEventsAnswerOptions } from '@/modules/bitrix/modules/integration/telphin/interfaces/telphin-events.interface';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { TelphinEventType } from '@/modules/telphin/interfaces/telphin-events.interface';
import type {
  TelphinEventCallStatus,
  TelphinEventCallFlow,
} from '@/modules/telphin/interfaces/telphin-events.interface';

export class BitrixTelphinEventsAnswerDto implements BitrixEventsAnswerOptions {
  @ApiProperty({
    type: String,
    description: 'Имя вызываемого внутреннего номера (в виде xxx*yyy@domain)',
    required: true,
    example: '13596*106@sipproxy.telphin.ru',
  })
  @IsOptional()
  @IsString()
  CalledExtension?: string;

  @ApiProperty({
    type: String,
    description: 'Идентификатор внутреннего номера CalledExtension',
    required: true,
    example: '1138241',
  })
  @IsOptional()
  @IsString()
  CalledExtensionID?: string;

  @ApiProperty({
    type: String,
    description:
      'Внутренний номер, с которого произведен вызов (в виде xxx*yyy@domain)',
    required: true,
    example: '13596*099@sipproxy.telphin.ru',
  })
  @IsNotEmpty()
  @IsString()
  CallerExtension: string;

  @ApiProperty({
    type: String,
    description:
      'Идентификатор внутреннего номера CallerExtension. Удобен для последующих вызовов API, ожидающих идентификатор',
    required: true,
    example: '1113800',
  })
  @IsNotEmpty()
  @IsString()
  CallerExtensionID: string;

  @ApiProperty({
    type: String,
    description: 'Тип события',
    required: true,
    example: TelphinEventType.INCOMING,
  })
  @IsNotEmpty()
  @IsString()
  EventType: TelphinEventType;

  @ApiProperty({
    type: String,
    description:
      'Уникальный идентификатор вызова. Не меняется при переадресациях. Можно использовать для идентификации принадлежности различных событий одному вызову',
    required: true,
    example: 'a4we334iu23a05634df42b98c817bcc4a97hbc66',
  })
  @IsNotEmpty()
  @IsString()
  CallID: string;

  @ApiProperty({
    type: String,
    description: 'Номер вызывающего абонента',
    required: true,
    example: '+79214567892',
  })
  @IsNotEmpty()
  @IsString()
  CallerIDNum: string;

  @ApiProperty({
    type: String,
    description: 'мя вызывающего абонента (если есть)',
    required: true,
    example: '+79214567892',
  })
  @IsNotEmpty()
  @IsString()
  CallerIDName: string;

  @ApiProperty({
    type: String,
    description: 'Публичный номер вызываемого абонента (если есть)',
    required: true,
    example: '79300369446',
  })
  @IsOptional()
  @IsString()
  CalledDID?: string;

  @ApiProperty({
    type: String,
    description: 'Статус вызова',
    required: true,
    example: 'CALLING',
  })
  @IsNotEmpty()
  @IsString()
  CallStatus: TelphinEventCallStatus;

  @ApiProperty({
    type: String,
    description: 'Направление вызова',
    required: true,
    example: 'IN',
  })
  @IsNotEmpty()
  @IsString()
  CallFlow: TelphinEventCallFlow;

  @ApiProperty({
    type: String,
    description: 'Вызываемый номер',
    required: true,
    example: '13596*100',
  })
  @IsNotEmpty()
  @IsString()
  CalledNumber: string;

  @ApiProperty({
    type: String,
    description:
      'В отличии от параметра CallID, одинакового для всего вызова, позволяет выделить в звонке составную часть. Например, если в пределах одного вызова звонок приходил на один внутренний номер несколько раз (например, несколько раз по кругу, как агент очереди), то этот параметр будет отличаться. Полезен для группировки dial-in, dial-out, answer, hangup составной части вызова',
    required: true,
    example: '1138241-62fe48ce745644da12agf67ea494ad61f',
  })
  @IsNotEmpty()
  @IsString()
  SubCallID: string;

  @ApiProperty({
    type: String,
    description:
      'Уникальный идентификатор вызова для управления им (например: обрыв, перевод, парковка)',
    required: true,
    example: '87623746-a4c009a0-234gd-4we2-8c81-7bcc4a5d4c66',
  })
  @IsNotEmpty()
  @IsString()
  CallAPIID: string;

  @ApiProperty({
    type: String,
    description: 'Время генерации события: микросекунды c 1 января 1970 года',
    required: true,
    example: '1766736711480097',
  })
  @IsNotEmpty()
  @IsString()
  EventTime: string;
}
