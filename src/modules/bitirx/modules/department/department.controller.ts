import {
  Controller,
  Get,
  Param,
  ParseArrayPipe,
  UseGuards,
} from '@nestjs/common';
import { BitrixDepartmentService } from '@/modules/bitirx/modules/department/department.service';
import { AuthGuard } from '@/common/guards/auth.guard';
import { ApiTags } from '@nestjs/swagger';
import { B24ApiTags } from '@/modules/bitirx/interfaces/bitrix-api.interface';

@UseGuards(AuthGuard)
@ApiTags(B24ApiTags.DEAPRTMENTS)
@Controller('department')
export class DepartmentController {
  constructor(private readonly departmentService: BitrixDepartmentService) {}

  @Get('/list')
  async getDepartmentList() {
    return this.departmentService.getDepartmentList();
  }

  @Get('/list/:departmentId')
  async getDepartmentById(
    @Param(
      'departmentId',
      new ParseArrayPipe({ items: String, separator: ',' }),
    )
    ids: string[],
  ) {
    return this.departmentService.getDepartmentById(ids);
  }

  @Get('/test')
  async testGetSettingsRate() {
    return this.departmentService.getHeadCountDealAtLastMonthRate([
      '36',
      '54',
      '124',
      '128',
    ]);
  }
}
