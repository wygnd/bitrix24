import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { B24AddyIntegrationRegisterClientRequestDTO } from '../../application/dtos/addy/integration/clients/registeration/requests/dto';
import { B24AddyIntegrationUseCase } from '../../application/use-cases/addy/integration/use-case';
import { B24Tags } from '../../../constants/constant';
import { AuthGuard } from '@shared/guards/auth.guard';

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
  @HttpCode(HttpStatus.OK)
  @Post('/clients/sign_in')
  public async emitRegisterEvent(
    @Body() body: B24AddyIntegrationRegisterClientRequestDTO,
  ) {
    return this.addyIntegrationUseCase.handleEmitRegisterEvent(body);
  }
}
