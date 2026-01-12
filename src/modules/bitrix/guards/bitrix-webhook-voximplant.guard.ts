import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { B24EventBodyVoxImplant } from '@/modules/bitrix/application/interfaces/bot/imbot-events.interface';
import { BitrixUseCase } from '@/modules/bitrix/application/use-cases/common/bitrix.use-case';

@Injectable()
export class BitrixVoxImplantFinishCallEventGuard implements CanActivate {
  constructor(private readonly bitrixService: BitrixUseCase) {}

  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<Request>();

    const body: B24EventBodyVoxImplant = request.body;

    const tokenFromRequest = body?.auth?.application_token;
    const token =
      this.bitrixService.getConstant('WEBHOOK').voxImplant.finishCallToken;

    if (!token || !tokenFromRequest || token !== tokenFromRequest)
      throw new UnauthorizedException('Invalid webhook token');

    return true;
  }
}

@Injectable()
export class BitrixVoxImplantStartCallEventGuard implements CanActivate {
  constructor(private readonly bitrixService: BitrixUseCase) {}

  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<Request>();

    const body: B24EventBodyVoxImplant = request.body;

    const tokenFromRequest = body?.auth?.application_token;
    const token =
      this.bitrixService.getConstant('WEBHOOK').voxImplant.startCallToken;

    if (!token || !tokenFromRequest || token !== tokenFromRequest)
      throw new UnauthorizedException('Invalid webhook token');

    return true;
  }
}

@Injectable()
export class BitrixVoxImplantInitCallEventGuard implements CanActivate {
  constructor(private readonly bitrixService: BitrixUseCase) {}

  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<Request>();

    const body: B24EventBodyVoxImplant = request.body;

    const tokenFromRequest = body?.auth?.application_token;
    const token =
      this.bitrixService.getConstant('WEBHOOK').voxImplant.initCallToken;

    if (!token || !tokenFromRequest || token !== tokenFromRequest)
      throw new UnauthorizedException('Invalid webhook token');

    return true;
  }
}
