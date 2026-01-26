import { Controller, Get, HttpStatus, Param, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { HeadhunterRestService } from '@/modules/headhunter/headhunter-rest.service';
import { B24ApiTags } from '@/modules/bitrix/interfaces/bitrix-api.interface';
import { AuthGuard } from '@/common/guards/auth.guard';
import { HHVacancyDto } from '@/modules/headhunter/dtos/headhunter-vacancy.dto';
import { ApiAuthHeader } from '@/common/decorators/api-authorization-header.decorator';

@UseGuards(AuthGuard)
@ApiAuthHeader()
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

  @Get('/resumes/:resume_id')
  async getResumeById(@Param('resume_id') resume_id: string) {
    return this.headHunterRestService.getResumeById(resume_id);
  }
}
