import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  NotAcceptableException,
  ParseDatePipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { BitrixLeadService } from '@/modules/bitrix/modules/lead/services/lead.service';
import { AuthGuard } from '@/common/guards/auth.guard';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { B24ApiTags } from '@/modules/bitrix/interfaces/bitrix-api.interface';
import { LeadAvitoStatusResponseDto } from '@/modules/bitrix/modules/lead/dtos/lead-avito-status-response.dto';
import {
  LeadObserveManagerCallingDto,
  LeadObserveManagerCallingResponseDto,
} from '@/modules/bitrix/modules/lead/dtos/lead-observe-manager-calling.dto';
import { ApiExceptions } from '@/common/decorators/api-exceptions.decorator';
import { ApiAuthHeader } from '@/common/decorators/api-authorization-header.decorator';

@ApiTags(B24ApiTags.LEADS)
@ApiAuthHeader()
@UseGuards(AuthGuard)
@ApiExceptions()
@Controller('leads')
export class BitrixLeadController {
  constructor(private readonly bitrixLeadService: BitrixLeadService) {}

  @ApiOperation({
    summary: 'Получить статусы лидов по дате',
    description:
      'Получает лидов у которых дата создания или дата обращения равна указанной дате. Формирует статусы лидов',
  })
  @ApiQuery({
    name: 'date',
    example: new Date().toLocaleDateString().replaceAll('.', '-'),
    description: 'Дата',
    required: false,
    default: 'текущая дата во время запроса',
  })
  @ApiResponse({
    type: LeadAvitoStatusResponseDto,
    status: HttpStatus.OK,
    description: 'Success',
  })
  @Get('/avito/statuses')
  async getLeadsStatusesByDate(
    @Query(
      'date',
      new ParseDatePipe({
        default: () => new Date(),
        optional: true,
      }),
    )
    date: Date,
  ) {
    return this.bitrixLeadService.getLeadsStatusesByDate(date);
  }

  @ApiOperation({
    summary: 'Отслеживание звонов по лидам',
    description:
      'Поиск лидов в активной стадии и проверка их в базе.<br/>' +
      'Если лид есть в базе и прошло более 5 дней с момента звонка, посылаем уведомление в чат',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Успешный ответ',
    type: LeadObserveManagerCallingResponseDto,
  })
  @HttpCode(HttpStatus.OK)
  @Post('/observe-manager-calling')
  async observeManagerCalling(@Body() fields: LeadObserveManagerCallingDto) {
    throw new NotAcceptableException();
    // const result =
    //   await this.bitrixLeadService.handleObserveManagerCalling(fields);
    // this.logger.info({ message: 'Observe manager calling', data: result });
    // return result;
  }
}
