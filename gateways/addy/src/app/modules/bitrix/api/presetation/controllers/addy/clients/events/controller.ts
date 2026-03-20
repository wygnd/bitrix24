import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  MethodNotAllowedException,
  Post,
  UseGuards,
} from '@nestjs/common';
import { B24AddyIntegrationUseCase } from '../../../../../application/use-cases/addy/integration/clients/use-case';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { B24AddyIntegrationRegisterClientResponseDTO } from '../../../../dtos/addy/integration/clients/registeration/responses/dto';
import { B24AddyIntegrationRegisterClientRequestDTO } from '../../../../dtos/addy/integration/clients/registeration/requests/dto';
import { B24AddyIntegrationAddClientPaymentRequestDTO } from '../../../../dtos/addy/integration/clients/payments/requests/dto';
import { AuthGuard } from '@shared/guards/auth.guard';
import { B24AddyApiTag } from '../../../../../application/constants/addy/constant';
import { B24AddyClientContractsAddDTO } from '../../../../dtos/addy/integration/clients/contracts/add/requests/dto';
import { B24AddyIntegrationAddClientSiteRequestDTO } from '../../../../dtos/addy/integration/clients/site/requests/dto';

@ApiTags(B24AddyApiTag)
@UseGuards(AuthGuard)
@Controller({
  version: '1',
  path: 'integration/addy/clients/events',
})
export class B24IntegrationAddyClientsEventsController {
  constructor(
    private readonly addyIntegrationUseCase: B24AddyIntegrationUseCase,
  ) {}

  @ApiOperation({ summary: 'Обработка регистрации клиента в Addy сервисе' })
  @ApiOkResponse({
    type: B24AddyIntegrationRegisterClientResponseDTO,
    description: 'Успешная обработка',
  })
  @HttpCode(HttpStatus.OK)
  @Post('/sign_in')
  public async emitRegisterEvent(
    @Body() body: B24AddyIntegrationRegisterClientRequestDTO,
  ) {
    return this.addyIntegrationUseCase.handleEmitRegisterEvent(body);
  }

  @ApiOperation({ summary: 'Обработка пополнение клиента в Addy сервисе' })
  @HttpCode(HttpStatus.OK)
  @Post('/payments/add')
  public async emitClientPayment(
    @Body() body: B24AddyIntegrationAddClientPaymentRequestDTO,
  ) {
    return this.addyIntegrationUseCase.handleEmitClientAddPayment(body);
  }

  @ApiOperation({ summary: 'Обработка заявок с сайта' })
  @HttpCode(HttpStatus.OK)
  @Post('/form/send')
  public async emitClientSiteRequest(
    @Body() body: B24AddyIntegrationAddClientSiteRequestDTO,
  ) {
    return this.addyIntegrationUseCase.handleEmitClientSiteRequest(body);
  }

  @ApiOperation({
    summary: 'Обработка создания документа клиентом в сервисе Addy',
  })
  @ApiOkResponse({
    description: 'Успешный запрос',
    example: {
      status: true,
    },
  })
  @HttpCode(HttpStatus.OK)
  @Post('/contracts/add')
  async emitClientAddContract(@Body() body: B24AddyClientContractsAddDTO) {
    return this.addyIntegrationUseCase.handleEmitClientAddContract(body);
  }
}
