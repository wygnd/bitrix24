import { BitrixWikiDistributeLeadWishManager } from '@/modules/bitrix/application/interfaces/wiki/wiki-distribute-lead-wish-manager.interface';
import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class BitrixDistributeLeadWishManagerDTO implements BitrixWikiDistributeLeadWishManager {
  @ApiProperty({
    type: String,
    description: 'ID пользователя bitrix',
    required: true,
    example: '762',
  })
  @IsNotEmpty()
  @IsString()
  user_id: string;
}
