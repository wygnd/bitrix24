import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { B24AddyIntegrationRegisterClientRequestDTO } from '../../application/dtos/addy/integration/clients/registeration/requests/dto';
import { B24AddyIntegrationUseCase } from '../../application/use-cases/addy/integration/use-case';
import { B24Tags } from '../../../constants/constant';
import { AuthGuard } from '@shared/guards/auth.guard';
import { B24AddyIntegrationRegisterClientResponseDTO } from '../../application/dtos/addy/integration/clients/registeration/responses/dto';
import { B24AddyIntegrationAddClientPaymentRequestDTO } from '../../application/dtos/addy/integration/clients/payments/requests/dto';

@UseGuards(AuthGuard)
@ApiTags(B24Tags.ADDY_INTEGRATION)
@Controller({
  version: '1',
  path: 'integration/addy',
})
export class B24IntegrationAddyController {
  constructor(
    private readonly addyIntegrationUseCase: B24AddyIntegrationUseCase,
  ) {}

  @ApiOperation({ summary: 'Обработка регистрации клиента в Addy сервисе' })
  @ApiOkResponse({
    type: B24AddyIntegrationRegisterClientResponseDTO,
    description: 'Успешная обработка',
  })
  @HttpCode(HttpStatus.OK)
  @Post('/clients/sign_in')
  public async emitRegisterEvent(
    @Body() body: B24AddyIntegrationRegisterClientRequestDTO,
  ) {
    return this.addyIntegrationUseCase.handleEmitRegisterEvent(body);
  }

  @ApiOperation({ summary: 'Обработка пополнение клиента в Addy сервисе' })
  @HttpCode(HttpStatus.OK)
  @Post('/clients/payments/add')
  public async emitClientPayment(
    @Body() body: B24AddyIntegrationAddClientPaymentRequestDTO,
  ) {
    return this.addyIntegrationUseCase.handleEmitClientAddPayment(body);
  }
}
