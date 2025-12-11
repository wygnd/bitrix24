import { Inject, Injectable } from '@nestjs/common';
import type { AxiosInstance } from 'axios';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class TelphinService {
  constructor(
    private readonly configService: ConfigService,
    // @Inject('TelphinApiProvider')
    // private readonly telphinApi: AxiosInstance,
  ) {}
}
