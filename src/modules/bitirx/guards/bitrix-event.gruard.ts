import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { BitrixService } from '@/modules/bitirx/bitrix.service';
import { Request } from 'express';
import { B24EventBody } from '@/modules/bitirx/modules/imbot/interfaces/imbot-events.interface';

@Injectable()
export class BitrixEventGuard implements CanActivate {
  constructor(private readonly bitrixService: BitrixService) {}

  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<Request>();

    const body: B24EventBody = request.body;

    const accessTokenFromRequest = body.auth.access_token;
    const accessToken = this.bitrixService.ACCESS_TOKEN;

    if (
      !accessToken ||
      !accessTokenFromRequest ||
      accessToken !== accessTokenFromRequest
    )
      throw new UnauthorizedException('Invalid access token');

    return true;
  }
}
