import {
  Controller,
  Get,
  Param,
  ParseArrayPipe,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@/common/guards/auth.guard';
import { ApiTags } from '@nestjs/swagger';
import { B24ApiTags } from '@/modules/bitrix/interfaces/bitrix-api.interface';
import { ApiExceptions } from '@/common/decorators/api-exceptions.decorator';
import { BitrixDepartmentsUseCase } from '@/modules/bitrix/application/use-cases/departments/departments.use-case';

@UseGuards(AuthGuard)
@ApiTags(B24ApiTags.DEAPRTMENTS)
@ApiExceptions()
@Controller('department')
export class BitrixDepartmentController {
  constructor(private readonly bitrixDepartment: BitrixDepartmentsUseCase) {}

  @Get('/list')
  async getDepartmentList() {
    return this.bitrixDepartment.getDepartmentList();
  }

  @Get('/item/:departmentId')
  async getDepartmentById(
    @Param(
      'departmentId',
      new ParseArrayPipe({ items: String, separator: ',' }),
    )
    ids: string[],
  ) {
    return this.bitrixDepartment.getDepartmentById(ids);
  }
}
