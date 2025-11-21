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
import { QueueService } from '@/modules/queue/queue.service';

@ApiExcludeController()
@Controller()
export class AppController {
  constructor(private readonly bitrixQueue: QueueService) {}

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

  // @Get('/test')
  // async test() {
  //   return this.bitrixQueue.addTaskTest('pisapopa');
  // }
}
