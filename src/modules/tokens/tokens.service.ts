import { Inject, Injectable } from '@nestjs/common';
import { TokensModel } from '@/modules/tokens/tokens.entity';
import { TOKENS_REPOSITORY } from '@/modules/tokens/tokens.constants';
import { TokensCreationalAttributes } from '@/modules/tokens/interfaces/tokens-attributes.interface';
import { TokensServices } from '@/modules/tokens/interfaces/tokens-serivces.interface';
import { plainToClass, plainToInstance } from 'class-transformer';
import { TokensDto } from '@/modules/tokens/dtos/tokens.dto';
import { RedisService } from '@/modules/redis/redis.service';
import { REDIS_KEYS } from '@/modules/redis/redis.constants';
import { TokensCreateOrUpdateResponse } from '@/modules/tokens/interfaces/tokens-create-or-update-response.interface';

@Injectable()
export class TokensService {
  constructor(
    @Inject(TOKENS_REPOSITORY)
    private readonly tokensRepository: typeof TokensModel,
    private readonly redisService: RedisService,
  ) {}

  public async getToken(service: TokensServices) {
    const tokenFromCache = await this.redisService.get<TokensDto>(
      REDIS_KEYS.APPLICATION_TOKEN_BY_SERVICE + service,
    );

    if (tokenFromCache) return tokenFromCache;

    const tokenFromDB = await this.tokensRepository
      .findOne({
        where: {
          service: service,
        },
      })
      .then((response) =>
        response
          ? plainToInstance(TokensDto, response, {
              excludeExtraneousValues: true,
            })
          : null,
      );

    if (!tokenFromDB) return null;

    this.redisService.set<TokensDto>(
      REDIS_KEYS.APPLICATION_TOKEN_BY_SERVICE + service,
      tokenFromDB,
      3600, // 1 hour
    );

    return tokenFromDB;
  }

  public async createToken(fields: TokensCreationalAttributes) {
    const token = plainToClass(
      TokensDto,
      await this.tokensRepository.create(fields),
      {
        excludeExtraneousValues: true,
      },
    );

    this.redisService.set<TokensDto>(
      REDIS_KEYS.APPLICATION_TOKEN_BY_SERVICE + token.service,
      token,
      3600,
    );

    return token;
  }

  public async updateOrCreateToken(
    service: TokensServices,
    fields: Partial<TokensCreationalAttributes>,
  ): Promise<TokensCreateOrUpdateResponse> {
    const isUpdated = await this.updateToken(service, fields);

    if (isUpdated)
      return {
        message: 'Token was updated',
        status: true,
      };

    if (!fields.accessToken)
      return {
        message: 'Token was not updated',
        status: false,
      };

    try {
      await this.createToken({
        accessToken: fields.accessToken,
        refreshToken: fields.refreshToken,
        expires: fields.expires ?? 0,
        service: service,
      });

      return {
        message: 'Token was created',
        status: true,
      };
    } catch (e) {
      return {
        message: `Error: ${e}`,
        status: false,
      };
    }
  }

  public async updateToken(
    serviceToken: TokensServices,
    fields: Partial<TokensCreationalAttributes>,
  ) {
    try {
      console.log('Trying update tokens: ', fields);
      const [, [token]] = await this.tokensRepository.update(fields, {
        where: {
          service: serviceToken,
        },
        returning: true,
      });

      if (!token) return false;

      await this.redisService.set<TokensDto>(
        REDIS_KEYS.APPLICATION_TOKEN_BY_SERVICE + serviceToken,
        token,
        3600,
      );

      console.log('Token was updated: ', token);

      return true;
    } catch (err) {
      return false;
    }
  }
}
