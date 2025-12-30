import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { BitrixDealService } from './deal.service';
import { AuthGuard } from '@/common/guards/auth.guard';
import { OnCRMDealUpdateEventBodyDto } from '@/modules/bitrix/modules/deal/dtos/deal-event.dto';
import { BitrixEventGuard } from '@/modules/bitrix/guards/bitrix-event.guard';
import { ApiExceptions } from '@/common/decorators/api-exceptions.decorator';
import { ApiAuthHeader } from '@/common/decorators/api-authorization-header.decorator';
import { WinstonLogger } from '@/config/winston.logger';

@ApiTags('Deals')
@ApiExceptions()
@Controller('deals')
export class BitrixDealController {
  private readonly logger = new WinstonLogger(
    BitrixDealController.name,
    'bitrix:services:deal'.split(':'),
  );

  constructor(private readonly bitrixDealService: BitrixDealService) {}

  @ApiQuery({
    type: Number,
    name: 'deal_id',
    description: 'deal id',
    example: 49146,
    required: true,
  })
  @ApiAuthHeader()
  @UseGuards(AuthGuard)
  @Get('/deal/:deal_id')
  async getDealById(@Param('deal_id', ParseIntPipe) dealId: number) {
    try {
      return this.bitrixDealService.getDealById(dealId);
    } catch (error) {
      this.logger.error(error, true);
      throw new HttpException(error, HttpStatus.BAD_REQUEST);
    }
  }

  @ApiOperation({
    summary: 'get deal fields',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'success get deal fields',
    example: {
      result: {
        ID: {
          type: 'integer',
          isRequired: false,
          isReadOnly: true,
          isImmutable: false,
          isMultiple: false,
          isDynamic: false,
          title: 'ID',
        },
        TITLE: {
          type: 'string',
          isRequired: false,
          isReadOnly: false,
          isImmutable: false,
          isMultiple: false,
          isDynamic: false,
          title: 'Название',
        },
        TYPE_ID: {
          type: 'crm_status',
          isRequired: false,
          isReadOnly: false,
          isImmutable: false,
          isMultiple: false,
          isDynamic: false,
          statusType: 'DEAL_TYPE',
          title: 'Тип',
        },
      },
    },
  })
  @ApiAuthHeader()
  @UseGuards(AuthGuard)
  @Get('/fields')
  async getDealFields() {
    return this.bitrixDealService.getDealFields();
  }

  @ApiOperation({
    summary: 'get deal field',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'success get deal field',
    example: {
      type: 'employee',
      isRequired: false,
      isReadOnly: false,
      isImmutable: false,
      isMultiple: false,
      isDynamic: true,
      title: 'UF_CRM_1638351463',
      listLabel: 'Кто ведет',
      formLabel: 'Кто ведет',
      filterLabel: 'Кто ведет',
      settings: [],
    },
  })
  @ApiAuthHeader()
  @UseGuards(AuthGuard)
  @Get('/fields/field/:field_id')
  async getDealField(@Param('field_id') fieldId: string) {
    return this.bitrixDealService.getDealField(fieldId);
  }

  @UseGuards(BitrixEventGuard)
  @Post('/events/ONCRMDEALUPDATE')
  async handleChangeDeal(@Body() body: OnCRMDealUpdateEventBodyDto) {
    throw new BadRequestException('Execute error or deal was not handling');
  }
}
