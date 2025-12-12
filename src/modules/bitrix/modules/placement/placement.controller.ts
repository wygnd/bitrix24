import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  Render,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiTags } from '@nestjs/swagger';
import { B24ApiTags } from '@/modules/bitrix/interfaces/bitrix-api.interface';
import {
  PlacementBodyRequestDto,
  PlacementQueryRequestDto,
} from '@/modules/bitrix/modules/placement/dtos/placement-request.dto';
import type { Response } from 'express';
import { BitrixPlacementService } from '@/modules/bitrix/modules/placement/placement.service';
import { PlacementBindDto } from '@/modules/bitrix/modules/placement/dtos/placement-bind.dto';
import { PlacementUnbindDto } from '@/modules/bitrix/modules/placement/dtos/placement-unbind.dto';
import { AuthGuard } from '@/common/guards/auth.guard';
import { BitrixPlacementGuard } from '@/modules/bitrix/guards/bitrix-widget.guard';
import { B24PlacementWidgetCallCardDto } from '@/modules/bitrix/modules/placement/dtos/placement-widget-call-card.dto';

@ApiTags(B24ApiTags.PLACEMENT)
@Controller('placement')
export class BitrixPlacementController {
  constructor(
    private readonly bitrixPlacementService: BitrixPlacementService,
  ) {}

  @UseGuards(BitrixPlacementGuard)
  @Post('/crm/deal/detail-tab')
  async handleCrmDealDetailTab(
    @Body() body: PlacementBodyRequestDto,
    @Query() query: PlacementQueryRequestDto,
    @Res() res: Response,
  ) {
    return this.bitrixPlacementService.receiveOpenWidgetCRMDetailTab(
      res,
      body,
      query,
    );
  }

  @ApiOperation({
    summary: 'Handle call card widget from bitrix24',
  })
  @UseGuards(BitrixPlacementGuard)
  @HttpCode(HttpStatus.OK)
  @Post('/crm/telephony/call-card')
  @Render('bitrix/widgets/call-card')
  async handleCallCardWidget(
    @Body() fields: B24PlacementWidgetCallCardDto,
    @Res() response: Response,
  ) {
    // return {
    //   title: 'Test card',
    //   description: 'this test card',
    //   class: 'alert alert-primary',
    // };
    // return this.bitrixPlacementService.handleOpenWidgetCallCard(fields);
    response.redirect('https://bitrix-grampus.ru/hr-app/');
    return true;
  }

  // todo: temporary remove
  @Post('/crm/telephony/redirect-url')
  async handleRedirectUrlFromTelphin(
    @Query() query: any,
    @Param() params: any,
    @Body() body: any,
  ) {
    return this.bitrixPlacementService.testReceiveRedirectUrl(
      query,
      params,
      body,
    );
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
  @Delete('/unbind')
  async unbindWidget(@Body() fields: PlacementUnbindDto) {
    return this.bitrixPlacementService.unbind(fields);
  }

  @ApiHeader({
    name: 'Authorization',
    description: 'Authorization header',
    required: true,
    example: 'bga token',
  })
  @ApiOperation({
    summary: 'Получить список зарегистрированных виджетов',
  })
  @UseGuards(AuthGuard)
  @Get('/bind/list')
  async getWidgetList() {
    return this.bitrixPlacementService.getBindPlacementList();
  }
}
