import { WikiService } from '@/modules/wiki/wiki.service';
import { Controller, Get, ParseBoolPipe, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Wiki')
@Controller('wiki')
export class WikiController {
  constructor(private readonly wikiService: WikiService) {}

  @Get('/get-working-sales')
  async getWorkingSales(
    @Query('force', new ParseBoolPipe({ optional: true }))
    force: boolean = false,
  ) {
    return this.wikiService.getWorkingSalesFromWiki(force);
  }
}
