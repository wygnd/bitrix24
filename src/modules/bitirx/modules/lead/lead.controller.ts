import {
  Controller,
  Get,
  HttpStatus,
  ParseDatePipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import { BitrixLeadService } from '@/modules/bitirx/modules/lead/lead.service';
import { AuthGuard } from '@/common/guards/auth.guard';
import {
  ApiHeader,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { B24ApiTags } from '@/modules/bitirx/interfaces/bitrix-api.interface';
import { LeadAvitoStatusResponseDto } from '@/modules/bitirx/modules/lead/dtos/lead-avito-status-response.dto';

@ApiTags(B24ApiTags.LEADS)
@UseGuards(AuthGuard)
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
  @ApiHeader({
    name: 'Authorization',
    description: 'authorization token',
    example: 'bga token',
    required: true,
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
}
