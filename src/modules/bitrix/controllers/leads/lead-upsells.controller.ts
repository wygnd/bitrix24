import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  ParseDatePipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { IncomingWebhookDto } from '@/modules/bitrix/application/dtos/webhooks/incoming-webhook.dto';
import { B24LeadUpsellRequestQueryDto } from '@/modules/bitrix/application/dtos/leads/lead-upsell.dto';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { B24ApiTags } from '@/modules/bitrix/interfaces/bitrix-api.interface';
import { BitrixWebhookGuard } from '@/modules/bitrix/guards/bitrix-webhook.guard';
import { AuthGuard } from '@/common/guards/auth.guard';
import { B24LeadUpsellStatuses } from '@/modules/bitrix/application/interfaces/leads/lead-upsell.interface';
import { WinstonLogger } from '@/config/winston.logger';
import { ApiExceptions } from '@/common/decorators/api-exceptions.decorator';
import { BitrixLeadsUpsellUseCase } from '@/modules/bitrix/application/use-cases/leads/leads-upsell.use-case';

@ApiTags(B24ApiTags.LEADS)
@ApiExceptions()
@Controller('leads/upsells')
export class BitrixLeadUpsellController {
  private readonly logger = new WinstonLogger(
    BitrixLeadUpsellController.name,
    'bitrix:services:upsell'.split(':'),
  );

  constructor(private readonly bitrixUpsellService: BitrixLeadsUpsellUseCase) {}

  @ApiOperation({
    summary: 'Добавление допродажи',
  })
  @UseGuards(BitrixWebhookGuard)
  @Post('add')
  @HttpCode(HttpStatus.OK)
  async addLeadInUpsellQueue(
    @Body() body: IncomingWebhookDto,
    @Query() query: B24LeadUpsellRequestQueryDto,
  ) {
    try {
      const response = await this.bitrixUpsellService.addDealInUpsellQueue({
        dealId: body.document_id[2],
        ...query,
      });
      this.logger.debug(
        {
          message: 'Add upsell in queue',
          response,
        },
        true,
      );
      return response;
    } catch (error) {
      this.logger.error({ message: 'Invalid add upsell in queue', error });
      throw error;
    }
  }

  @ApiOperation({
    summary: 'Обработка допродаж',
    description: `Получает допродажи со статусом <strong>${B24LeadUpsellStatuses.PENDING}</strong> и обрабатывает их`,
  })
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  @Post('handle')
  async handleUpsells(
    @Query(
      'date',
      new ParseDatePipe({ default: () => new Date(), optional: true }),
    )
    date: Date,
  ) {
    try {
      const response = await this.bitrixUpsellService.handleUpsellDeals(date);
      this.logger.debug(
        {
          message: 'Check handle upsells response',
          response,
        },
        true,
      );
      return response;
    } catch (error) {
      this.logger.error({ message: 'Invalid handle upsells', error });
      throw error;
    }
  }
}
