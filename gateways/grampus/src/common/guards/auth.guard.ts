import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<Request>();

    const tokenFromConfig = this.configService.get<string>('config.apiKey');

    if (!tokenFromConfig) {
      console.error('Error get token from config');
      return false;
    }

    const [authType, token] = (request.headers['authorization'] ?? '').split(
      ' ',
    );

    if (authType !== 'bga')
      throw new UnauthorizedException('Invalid authorization type');

    if (token !== tokenFromConfig)
      throw new UnauthorizedException('Invalid token');

    return true;
  }
}
