import { Body, Controller, Get, Post, Redirect } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { TokensService } from '@/modules/tokens/tokens.service';
import { TokensCreationalAttributes } from '@/modules/tokens/interfaces/tokens-attributes.interface';
import { TokensServices } from '@/modules/tokens/interfaces/tokens-serivces.interface';
import { IsIn, IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';

class CreateTokensDto implements TokensCreationalAttributes {
  @IsNotEmpty()
  @IsString()
  accessToken: string;
  @IsNotEmpty()
  @IsString()
  refreshToken: string;
  @IsNotEmpty()
  @IsIn(Object.values(TokensServices))
  service: TokensServices;
  @IsNotEmpty()
  @IsInt()
  expires: number;
  @IsOptional()
  @IsString()
  notice?: string;
}

@ApiExcludeController()
@Controller()
export class AppController {
  constructor(private readonly tokensService: TokensService) {}

  @Get()
  @Redirect('/api', 301)
  async main() {}

  @Post('/create-tokens')
  async creteTokens(@Body() fields: CreateTokensDto) {
    return this.tokensService.createToken(fields);
  }
}
