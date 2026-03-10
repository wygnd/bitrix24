import { Injectable } from '@nestjs/common';
import { IAnalyzeManagerCallRequest } from '../interfaces/interface';
import { AppHttpService } from './http.service';

@Injectable()
export class AppService {
  constructor(private readonly httpService: AppHttpService) {}

  public async handleAnalyzeManagerCalling(fields: IAnalyzeManagerCallRequest) {
    return this.httpService.post('/api/speech/review', fields);
  }
}
