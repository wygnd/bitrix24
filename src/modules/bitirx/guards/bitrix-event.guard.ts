import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { BitrixService } from '@/modules/bitirx/bitrix.service';
import { Request } from 'express';
import { B24BotEventBody } from '@/modules/bitirx/modules/imbot/interfaces/imbot-events.interface';

@Injectable()
export class BitrixEventGuard implements CanActivate {
  constructor(private readonly bitrixService: BitrixService) {}

  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<Request>();

    const body: B24BotEventBody = request.body;

    const tokenFromRequest = body.auth.member_id;
    const token = this.bitrixService.WEBHOOK_INCOMING_TOKEN;

    if (
      !token ||
      !tokenFromRequest ||
      token !== tokenFromRequest
    )
      throw new UnauthorizedException('Invalid access token');

    return true;
  }
}
