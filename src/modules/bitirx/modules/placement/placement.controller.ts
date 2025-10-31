import { Body, Controller, Post, Res, UseGuards } from '@nestjs/common';
import { ApiHeader, ApiTags } from '@nestjs/swagger';
import { B24ApiTags } from '@/modules/bitirx/interfaces/bitrix-api.interface';
import { PlacementRequestDto } from '@/modules/bitirx/modules/placement/dtos/placement-request.dto';
import type { Response } from 'express';
import { BitrixPlacementService } from '@/modules/bitirx/modules/placement/bitrix-placement.service';
import { PlacementBindDto } from '@/modules/bitirx/modules/placement/dtos/placement-bind.dto';
import { PlacementUnbindDto } from '@/modules/bitirx/modules/placement/dtos/placement-unbind.dto';
import { AuthGuard } from '@/common/guards/auth.guard';
import { BitrixMessageService } from '@/modules/bitirx/modules/im/im.service';
import { BitrixService } from '@/modules/bitirx/bitrix.service';
import { BitrixImBotService } from '@/modules/bitirx/modules/imbot/imbot.service';

@ApiTags(B24ApiTags.PLACEMENT)
@Controller('placement')
export class BitrixPlacementController {
  constructor(
    private readonly bitrixPlacementService: BitrixPlacementService,
    private readonly bitrixImbotService: BitrixImBotService,
    private readonly bitrixService: BitrixService,
  ) {}

  @Post('/crm/deal/detail-tab')
  async handleCrmDealDetailTab(@Body() fields: any, @Res() res: Response) {
    await this.bitrixImbotService.sendMessage({
      BOT_ID: this.bitrixService.BOT_ID,
      DIALOG_ID: this.bitrixService.TEST_CHAT_ID,
      MESSAGE:
        '[b]HR виджет[/b][br]Новое открытие виджета[br][br]' +
        JSON.stringify(fields),
    });

    res.redirect('https://bitrix-hr-app-production.up.railway.app');
  }

  @ApiHeader({
    name: 'Authorization',
    description: 'Authorization header',
    required: true,
    example: 'bga token',
  })
  @UseGuards(AuthGuard)
  @Post('/placement/bind')
  async bindWidget(@Body() fields: PlacementBindDto) {
    return this.bitrixPlacementService.bind(fields);
  }

  @ApiHeader({
    name: 'Authorization',
    description: 'Authorization header',
    required: true,
    example: 'bga token',
  })
  @UseGuards(AuthGuard)
  @Post('/placement/unbind')
  async unbindWidget(@Body() fields: PlacementUnbindDto) {
    return this.bitrixPlacementService.unbind(fields);
  }
}
