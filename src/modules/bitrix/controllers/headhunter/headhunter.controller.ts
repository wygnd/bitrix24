import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  ParseArrayPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { B24ApiTags } from '@/modules/bitrix/interfaces/bitrix-api.interface';
import { HeadhunterRedirectDto } from '@/modules/bitrix/application/dtos/headhunter/headhunter-redirect.dto';
import { HeadhunterWebhookCallDto } from '@/modules/bitrix/application/dtos/headhunter/headhunter-webhook-call.dto';
import { AuthGuard } from '@/common/guards/auth.guard';
import {
  BitrixHeadhunterVacancyCreateDTO,
  BitrixHeadhunterVacancyUpdateDTO,
} from '@/modules/bitrix/application/dtos/headhunter/headhunter-bitrix-vacancy.dto';
import { ApiExceptions } from '@/common/decorators/api-exceptions.decorator';
import { ApiAuthHeader } from '@/common/decorators/api-authorization-header.decorator';
import { BitrixHeadhunterUseCase } from '@/modules/bitrix/application/use-cases/headhunter/headhunter.use-case';

@ApiTags(B24ApiTags.HEAD_HUNTER)
@ApiExceptions()
@Controller('integration/headhunter')
export class BitrixHeadHunterController {
  constructor(private readonly bitrixHeadhunter: BitrixHeadhunterUseCase) {}

  @ApiOperation({ summary: 'Handle hh.ru application' })
  @Get('/redirect_uri')
  @HttpCode(HttpStatus.OK)
  async handleApp(@Body() fields: any, @Query() query: HeadhunterRedirectDto) {
    return this.bitrixHeadhunter.handleApp(fields, query);
  }

  @HttpCode(HttpStatus.ACCEPTED)
  @Post('/webhook')
  async receiveWebhook(@Body() body: HeadhunterWebhookCallDto) {
    return this.bitrixHeadhunter.receiveWebhook(body);
  }

  @ApiOperation({
    summary: 'get vacancies',
  })
  @ApiAuthHeader()
  @UseGuards(AuthGuard)
  @Get('/vacancies')
  async getVacancies() {
    return this.bitrixHeadhunter.getVacancies();
  }

  @Post('/vacancies/add')
  async addVacancy(@Body() dto: BitrixHeadhunterVacancyCreateDTO) {
    const vacancy = await this.bitrixHeadhunter.addVacancy(dto);

    if (!vacancy) throw new BadRequestException('Invalid add vacancy');

    return vacancy;
  }

  @Patch('/vacancies/:id')
  async updateVacancy(@Body() dto: BitrixHeadhunterVacancyUpdateDTO) {
    return this.bitrixHeadhunter.updateVacancy(dto);
  }

  @Patch('/vacancies/bulk/update')
  async updateVacancies(
    @Body(
      'fields',
      new ParseArrayPipe({ items: BitrixHeadhunterVacancyUpdateDTO }),
    )
    records: BitrixHeadhunterVacancyUpdateDTO[],
  ) {
    return this.bitrixHeadhunter.updateVacancies(records);
  }
}
