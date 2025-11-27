import { Controller, Get, Redirect, UseGuards } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { BitrixLeadService } from '@/modules/bitirx/modules/lead/lead.service';
import { AuthGuard } from '@/common/guards/auth.guard';

@ApiExcludeController()
@Controller()
export class AppController {
  constructor(private readonly leadService: BitrixLeadService) {}

  @Get()
  @Redirect('/api', 301)
  async main() {}

  @UseGuards(AuthGuard)
  @Get('/test')
  async testHook() {
    return this.leadService.getLeadById('259810');
  }
}
