import {
  Body,
  Controller,
  Delete,
  Get,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { B24ApiTags } from '@/modules/bitrix/interfaces/bitrix-api.interface';
import {
  PlacementBodyRequestDto,
  PlacementQueryRequestDto,
} from '@/modules/bitrix/application/dtos/placements/placement-request.dto';
import type { Response } from 'express';
import { PlacementBindDto } from '@/modules/bitrix/application/dtos/placements/placement-bind.dto';
import { PlacementUnbindDto } from '@/modules/bitrix/application/dtos/placements/placement-unbind.dto';
import { AuthGuard } from '@/common/guards/auth.guard';
import { BitrixPlacementGuard } from '@/modules/bitrix/guards/bitrix-widget.guard';
import { ApiExceptions } from '@/common/decorators/api-exceptions.decorator';
import { ApiAuthHeader } from '@/common/decorators/api-authorization-header.decorator';
import { BitrixPlacementsUseCase } from '@/modules/bitrix/application/use-cases/placements/placements.use-case';

@ApiTags(B24ApiTags.PLACEMENT)
@ApiExceptions()
@Controller('placement')
export class BitrixPlacementController {
  constructor(private readonly bitrixPlacements: BitrixPlacementsUseCase) {}
  @UseGuards(BitrixPlacementGuard)
  @Post('/crm/deal/detail-tab')
  async handleCrmDealDetailTab(
    @Body() body: PlacementBodyRequestDto,
    @Query() query: PlacementQueryRequestDto,
    @Res() res: Response,
  ) {
    return this.bitrixPlacements.receiveOpenWidgetCRMDetailTab(
      res,
      body,
      query,
    );
  }

  @ApiAuthHeader()
  @UseGuards(AuthGuard)
  @Post('/bind')
  async bindWidget(@Body() fields: PlacementBindDto) {
    return false;
    // return this.bitrixPlacements.addPlacement(fields);
  }

  @ApiAuthHeader()
  @UseGuards(AuthGuard)
  @Delete('/unbind')
  async unbindWidget(@Body() fields: PlacementUnbindDto) {
    return this.bitrixPlacements.removePlacement(fields);
  }

  @ApiAuthHeader()
  @ApiOperation({
    summary: 'Получить список зарегистрированных виджетов',
  })
  @UseGuards(AuthGuard)
  @Get('/bind/list')
  async getWidgetList() {
    return this.bitrixPlacements.getBoundPlacementList();
  }
}
