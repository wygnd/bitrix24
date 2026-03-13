import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation } from '@nestjs/swagger';
import { AppHealthResponseDTO } from '../dtos/health/response/main';

@Controller({
  version: '1',
  path: '/',
})
export class AppController {
  constructor() {}

  @ApiOperation({ summary: 'Проверка работоспособности приложения' })
  @ApiOkResponse({
    type: AppHealthResponseDTO,
    description: 'Успешный ответ',
  })
  @Get('/health')
  public async checkHealth() {
    return {
      status: true,
    };
  }
}
