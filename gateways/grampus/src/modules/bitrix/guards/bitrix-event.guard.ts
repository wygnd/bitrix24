import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { B24BotEventBody } from '@/modules/bitrix/application/interfaces/bot/imbot-events.interface';
import { BitrixUseCase } from '@/modules/bitrix/application/use-cases/common/bitrix.use-case';

@Injectable()
export class BitrixEventGuard implements CanActivate {
  constructor(private readonly bitrixService: BitrixUseCase) {}

  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<Request>();

    const body: B24BotEventBody = request.body;

    const tokenFromRequest = body?.auth?.member_id;
    const token = this.bitrixService.getConstant('WEBHOOK_INCOMING_TOKEN');

    if (!token || !tokenFromRequest || token !== tokenFromRequest)
      throw new UnauthorizedException('Invalid access token');

    return true;
  }
}
