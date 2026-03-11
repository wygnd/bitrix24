import { Injectable } from '@nestjs/common';
import { IAnalyzeManagerCallRequest } from '../interfaces/interface';
import { AppHttpService } from './http.service';

@Injectable()
export class AppService {
  constructor(private readonly httpService: AppHttpService) {}

  /**
   * Send request to neuro api for review calling
   *
   * ---
   *
   * Отправляет запрос в neuro api для оценки звонка
   * @param fields
   */
  public async handleAnalyzeManagerCalling(fields: IAnalyzeManagerCallRequest) {
    return this.httpService.post('/api/speech/review', fields);
  }
}
