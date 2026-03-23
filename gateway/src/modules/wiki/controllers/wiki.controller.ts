import { WikiService } from '@/modules/wiki/services/wiki.service';
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  ParseBoolPipe,
  Post,
  Query,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@/common/guards/auth.guard';
import { WikiAnalyzeManagerCallsDTO } from '@/modules/wiki/dtos/wiki-analyze-manager-calls.dto';

@ApiTags('Wiki')
@Controller('wiki')
export class WikiController {
  constructor(private readonly wikiService: WikiService) {}

  @Get('/get-working-sales')
  async getWorkingSales(
    @Query('force', new ParseBoolPipe({ optional: true }))
    force: boolean = false,
  ) {
    return this.wikiService.getWorkingSales(force);
  }

  @ApiOperation({ summary: 'Отправка запроса на анализ звонка' })
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.ACCEPTED)
  @Post('/managers/calls/neuro/analytics')
  async analyzeManagerCalling(
    @Body(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        stopAtFirstError: true,
      }),
    )
    body: WikiAnalyzeManagerCallsDTO,
  ) {
    return this.wikiService.analyzeManagerCalling(body);
  }
}
