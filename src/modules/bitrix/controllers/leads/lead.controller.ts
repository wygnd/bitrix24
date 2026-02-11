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
import {
  ApiExcludeEndpoint,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { B24ApiTags } from '@/modules/bitrix/interfaces/bitrix-api.interface';
import { LeadAvitoStatusResponseDto } from '@/modules/bitrix/application/dtos/leads/lead-avito-status-response.dto';
import { LeadObserveManagerCallingResponseDto } from '@/modules/bitrix/application/dtos/leads/lead-manager-calling.dto';
import { ApiExceptions } from '@/common/decorators/api-exceptions.decorator';
import { ApiAuthHeader } from '@/common/decorators/api-authorization-header.decorator';
import { BitrixLeadsUseCase } from '@/modules/bitrix/application/use-cases/leads/leads.use-case';
import { AuthHelpersGuard } from '@/common/guards/auth-helpers.guard';
import { BitrixLeadsSyncCallsDTO } from '@/modules/bitrix/application/dtos/leads/lead-sync-calls.dto';

@ApiTags(B24ApiTags.LEADS)
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
  @ApiAuthHeader()
  @UseGuards(AuthGuard)
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
  @ApiAuthHeader()
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  @Post('/calls/observe_five_days')
  async observeManagerCalling() {
    return this.bitrixLeadService.handleObserveManagerCallingAtLastFiveDays();
  }

  @ApiOperation({
    summary:
      'Остлеживание лидов, которые находятся в статусе Новый в работе и их звонков',
  })
  @ApiAuthHeader()
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  @Post('/calls/observe_active')
  async observeActiveLeadsCalls() {
    return this.bitrixLeadService.handleObserveActiveLeadsCalls();
  }

  @ApiExcludeEndpoint()
  @UseGuards(AuthHelpersGuard)
  @Get('/calls/helpers/get_telphin_calls_at_last_two_week')
  async handleHelperGetCallsAtLastTwoWeekFromTwoWeek() {
    return this.bitrixLeadService.handleObserveManagerCallingGetCallsAtLast2WeeksHelper();
  }

  @ApiExcludeEndpoint()
  @ApiOperation({ summary: 'Выгрузка звонков из телфина' })
  @ApiAuthHeader()
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  @Post('/calls/sync')
  async handleSyncCallsLeads(@Body() fields: BitrixLeadsSyncCallsDTO) {
    throw new NotAcceptableException();
  }

  @ApiOperation({
    summary: 'Распределение активных лидов с указанного user_id',
  })
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  @Post('/distribute/active')
  async distributeLeadsFromUser(@Query('user_id') user_id: string) {
    return this.bitrixLeadService.handleDistributeNewLeads(user_id);
  }
}
