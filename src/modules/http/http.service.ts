import { HttpException, Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { catchError, firstValueFrom } from 'rxjs';
import { AxiosError, AxiosRequestConfig, isAxiosError } from 'axios';
import { B24Response } from '../bitirx/interfaces/bitrix-api.interface';

@Injectable()
export class AppHttpService {
  constructor(private readonly http: HttpService) {}

  async post<T, U>(url: string, body?: T, config?: AxiosRequestConfig<T>) {
    try {
      const response = await firstValueFrom(
        this.http.post<B24Response<U>, T>(url, body, config).pipe(
          catchError((error: AxiosError) => {
            console.log('HttpModule: Exception error on post request: ', error);
            throw error;
          }),
        ),
      );

      const { data } = response;

      return data;
    } catch (error) {
      if (isAxiosError(error)) throw error;

      console.error('HttpModule: UnHandling error exception: ', error);
      throw error;
    }
  }
}
