import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { IncomingWebhookDto } from '@/modules/bitrix/application/dtos/webhooks/incoming-webhook.dto';
import { Request } from 'express';
import { BitrixUseCase } from '@/modules/bitrix/application/use-cases/common/bitrix.use-case';

@Injectable()
export class BitrixWebhookGuard implements CanActivate {
  constructor(private readonly bitrixService: BitrixUseCase) {}

  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<Request>();

    const body: IncomingWebhookDto = request.body;

    const memberIdFromRequest = body?.auth?.member_id;
    const memberId = this.bitrixService.getConstant(
      'WEBHOOK_INCOMING_TOKEN',
    );

    if (!memberId || !memberIdFromRequest || memberId !== memberIdFromRequest)
      throw new UnauthorizedException('Invalid credentials');

    return true;
  }
}
