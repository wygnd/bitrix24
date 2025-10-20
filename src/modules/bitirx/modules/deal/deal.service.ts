import { Injectable } from '@nestjs/common';
import { BitrixImBotService } from '../imbot/imbot.service';

@Injectable()
export class BitrixDealService {
  constructor(private readonly bitrixImbotService: BitrixImBotService) {}

}
