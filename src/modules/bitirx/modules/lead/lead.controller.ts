import {
  Controller,
  Get,
  ParseDatePipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import { BitrixLeadService } from '@/modules/bitirx/modules/lead/lead.service';
import { AuthGuard } from '@/common/guards/auth.guard';
import { ApiTags } from '@nestjs/swagger';
import { B24ApiTags } from '@/modules/bitirx/interfaces/bitrix-api.interface';

@ApiTags(B24ApiTags.LEADS)
@UseGuards(AuthGuard)
@Controller('leads')
export class BitrixLeadController {
  constructor(private readonly bitrixLeadService: BitrixLeadService) {}

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
