import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { BitrixService } from '@/modules/bitrix/bitrix.service';
import { Request } from 'express';
import { B24EventBodyVoxImplant } from '@/modules/bitrix/modules/imbot/interfaces/imbot-events.interface';
import { WinstonLogger } from '@/config/winston.logger';

@Injectable()
export class BitrixVoxImplantEventGuard implements CanActivate {
  private readonly logger = new WinstonLogger(BitrixVoxImplantEventGuard.name);

  constructor(private readonly bitrixService: BitrixService) {}

  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<Request>();

    const body: B24EventBodyVoxImplant = request.body;

    const tokenFromRequest = body?.auth?.application_token;
    const token = this.bitrixService.WEBHOOK_VOXIMPLANT_FINISH_CALL_TOKEN;

    this.logger.info(`Check tokens: ${tokenFromRequest} <=> ${token}`);

    if (!token || !tokenFromRequest || token !== tokenFromRequest)
      throw new UnauthorizedException('Invalid webhook token');

    return true;
  }
}
