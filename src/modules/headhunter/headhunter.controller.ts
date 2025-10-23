import {
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Post,
} from '@nestjs/common';
import { HeadHunterService } from '@/modules/headhunter/headhunter.service';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('HH')
@Controller()
export class HeadHunterController {
  constructor(private readonly headHunterApi: HeadHunterService) {}

  @Get('/hh/me')
  async getInfo() {
    try {
      return this.headHunterApi.get('/me');
    } catch (error) {
      throw new HttpException(error, HttpStatus.BAD_REQUEST);
    }
  }
}
