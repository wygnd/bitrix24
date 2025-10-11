import {
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { BitrixService } from './bitrix.service';
import { BitrixUserService } from './methods/user/user.service';
import { ApiTags } from '@nestjs/swagger';

@Controller()
export class BitrixController {
  constructor(
    private readonly bitrixService: BitrixService,
    private readonly bitrixUserService: BitrixUserService,
  ) {}

  @ApiTags('Users')
  @Get('/users/:userId')
  async getUserById(@Param('userId') userId: string) {
    try {
      return await this.bitrixUserService.getUserById(userId);
    } catch (error) {
      throw new HttpException(error, HttpStatus.BAD_REQUEST);
    }
  }

  @ApiTags('Departments')
  @Get('/departments/:departmentId')
  async getDepartmentById(
    @Param('departmentId', ParseIntPipe) departmentId: number,
  ) {
    try {
      return await this.bitrixUserService.getUsersByDepartment(departmentId);
    } catch (error) {
      throw new HttpException(error, HttpStatus.BAD_REQUEST);
    }
  }
}
