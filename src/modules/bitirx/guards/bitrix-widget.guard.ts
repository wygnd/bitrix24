import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { BitrixService } from '@/modules/bitirx/bitrix.service';
import { Request } from 'express';
import { PlacementBodyRequestDto } from '@/modules/bitirx/modules/placement/dtos/placement-request.dto';

@Injectable()
export class BitrixPlacementGuard implements CanActivate {
  constructor(private readonly bitrixService: BitrixService) {}

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
