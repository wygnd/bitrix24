import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { PlacementBodyRequestDto } from '@/modules/bitrix/application/dtos/placements/placement-request.dto';
import { BitrixUseCase } from '@/modules/bitrix/application/use-cases/common/bitrix.use-case';

@Injectable()
export class BitrixPlacementGuard implements CanActivate {
  constructor(private readonly bitrixService: BitrixUseCase) {}

  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<Request>();

    const body: PlacementBodyRequestDto = request.body;

    const memberIdFromRequest = body?.member_id;
    const memberId = this.bitrixService.getConstant(
      'WEBHOOK_INCOMING_TOKEN',
    );

    if (!memberId || !memberIdFromRequest || memberId !== memberIdFromRequest)
      throw new UnauthorizedException('Invalid credentials');

    return true;
  }
}
