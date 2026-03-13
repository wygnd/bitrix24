import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';
import { B24AddyIntegrationRegisterClientRequestDTO } from '../../application/dtos/addy/integration/clients/registeration/requests/dto';
import { B24AddyIntegrationUseCase } from '../../application/use-cases/addy/integration/use-case';

@Controller({
  version: '1',
  path: 'integration/addy',
})
export class B24IntegrationAddyController {
  constructor(
    private readonly addyIntegrationUseCase: B24AddyIntegrationUseCase,
  ) {}

  @ApiOperation({ summary: 'Обработка регистрации клиента в Addy сервисе' })
  @HttpCode(HttpStatus.OK)
  @Post('/clients/register')
  public async emitRegisterEvent(
    @Body() body: B24AddyIntegrationRegisterClientRequestDTO,
  ) {
    return this.addyIntegrationUseCase.handleEmitRegisterEvent(body);
  }
}
