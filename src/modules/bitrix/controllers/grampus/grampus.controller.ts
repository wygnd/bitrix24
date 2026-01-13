import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { B24ApiTags } from '@/modules/bitrix/interfaces/bitrix-api.interface';
import { AuthGuard } from '@/common/guards/auth.guard';
import { ApiAuthHeader } from '@/common/decorators/api-authorization-header.decorator';
import { BitrixGrampusUseCase } from '@/modules/bitrix/application/use-cases/grampus/grampus.use-case';
import {
  BitrixGrampusSiteRequestReceiveDTO,
  BitrixGrampusSiteRequestReceiveResponseDTO,
} from '@/modules/bitrix/application/dtos/grampus/grampus-site-request.dto';
import { ApiExceptions } from '@/common/decorators/api-exceptions.decorator';

@ApiTags(B24ApiTags.GRAMPUS)
@ApiAuthHeader()
@ApiExceptions()
@UseGuards(AuthGuard)
@Controller({
  version: '1',
  path: 'integration/grampus',
})
export class BitrixGrampusController {
  constructor(private readonly grampusUseCase: BitrixGrampusUseCase) {}

  @ApiOperation({ summary: 'Зафиксировать заявку с сайта' })
  @ApiResponse({
    status: HttpStatus.OK,
    type: BitrixGrampusSiteRequestReceiveResponseDTO,
    description: 'Успех',
  })
  @HttpCode(HttpStatus.OK)
  @Post('/sites/request')
  async confirmRequestFromSite(
    @Body() fields: BitrixGrampusSiteRequestReceiveDTO,
  ) {
    return this.grampusUseCase.handleRequestFromSite(fields);
  }
}
