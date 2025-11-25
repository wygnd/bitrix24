import { Controller, Get, Query, Redirect } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { AvitoService } from '@/modules/avito/avito.service';

@ApiExcludeController()
@Controller()
export class AppController {
  constructor(private readonly avitoService: AvitoService) {}

  @Get()
  @Redirect('/api', 301)
  async main() {}

  @Get('/test')
  async testHandle(@Query('phone') phone: string) {
    return this.avitoService.rejectDistributeLeadByAi(phone);
  }
}
