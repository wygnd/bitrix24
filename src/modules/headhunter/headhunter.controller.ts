import { Controller } from '@nestjs/common';
import { HeadHunterService } from '@/modules/headhunter/headhunter.service';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('HH')
@Controller()
export class HeadHunterController {
  constructor(private readonly headHunterApi: HeadHunterService) {}
}
