import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { catchError, firstValueFrom } from 'rxjs';
import { AxiosError, AxiosRequestConfig, isAxiosError } from 'axios';

@Injectable()
export class AppHttpService {
  constructor(private readonly http: HttpService) {}

  async post<T, U = any>(
    url: string,
    body?: T,
    config?: AxiosRequestConfig<T>,
  ) {
    try {
      const response = await firstValueFrom(
        this.http.post<U, T>(url, body, config).pipe(
          catchError((error: AxiosError) => {
            // console.log('HTTP MODULE: Get error: ', error);
            throw error.response?.data;
          }),
        ),
      );

      const { data } = response;

      console.log('HttpModule: Response: ', data);

      return data;
    } catch (error) {
      if (isAxiosError(error)) throw error;

      console.error('HttpModule: UnHandling error exception: ', error);
      throw error;
    }
  }
}
