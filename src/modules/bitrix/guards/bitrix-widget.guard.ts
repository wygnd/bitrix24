import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { BitrixApiService } from '@/modules/bitrix/bitrix-api.service';
import { Request } from 'express';
import { PlacementBodyRequestDto } from '@/modules/bitrix/modules/placement/dtos/placement-request.dto';

@Injectable()
export class BitrixPlacementGuard implements CanActivate {
  constructor(private readonly bitrixService: BitrixApiService) {}

  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<Request>();

    const body: PlacementBodyRequestDto = request.body;

    const memberIdFromRequest = body?.member_id;
    const memberId = this.bitrixService.WEBHOOK_INCOMING_TOKEN;

    if (!memberId || !memberIdFromRequest || memberId !== memberIdFromRequest)
      throw new UnauthorizedException('Invalid credentials');

    return true;
  }
}
