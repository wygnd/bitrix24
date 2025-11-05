import {
  BadRequestException,
  Body,
  Controller,
  InternalServerErrorException,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiHeader, ApiTags } from '@nestjs/swagger';
import { B24ApiTags } from '@/modules/bitirx/interfaces/bitrix-api.interface';
import {
  PlacementBodyRequestDto,
  PlacementQueryRequestDto,
} from '@/modules/bitirx/modules/placement/dtos/placement-request.dto';
import type { Response } from 'express';
import { BitrixPlacementService } from '@/modules/bitirx/modules/placement/placement.service';
import { PlacementBindDto } from '@/modules/bitirx/modules/placement/dtos/placement-bind.dto';
import { PlacementUnbindDto } from '@/modules/bitirx/modules/placement/dtos/placement-unbind.dto';
import { AuthGuard } from '@/common/guards/auth.guard';
import { BitrixService } from '@/modules/bitirx/bitrix.service';
import { BitrixImBotService } from '@/modules/bitirx/modules/imbot/imbot.service';
import { BitrixPlacementGuard } from '@/modules/bitirx/guards/bitrix-widget.guard';
import { ConfigService } from '@nestjs/config';
import { BitrixDealService } from '@/modules/bitirx/modules/deal/deal.service';

@ApiTags(B24ApiTags.PLACEMENT)
@Controller('placement')
export class BitrixPlacementController {
  constructor(
    private readonly bitrixImbotService: BitrixImBotService,
    private readonly bitrixService: BitrixService,
    private readonly configService: ConfigService,
    private readonly bitrixDealService: BitrixDealService,
  ) {}

  @UseGuards(BitrixPlacementGuard)
  @Post('/crm/deal/detail-tab')
  async handleCrmDealDetailTab(
    @Body() body: PlacementBodyRequestDto,
    @Query() query: PlacementQueryRequestDto,
    @Res() res: Response,
  ) {
    const redirectUrl = this.configService.get<string>(
      'bitrixConstants.WIDGET_REDIRECT_HR_RATIO_VACANCIES_URL',
    );

    await this.bitrixImbotService.sendMessage({
      BOT_ID: this.bitrixService.BOT_ID,
      DIALOG_ID: this.bitrixService.TEST_CHAT_ID,
      MESSAGE:
        '[b]HR виджет[/b][br]Новое открытие виджета[br][br]' +
        `Query: ${JSON.stringify(query)}[br]` +
        `Body: ${JSON.stringify(body)}`,
    });

    if (!redirectUrl) throw new InternalServerErrorException();

    try {
      const { ID } = JSON.parse(body.PLACEMENT_OPTIONS) as { ID: string };

      const { STAGE_ID } = await this.bitrixDealService.getDealById(ID);

      switch (STAGE_ID) {
        case '14':
          res.redirect(301, redirectUrl);
          break;
      }
    } catch (err) {
      throw new BadRequestException('Invalid body');
    }
  }

  @ApiHeader({
    name: 'Authorization',
    description: 'Authorization header',
    required: true,
    example: 'bga token',
  })
  @UseGuards(AuthGuard)
  @Post('/bind')
  async bindWidget(@Body() fields: PlacementBindDto) {
    return false;
    // return this.bitrixPlacementService.bind(fields);
  }

  @ApiHeader({
    name: 'Authorization',
    description: 'Authorization header',
    required: true,
    example: 'bga token',
  })
  @UseGuards(AuthGuard)
  @Post('/unbind')
  async unbindWidget(@Body() fields: PlacementUnbindDto) {
    return false;
    // return this.bitrixPlacementService.unbind(fields);
  }
}
