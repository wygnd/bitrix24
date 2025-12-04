import { Inject, Injectable } from '@nestjs/common';
import { TokensModel } from '@/modules/tokens/tokens.entity';
import { TOKENS_REPOSITORY } from '@/modules/tokens/tokens.constants';
import { TokensCreationalAttributes } from '@/modules/tokens/interfaces/tokens-attributes.interface';
import { TokensServices } from '@/modules/tokens/interfaces/tokens-serivces.interface';
import { plainToClass, plainToInstance } from 'class-transformer';
import { TokensDto } from '@/modules/tokens/dtos/tokens.dto';
import { RedisService } from '@/modules/redis/redis.service';
import { REDIS_KEYS } from '@/modules/redis/redis.constants';

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
        plainToInstance(TokensDto, response, {
          excludeExtraneousValues: true,
        }),
      );

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
    );

    return token;
  }

  public async updateToken(
    serviceToken: TokensServices,
    fields: Partial<TokensCreationalAttributes>,
  ) {
    try {
      const [, [token]] = await this.tokensRepository.update(fields, {
        where: {
          service: serviceToken,
        },
        returning: true,
      });

      this.redisService.set<TokensDto>(
        REDIS_KEYS.APPLICATION_TOKEN_BY_SERVICE + serviceToken,
        token,
      );

      return true;
    } catch (err) {
      return false;
    }
  }
}
