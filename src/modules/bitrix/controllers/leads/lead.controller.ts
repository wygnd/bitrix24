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
import { AuthGuard } from '@/common/guards/auth.guard';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { B24ApiTags } from '@/modules/bitrix/interfaces/bitrix-api.interface';
import { LeadAvitoStatusResponseDto } from '@/modules/bitrix/application/dtos/leads/lead-avito-status-response.dto';
import {
  LeadManagerCallingDto,
  LeadObserveManagerCallingResponseDto,
} from '@/modules/bitrix/application/dtos/leads/lead-manager-calling.dto';
import { ApiExceptions } from '@/common/decorators/api-exceptions.decorator';
import { ApiAuthHeader } from '@/common/decorators/api-authorization-header.decorator';
import { BitrixLeadsUseCase } from '@/modules/bitrix/application/use-cases/leads/leads.use-case';

@ApiTags(B24ApiTags.LEADS)
@ApiAuthHeader()
@UseGuards(AuthGuard)
@ApiExceptions()
@Controller('leads')
export class BitrixLeadController {
  constructor(private readonly bitrixLeadService: BitrixLeadsUseCase) {}

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
  @Post('/observe_manager_calling')
  async observeManagerCalling(@Body() fields: LeadManagerCallingDto) {
    throw new NotAcceptableException();
    // const result =
    //   await this.bitrixLeadService.handleObserveManagerCalling(fields);
    // this.logger.info({ message: 'Observe manager calling', data: result });
    // return result;
  }

  @ApiOperation({
    summary:
      'Остлеживание лидов, которые находятся в статусе Новый в работе и их звонков',
  })
  @HttpCode(HttpStatus.OK)
  @Post('/observe_active_lead_calls')
  async observeActiveLeadsCalls() {
    return this.bitrixLeadService.handleObserveActiveLeadsCalls();
  }
}
