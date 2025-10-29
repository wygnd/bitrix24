import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { IncomingWebhookDto } from '@/modules/bitirx/modules/webhook/dtos/incoming-webhook.dto';
import { BitrixService } from '@/modules/bitirx/bitrix.service';
import { Request } from 'express';

@Injectable()
export class BitrixWebhookGuard implements CanActivate {
  constructor(private readonly bitrixService: BitrixService) {}

  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<Request>();

    const body: IncomingWebhookDto = request.body;

    const memberIdFromRequest = body.auth.member_id;
    const memberId = this.bitrixService.WEBHOOK_INCOMING_TOKEN;

    if (!memberId || !memberIdFromRequest || memberId !== memberIdFromRequest)
      throw new UnauthorizedException('Invalid credentials');

    return true;
  }
}
