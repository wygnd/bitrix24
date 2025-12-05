import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpException,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiHeader,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { BitrixService } from '../../bitrix.service';
import { BitrixDealService } from './deal.service';
import { AuthGuard } from '@/common/guards/auth.guard';
import type { B24ListParams } from '@/modules/bitirx/interfaces/bitrix.interface';
import { B24Deal } from '@/modules/bitirx/modules/deal/interfaces/deal.interface';
import { OnCRMDealUpdateEventBodyDto } from '@/modules/bitirx/modules/deal/dtos/deal-event.dto';
import { BitrixEventGuard } from '@/modules/bitirx/guards/bitrix-event.guard';
import { WinstonLogger } from '@/config/winston.logger';

@ApiTags('Deals')
@Controller('deals')
export class BitrixDealController {
  private readonly logger = new WinstonLogger(BitrixDealController.name);

  constructor(
    private readonly bitrixService: BitrixService,
    private readonly bitrixDealService: BitrixDealService,
  ) {}

  @ApiQuery({
    type: Number,
    name: 'deal_id',
    description: 'deal id',
    example: 49146,
    required: true,
  })
  @ApiHeader({
    name: 'authorization',
    description: 'api key',
    example: 'bga token',
    required: true,
  })
  @UseGuards(AuthGuard)
  @Get('/deal/:deal_id')
  async getDealById(@Param('deal_id', ParseIntPipe) dealId: number) {
    try {
      const deal = await this.bitrixDealService.getDealById(dealId);
      this.logger.info(`Check deal: ${JSON.stringify(deal)}`);
      return deal;
    } catch (error) {
      console.log(error);
      throw new HttpException(error, HttpStatus.BAD_REQUEST);
    }
  }

  @ApiOperation({
    summary: 'get deal with filter, select and order',
  })
  @HttpCode(200)
  @Post('deal')
  async getDeal(@Body('phone') phone: string) {
    try {
      return this.bitrixService.callMethod<
        B24ListParams<Partial<B24Deal>>,
        B24Deal
      >('crm.deal.list', {
        filter: {
          '@UF_CRM_1638524259': [
            phone,
            phone.replace(/[()]/gim, ''),
            phone.replace(/-/gim, ' '),
            phone.replace(/[ \-()]/gim, ''),
            phone.replace('8 ', '+7 '),
            phone.replace('8 ', '+7 ').replace(/[()]/gim, ''),
            phone.replace('8 ', '+7 ').replace(/-/gim, ' '),
            phone.replace('8 ', '+7 ').replace(/[ \-()]/gim, ''),
          ],
        },
      });
      // return this.bitrixDealService.getDeal(fields);
    } catch (error) {
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
  @ApiHeader({
    name: 'Authorization',
    description: 'api key',
    example: 'bga token',
    required: true,
  })
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
  @ApiHeader({
    name: 'Authorization',
    description: 'api key',
    example: 'bga token',
    required: true,
  })
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
