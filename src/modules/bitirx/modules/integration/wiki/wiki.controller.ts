import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { BitrixWikiService } from '@/modules/bitirx/modules/integration/wiki/wiki.service';
import { AuthGuard } from '@/common/guards/auth.guard';
import { UnloadLostCallingDto } from '@/modules/bitirx/modules/integration/wiki/dtos/wiki-unload-lost-calling.dto';
import { ApiHeader, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { B24ApiTags } from '@/modules/bitirx/interfaces/bitrix-api.interface';

@ApiTags(B24ApiTags.WIKI)
@UseGuards(AuthGuard)
@Controller('integration/wiki')
export class BitrixWikiController {
  constructor(private readonly bitrixWikiService: BitrixWikiService) {}

  @ApiOperation({
    summary: 'Выгрузка потерянных звонков',
  })
  @ApiResponse({})
  @ApiHeader({
    name: 'Authorization',
    description: 'api key',
    example: 'bga token',
    required: true,
  })
  @HttpCode(HttpStatus.OK)
  @Post('/unload-lost-calling')
  async unloadLostCalling(@Body() fields: UnloadLostCallingDto) {
    return this.bitrixWikiService.unloadLostCalling(fields);
  }
}
