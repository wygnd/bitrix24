import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { IncomingWebhookDto } from '@/modules/bitrix/modules/webhook/dtos/incoming-webhook.dto';
import { BitrixApiService } from '@/modules/bitrix/bitrix-api.service';
import { Request } from 'express';

@Injectable()
export class BitrixWebhookGuard implements CanActivate {
  constructor(private readonly bitrixService: BitrixApiService) {}

  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<Request>();

    const body: IncomingWebhookDto = request.body;

    const memberIdFromRequest = body?.auth?.member_id;
    const memberId = this.bitrixService.WEBHOOK_INCOMING_TOKEN;

    if (!memberId || !memberIdFromRequest || memberId !== memberIdFromRequest)
      throw new UnauthorizedException('Invalid credentials');

    return true;
  }
}
