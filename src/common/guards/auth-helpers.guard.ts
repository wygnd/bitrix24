import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthHelpersGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<Request>();

    const tokenFromConfig = this.configService.get<string>(
      'config.helpersApiKey',
    );

    if (!tokenFromConfig) return false;

    const [authType, token] = (request.headers['authorization'] ?? '').split(
      ' ',
    );

    if (authType !== 'biga')
      throw new UnauthorizedException('Invalid authorization type');

    if (token !== tokenFromConfig)
      throw new UnauthorizedException('Invalid token');

    return true;
  }
}
