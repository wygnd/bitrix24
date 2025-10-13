import { Injectable } from '@nestjs/common';
import { BitrixService } from '../../bitrix.service';

@Injectable()
export class BitrixImService {
  constructor(private readonly bitrixService: BitrixService) {}

  // todo: send message
  // todo: type response
  async sendMessage(dialogId: number, message: string) {}
}
