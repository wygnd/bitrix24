import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  InternalServerErrorException,
  UseGuards,
} from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { HeadhunterRestService } from '@/modules/headhunter/headhunter-rest.service';
import { B24ApiTags } from '@/modules/bitirx/interfaces/bitrix-api.interface';
import { AuthGuard } from '@/common/guards/auth.guard';
import { HHVacancyDto } from '@/modules/headhunter/dtos/headhunter-vacancy.dto';

@UseGuards(AuthGuard)
@ApiHeader({
  name: 'Authorization',
  description: 'auth token',
  required: true,
  example: 'bga authorizationtoken',
})
@ApiTags(B24ApiTags.HEAD_HUNTER)
@Controller('headhunter')
export class HeadHunterController {
  constructor(private readonly headHunterRestService: HeadhunterRestService) {}

  @ApiOperation({
    summary: 'Get active vacancies from hh.ru',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Success get vacancies from',
    type: [HHVacancyDto],
  })
  @Get('vacancies/active')
  async getActiveVacancies() {
    return this.headHunterRestService.getActiveVacancies();
  }
}
