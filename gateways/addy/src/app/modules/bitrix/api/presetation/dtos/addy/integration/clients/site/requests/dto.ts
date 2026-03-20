import { IB24AddyIntegrationAddClientSiteRequest } from '../../../../../../../application/interfaces/addy/integration/clients/site/requests/interface';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class B24AddyIntegrationAddClientSiteRequestDTO implements IB24AddyIntegrationAddClientSiteRequest {
  @ApiProperty({
    type: String,
    description: 'Имя клиента',
    required: false,
    example: 'Алексей',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({
    type: String,
    description: 'Номер телефона клиента',
    required: true,
    example: '+79215447382',
  })
  @IsNotEmpty()
  @IsString()
  phone: string;
}
