import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { BitrixService } from '@/modules/bitirx/bitrix.service';
import { Request } from 'express';
import { B24BotEventBody } from '@/modules/bitirx/modules/imbot/interfaces/imbot-events.interface';
import { B24ImbotRegisterCommand } from '@/modules/bitirx/modules/imbot/imbot.interface';
import { OnImCommandKeyboardDto } from '@/modules/bitirx/modules/imbot/dtos/events.dto';

@Injectable()
export class BitrixBotCommandGuard implements CanActivate {
  constructor(private readonly bitrixService: BitrixService) {}

  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<Request>();

    const body: OnImCommandKeyboardDto = request.body;

    const memberIdFromRequest = body.auth.member_id;
    const memberId = this.bitrixService.WEBHOOK_INCOMING_TOKEN;

    if (
      !memberId ||
      !memberIdFromRequest ||
      memberId !== memberIdFromRequest
    )
      throw new UnauthorizedException('Invalid access token');

    return true;
  }
}
