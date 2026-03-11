import { Controller, ValidationPipe } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { COMMANDS } from '../constants/constants';
import { AppService } from '../services/service';
import { ManagerCallRequestDTO } from '../dtos/manager-call-request.dto';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @MessagePattern({ cmd: COMMANDS.HEALTH })
  checkHealth() {
    return 'ok';
  }

  @MessagePattern({ cmd: COMMANDS.ANALYZE_MANAGER_CALLING })
  analyzeManagerCalling(
    @Payload(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    )
    data: ManagerCallRequestDTO,
  ) {
    return this.appService.handleAnalyzeManagerCalling(data);
  }
}
