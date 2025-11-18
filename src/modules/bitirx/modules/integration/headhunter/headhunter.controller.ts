import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBody,
  ApiHeader,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import {
  B24ApiTags,
  B24BatchResponseMap,
} from '@/modules/bitirx/interfaces/bitrix-api.interface';
import { HeadhunterRedirectDto } from '@/modules/bitirx/modules/integration/headhunter/dto/headhunter-redirect.dto';
import { HeadhunterWebhookCallDto } from '@/modules/bitirx/modules/integration/headhunter/dto/headhunter-webhook-call.dto';
import { AuthGuard } from '@/common/guards/auth.guard';
import { BitrixHeadHunterService } from '@/modules/bitirx/modules/integration/headhunter/headhunter.service';
import { HHVacancyDto } from '@/modules/headhunter/dtos/headhunter-vacancy.dto';
import { HHBitrixVacancyDto } from '@/modules/bitirx/modules/integration/headhunter/dto/headhunter-bitrix-vacancy.dto';
import { BitrixService } from '@/modules/bitirx/bitrix.service';
import { HeadhunterRestService } from '@/modules/headhunter/headhunter-rest.service';

@ApiTags(B24ApiTags.HEAD_HUNTER)
@Controller('integration/headhunter')
export class BitrixHeadHunterController {
  constructor(
    private readonly bitrixHeadHunterService: BitrixHeadHunterService,
    private readonly bitrixService: BitrixService,
    private readonly headHunterRestService: HeadhunterRestService,
  ) {}

  @ApiOperation({ summary: 'Handle hh.ru application' })
  @Get('/redirect_uri')
  @HttpCode(HttpStatus.OK)
  async handleApp(@Body() fields: any, @Query() query: HeadhunterRedirectDto) {
    return this.bitrixHeadHunterService.handleApp(fields, query);
  }

  @HttpCode(HttpStatus.OK)
  @Post('/webhook')
  async receiveWebhook(@Body() body: HeadhunterWebhookCallDto) {
    return this.bitrixHeadHunterService.receiveWebhook(body);
  }

  @ApiOperation({
    summary: 'get vacancies',
  })
  @ApiHeader({
    name: 'Authorization',
    description: 'auth token',
    required: true,
    example: 'bga authtoken',
  })
  @UseGuards(AuthGuard)
  @Get('/vacancies')
  async getVacancies() {
    return this.bitrixHeadHunterService.getRatioVacancies();
  }

  @ApiOperation({
    summary: 'save vacancies',
  })
  @ApiHeader({
    name: 'Authorization',
    description: 'auth token',
    required: true,
    example: 'bga authtoken',
  })
  @ApiBody({
    type: [HHBitrixVacancyDto],
    description: 'request',
    required: true,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'success save vacancies',
    type: Boolean,
    example: true,
  })
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard)
  @Post('/vacancies')
  async saveVacancies(@Body() fields: HHBitrixVacancyDto[]) {
    return this.bitrixHeadHunterService.setRatioVacancies(fields);
  }
}
