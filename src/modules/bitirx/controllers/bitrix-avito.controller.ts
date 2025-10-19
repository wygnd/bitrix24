import { Controller, Post } from '@nestjs/common';
import { BitrixService } from '../bitrix.service';
import { ApiTags } from '@nestjs/swagger';
import { B24ApiTags } from '../interfaces/bitrix-api.interface';

@ApiTags(B24ApiTags.AVITO)
@Controller('/integration/avito')
export class BitrixAvitoController {
  constructor(private readonly bitrixService: BitrixService) {}

  @Post('find-duplicates')
  async findDuplicatesByPhones() {
    return ['123'];
  }
}
