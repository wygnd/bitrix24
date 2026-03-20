import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { IB24AddyClientsContractAddRequest } from '../../../../../../../../application/interfaces/addy/integration/clients/contracts/add/requests/interface';

export class B24AddyClientContractsAddDTO implements IB24AddyClientsContractAddRequest {
  @ApiProperty({
    type: String,
    description: 'Почта клиента',
    required: true,
    example: 'example@gmail.com',
  })
  @IsNotEmpty()
  @IsString()
  @IsEmail()
  email: string;

  @ApiProperty({
    type: String,
    description: 'Номер договора',
    required: true,
    example: '12332154',
  })
  @IsString()
  @IsNotEmpty()
  contract_number: string;
}
