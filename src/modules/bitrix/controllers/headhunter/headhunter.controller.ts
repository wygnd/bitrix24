import {
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
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { B24ApiTags } from '@/modules/bitrix/interfaces/bitrix-api.interface';
import { HeadhunterRedirectDto } from '@/modules/bitrix/application/dtos/headhunter/headhunter-redirect.dto';
import { HeadhunterWebhookCallDto } from '@/modules/bitrix/application/dtos/headhunter/headhunter-webhook-call.dto';
import { AuthGuard } from '@/common/guards/auth.guard';
import {
  BitrixHeadhunterVacancyUpdateDTO,
  HHBitrixVacancyDto,
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
    summary: 'Получить список вакансий',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: [HHBitrixVacancyDto],
    description: 'Успешный ответ',
  })
  @ApiAuthHeader()
  @UseGuards(AuthGuard)
  @Get('/vacancies')
  async getVacancies() {
    return this.bitrixHeadhunter.getVacancies();
  }

  // @ApiAuthHeader()
  // @ApiOperation({ summary: 'Добавить новую вакансию' })
  // @ApiResponse({
  //   status: HttpStatus.OK,
  //   type: HHBitrixVacancyDto,
  //   description: 'Успешный ответ',
  // })
  // @UseGuards(AuthGuard)
  // @Post('/vacancies/add')
  // async addVacancy(@Body() dto: BitrixHeadhunterVacancyCreateDTO) {
  //   return this.bitrixHeadhunter.addVacancy(dto);
  // }

  @Patch('/vacancies/:id')
  async updateVacancy(@Body() dto: BitrixHeadhunterVacancyUpdateDTO) {
    return this.bitrixHeadhunter.updateVacancy(dto);
  }

  @ApiOperation({ summary: 'Обновление нескольких записей' })
  @ApiBody({
    type: BitrixHeadhunterVacancyUpdateDTO,
    required: true,
    isArray: true,
  })
  @ApiAuthHeader()
  @UseGuards(AuthGuard)
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
