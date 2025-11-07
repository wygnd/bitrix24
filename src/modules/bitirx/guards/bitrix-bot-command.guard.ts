import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { BitrixService } from '@/modules/bitirx/bitrix.service';
import { Request } from 'express';
import { B24EventBody } from '@/modules/bitirx/modules/imbot/interfaces/imbot-events.interface';
import { B24ImbotRegisterCommand } from '@/modules/bitirx/modules/imbot/imbot.interface';
import { OnImCommandKeyboardDto } from '@/modules/bitirx/modules/imbot/dtos/events.dto';

@Injectable()
export class BitrixBotCommandGuard implements CanActivate {
  constructor(private readonly bitrixService: BitrixService) {}

  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<Request>();

    const body: OnImCommandKeyboardDto = request.body;

    const accessTokenFromRequest = body.auth.access_token;
    const accessToken = this.bitrixService.ACCESS_TOKEN;

    console.log('TEST CHECKING ACCESS TOKEN: ', body.auth);

    if (
      !accessToken ||
      !accessTokenFromRequest ||
      accessToken !== accessTokenFromRequest
    )
      throw new UnauthorizedException('Invalid access token');

    return true;
  }
}
