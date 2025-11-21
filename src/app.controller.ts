import {
  Controller,
  Get,
  Header,
  NotFoundException,
  Redirect,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { createReadStream } from 'node:fs';
import { join } from 'path';
import type { Response } from 'express';
import { existsSync } from 'fs';
import { AuthGuard } from '@/common/guards/auth.guard';
import { WikiService } from '@/modules/wiki/wiki.service';

@ApiExcludeController()
@Controller()
export class AppController {
  constructor(private readonly wikiService: WikiService) {}

  @Get()
  @Redirect('/api', 301)
  async main() {}

  @UseGuards(AuthGuard)
  @Get('/dashboard')
  @Header('Content-Type', 'text/html')
  async dashboard(@Res() response: Response) {
    const filepath = join(__dirname, '..', '/static/dashboard.html');

    if (!existsSync(filepath)) throw new NotFoundException();

    const file = createReadStream(filepath);

    file.pipe(response);
  }

  @Get('wiki/working-sales')
  async getWorkingSales() {
    return this.wikiService.getWorkingSalesFromWiki(true);
  }
}
