import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { BitrixApiService } from '@/modules/bitrix/bitrix-api.service';
import { Request } from 'express';
import { OnImCommandKeyboardDto } from '@/modules/bitrix/modules/imbot/dtos/imbot-events.dto';

@Injectable()
export class BitrixBotCommandGuard implements CanActivate {
  constructor(private readonly bitrixService: BitrixApiService) {}

  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<Request>();

    const body: OnImCommandKeyboardDto = request.body;

    const memberIdFromRequest = body?.auth?.member_id;
    const memberId = this.bitrixService.WEBHOOK_INCOMING_TOKEN;

    if (!memberId || !memberIdFromRequest || memberId !== memberIdFromRequest)
      throw new UnauthorizedException('Invalid access token');

    return true;
  }
}
