import {
  Controller,
  Get,
  Param,
  ParseArrayPipe,
  UseGuards,
} from '@nestjs/common';
import { BitrixDepartmentService } from '@/modules/bitrix/modules/department/department.service';
import { AuthGuard } from '@/common/guards/auth.guard';
import { ApiTags } from '@nestjs/swagger';
import { B24ApiTags } from '@/modules/bitrix/interfaces/bitrix-api.interface';

@UseGuards(AuthGuard)
@ApiTags(B24ApiTags.DEAPRTMENTS)
@Controller('department')
export class BitrixDepartmentController {
  constructor(private readonly departmentService: BitrixDepartmentService) {}

  @Get('/list')
  async getDepartmentList() {
    return this.departmentService.getDepartmentList();
  }

  @Get('/item/:departmentId')
  async getDepartmentById(
    @Param(
      'departmentId',
      new ParseArrayPipe({ items: String, separator: ',' }),
    )
    ids: string[],
  ) {
    return this.departmentService.getDepartmentById(ids);
  }
}
