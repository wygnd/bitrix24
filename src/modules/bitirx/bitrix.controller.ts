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
import { BitrixLeadService } from './methods/lead/lead.service';
import { B24BatchCommands } from './interfaces/bitrix.interface';

@ApiTags('All methods')
@Controller()
export class BitrixController {
  constructor(
    private readonly bitrixService: BitrixService,
    private readonly bitrixUserService: BitrixUserService,
    private readonly bitrixLeadService: BitrixLeadService,
  ) {}

  /**
   * USERS
   */
  @ApiTags('Users')
  @Get('/users/:userId')
  async getUserById(@Param('userId') userId: string) {
    try {
      return await this.bitrixUserService.getUserById(userId);
    } catch (error) {
      throw new HttpException(error, HttpStatus.BAD_REQUEST);
    }
  }

  /**
   * DEPARTMENTS
   */

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

  @Get('/test')
  async testRoute() {
    try {
      const { result: users } = await this.bitrixUserService.getUsers({
        filter: {
          '%WORK_POSITION': 'market',
          ACTIVE: false,
        },
      });

      if (!users || users.length == 0) return { error: 'Users not found' };

      const batchCommandsGetUserTotalTasks: B24BatchCommands = {};

      users.forEach((user) => {
        const { ID } = user;

        batchCommandsGetUserTotalTasks[`user_get_tasks-${ID}`] = {
          method: 'tasks.task.list',
          params: {
            filter: {
              RESPONSIBLE_ID: ID,
            },
          },
        };
      });

      return await this.bitrixService.callBatch(
        batchCommandsGetUserTotalTasks,
        false,
      );
    } catch (error) {
      throw new HttpException(error, HttpStatus.BAD_REQUEST);
    }
  }

  /**
   * LEADS
   */
  @ApiTags('Leads')
  @Get('/leads/:leadId')
  async getLeadById(@Param('leadId') leadId: string) {
    try {
      return await this.bitrixLeadService.getLeadById(leadId);
    } catch (error) {
      throw new HttpException(error, HttpStatus.BAD_REQUEST);
    }
  }
}
