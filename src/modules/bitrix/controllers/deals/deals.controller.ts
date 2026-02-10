import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@/common/guards/auth.guard';
import { ApiExceptions } from '@/common/decorators/api-exceptions.decorator';
import { ApiAuthHeader } from '@/common/decorators/api-authorization-header.decorator';
import { BitrixDealsUseCase } from '@/modules/bitrix/application/use-cases/deals/deals.use-case';
import { BitrixDealsFieldOptionsDTO } from '@/modules/bitrix/application/dtos/deals/fields/deals-field.dto';

@ApiTags('Deals')
@ApiExceptions()
@ApiAuthHeader()
@UseGuards(AuthGuard)
@Controller('deals')
export class BitrixDealsController {
  constructor(private readonly bitrixDeals: BitrixDealsUseCase) {}

  @ApiOperation({ summary: 'Получить сделку по ID' })
  @ApiQuery({
    type: Number,
    name: 'deal_id',
    description: 'deals id',
    example: 49146,
    required: true,
  })
  @Get('/deal/:deal_id')
  async getDealById(@Param('deal_id') dealId: string) {
    return this.bitrixDeals.getDealById(dealId);
  }

  @ApiOperation({
    summary: 'Получить поля сделки',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'success get deals fields',
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
  @Get('/fields')
  async getDealFields() {
    return this.bitrixDeals.getDealFields();
  }

  @ApiOperation({
    summary: 'Получить конкретное поле сделки',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'success get deals field',
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
  @Get('/fields/field/:field_id')
  async getDealField(@Param('field_id') fieldId: string) {
    return this.bitrixDeals.getDealField(fieldId);
  }

  @ApiOperation({
    summary: 'Проверяет сделки на наличие заполненного договора',
    description:
      'Выполняет поиск по сделкам в стадии <b>2. Ожидаем бриф</b> и отправляет сообщение в чат, который был указан при запросе',
  })
  @HttpCode(HttpStatus.OK)
  @Post('/sites/check/contract')
  async checkDealsContract(@Body() body: BitrixDealsFieldOptionsDTO) {
    return this.bitrixDeals.handleCheckSiteDealsField(body);
  }
}
