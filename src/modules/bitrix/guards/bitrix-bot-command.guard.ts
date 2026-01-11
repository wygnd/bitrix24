import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { OnImCommandKeyboardDto } from '@/modules/bitrix/application/dtos/bot/imbot-events.dto';
import { BitrixUseCase } from '@/modules/bitrix/application/use-cases/common/bitrix.use-case';

@Injectable()
export class BitrixBotCommandGuard implements CanActivate {
  constructor(private readonly bitrixService: BitrixUseCase) {}

  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<Request>();

    const body: OnImCommandKeyboardDto = request.body;

    const memberIdFromRequest = body?.auth?.member_id;
    const memberId = this.bitrixService.getConstant(
      'WEBHOOK_INCOMING_TOKEN',
    );

    if (!memberId || !memberIdFromRequest || memberId !== memberIdFromRequest)
      throw new UnauthorizedException('Invalid access token');

    return true;
  }
}
