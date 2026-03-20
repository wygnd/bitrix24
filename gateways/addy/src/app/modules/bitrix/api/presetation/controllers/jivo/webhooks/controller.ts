import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { B24JivoApiTag } from '../../../../application/constants/jivo/integration/constant';
import { B24JivoIntegrationWebhooksUseCase } from '../../../../application/use-cases/jivo/integration/webhooks/use-case';
import { B24JivoIntegrationWebhooksRequestDTO } from '../../../dtos/jivo/integration/webhooks/requests/dto';

@ApiTags(B24JivoApiTag)
@Controller({
  version: '1',
  path: 'integration/jivo/webhooks',
})
export class B24JivoWebhooksController {
  constructor(
    private readonly jivoUseCase: B24JivoIntegrationWebhooksUseCase,
  ) {}

  @ApiOperation({summary: 'Обработка Jivo Webhook API'})
  @HttpCode(HttpStatus.OK)
  @Post('/handle')
  async handleWebhookCallEvent(
    @Body() body: B24JivoIntegrationWebhooksRequestDTO,
  ) {
    console.log(body);
    return this.jivoUseCase.handleWebhookCallEvent(body);
  }
}
