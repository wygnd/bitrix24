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
import { ApiHeader, ApiOperation, ApiTags } from '@nestjs/swagger';
import { B24ApiTags } from '@/modules/bitirx/interfaces/bitrix-api.interface';
import { HeadhunterRedirectDto } from '@/modules/bitirx/modules/integration/headhunter/dto/headhunter-redirect.dto';
import { HeadhunterWebhookCallDto } from '@/modules/bitirx/modules/integration/headhunter/dto/headhunter-webhook-call.dto';
import { AuthGuard } from '@/common/guards/auth.guard';
import { BitrixHeadHunterService } from '@/modules/bitirx/modules/integration/headhunter/headhunter.service';

@ApiTags(B24ApiTags.HEAD_HUNTER)
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
    return this.bitrixHeadHunterService.getVacancies();
  }
}
