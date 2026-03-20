import { ApiTags } from '@nestjs/swagger';
import { B24AddyApiTag } from '../../../../../application/constants/addy/constant';
import {
  BadRequestException,
  Controller,
  Get,
  ParseIntPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@shared/guards/auth.guard';
import { B24AddyIntegrationUseCase } from '../../../../../application/use-cases/addy/integration/clients/use-case';

@ApiTags(B24AddyApiTag)
@UseGuards(AuthGuard)
@Controller({
  version: '1',
  path: 'integration/addy/clients/contracts',
})
export class B24IntegrationAddyClientsContractsController {
  constructor(
    private readonly addyIntegrationUseCase: B24AddyIntegrationUseCase,
  ) {}

  @Get('/check')
  async checkExistsContracts(
    @Query(
      'stage',
      new ParseIntPipe({
        exceptionFactory: () => {
          return new BadRequestException('Стадия обязательна');
        },
      }),
    )
    stage: number,
  ) {
    return this.addyIntegrationUseCase.handleFindClientsWithoutContracts(stage);
  }
}
