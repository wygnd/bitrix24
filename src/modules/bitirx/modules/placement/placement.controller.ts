import { Body, Controller, Post, Res } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { B24ApiTags } from '@/modules/bitirx/interfaces/bitrix-api.interface';
import { PlacementRequestDto } from '@/modules/bitirx/modules/placement/dtos/placement-request.dto';
import type { Response } from 'express';

@ApiTags(B24ApiTags.PLACEMENT)
@Controller('placement')
export class BitrixPlacementController {
  constructor() {}

  @Post('/crm/deal/detail-tab')
  async handleCrmDealDetailTab(
    // @Body() fields: PlacementRequestDto,
    @Res() res: Response,
  ) {
    res.redirect('https://bitrix-hr-app-production.up.railway.app');
  }
}
