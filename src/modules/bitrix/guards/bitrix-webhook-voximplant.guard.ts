import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { BitrixApiService } from '@/modules/bitrix/bitrix-api.service';
import { Request } from 'express';
import { B24EventBodyVoxImplant } from '@/modules/bitrix/modules/imbot/interfaces/imbot-events.interface';

@Injectable()
export class BitrixVoxImplantFinishCallEventGuard implements CanActivate {
  constructor(private readonly bitrixService: BitrixApiService) {}

  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<Request>();

    const body: B24EventBodyVoxImplant = request.body;

    const tokenFromRequest = body?.auth?.application_token;
    const token = this.bitrixService.WEBHOOK_VOXIMPLANT_FINISH_CALL_TOKEN;

    if (!token || !tokenFromRequest || token !== tokenFromRequest)
      throw new UnauthorizedException('Invalid webhook token');

    return true;
  }
}

@Injectable()
export class BitrixVoxImplantStartCallEventGuard implements CanActivate {
  constructor(private readonly bitrixService: BitrixApiService) {}

  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<Request>();

    const body: B24EventBodyVoxImplant = request.body;

    const tokenFromRequest = body?.auth?.application_token;
    const token = this.bitrixService.WEBHOOK_VOXIMPLANT_START_CALL_TOKEN;

    if (!token || !tokenFromRequest || token !== tokenFromRequest)
      throw new UnauthorizedException('Invalid webhook token');

    return true;
  }
}

@Injectable()
export class BitrixVoxImplantInitCallEventGuard implements CanActivate {
  constructor(private readonly bitrixService: BitrixApiService) {}

  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<Request>();

    const body: B24EventBodyVoxImplant = request.body;

    const tokenFromRequest = body?.auth?.application_token;
    const token = this.bitrixService.WEBHOOK_VOXIMPLANT_INIT_CALL_TOKEN;

    if (!token || !tokenFromRequest || token !== tokenFromRequest)
      throw new UnauthorizedException('Invalid webhook token');

    return true;
  }
}