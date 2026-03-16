import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { IEnvironmentOptions } from '@shared/interfaces/config/main';

@Injectable()
export class AuthGuard implements CanActivate {
  private readonly logger = new Logger(AuthGuard.name);

  constructor(
    private readonly configService: ConfigService<IEnvironmentOptions>,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.configService.get<string>('application.auth.token', {
      infer: true,
    });

    if (!token) {
      this.logger.error('Invalid get token. Request forbidden');
      return false;
    }

    const [authType, requestToken] = (
      request.headers['authorization'] ?? ''
    ).split(' ');

    if (authType !== 'baa')
      throw new UnauthorizedException('Invalid authorization type');

    if (requestToken !== token)
      throw new UnauthorizedException('Invalid authorization');

    return true;
  }
}
