import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { B24ApiTags } from '@/modules/bitrix/interfaces/bitrix-api.interface';
import { HeadhunterRedirectDto } from '@/modules/bitrix/modules/integration/headhunter/dto/headhunter-redirect.dto';
import { HeadhunterWebhookCallDto } from '@/modules/bitrix/modules/integration/headhunter/dto/headhunter-webhook-call.dto';
import { AuthGuard } from '@/common/guards/auth.guard';
import { BitrixHeadHunterService } from '@/modules/bitrix/modules/integration/headhunter/headhunter.service';
import { HHBitrixVacancyDto } from '@/modules/bitrix/modules/integration/headhunter/dto/headhunter-bitrix-vacancy.dto';
import { ApiExceptions } from '@/common/decorators/api-exceptions.decorator';
import { ApiAuthHeader } from '@/common/decorators/api-authorization-header.decorator';

@ApiTags(B24ApiTags.HEAD_HUNTER)
@ApiExceptions()
@Controller('integration/headhunter')
export class BitrixHeadHunterController {
  constructor(
    private readonly bitrixHeadHunterService: BitrixHeadHunterService,
  ) {}

  @ApiOperation({ summary: 'Handle hh.ru application' })
  @Get('/redirect_uri')
  @HttpCode(HttpStatus.OK)
  async handleApp(@Body() fields: any, @Query() query: HeadhunterRedirectDto) {
    return this.bitrixHeadHunterService.handleApp(fields, query);
  }

  @HttpCode(HttpStatus.ACCEPTED)
  @Post('/webhook')
  async receiveWebhook(@Body() body: HeadhunterWebhookCallDto) {
    return this.bitrixHeadHunterService.receiveWebhook(body);
  }

  @ApiOperation({
    summary: 'get vacancies',
  })
  @ApiAuthHeader()
  @UseGuards(AuthGuard)
  @Get('/vacancies')
  async getVacancies() {
    return this.bitrixHeadHunterService.getRatioVacancies();
  }

  @ApiOperation({
    summary: 'save vacancies',
  })
  @ApiAuthHeader()
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
