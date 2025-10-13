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
import { B24BatchCommands, B24Response } from './interfaces/bitrix.interface';
import { ApplicationLoggerService } from '../logger/logger.service';

@ApiTags('All methods')
@Controller()
export class BitrixController {
  constructor(
    private readonly logger: ApplicationLoggerService,
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

      return users;
      const batchCommandsGetUserTotalTasks: B24BatchCommands = {};

      users.forEach((user) => {
        const { ID } = user;

        batchCommandsGetUserTotalTasks[`user_get_tasks-${ID}`] = {
          method: 'tasks.task.list',
          params: {
            filter: {
              RESPONSIBLE_ID: ID,
              '@REAL_STATUS': [1, 2, 3, 4, -1, -2, -3],
            },
          },
        };
      });

      const batchResponseGetUserTotalTasks: {
        [key: string]: B24Response<any>;
      } = await this.bitrixService.callBatch(
        batchCommandsGetUserTotalTasks,
        false,
      );

      const userTasks = new Map<string, number>();
      for (const [commandName, value] of Object.entries(
        batchResponseGetUserTotalTasks,
      )) {
        const [, userId] = commandName.split('-');
        if (!value.total || value.total === 0) continue;

        userTasks.set(userId, value.total);
      }

      const batchCommandsGetUserTasks = new Map<number, B24BatchCommands>([]);

      const limit = 50;
      let batchCommandsIndex = 0;
      for (const [userId, totalTasks] of userTasks.entries()) {
        const queries = Math.ceil(totalTasks / limit);
        let currentCommands =
          batchCommandsGetUserTasks.get(batchCommandsIndex) ?? {};

        if (Object.keys(currentCommands).length === 50) {
          batchCommandsIndex += 1;
        }

        currentCommands =
          batchCommandsGetUserTasks.get(batchCommandsIndex) ?? {};

        for (let i = 1; i <= queries; i++) {
          if (Object.keys(currentCommands).length === 50) {
            batchCommandsGetUserTasks.set(batchCommandsIndex, currentCommands);
            batchCommandsIndex += 1;
            currentCommands =
              batchCommandsGetUserTasks.get(batchCommandsIndex) ?? {};
          }

          currentCommands[`get_user_tasks-${userId}-${i}`] = {
            method: 'tasks.task.list',
            params: {
              filter: {
                RESPONSIBLE_ID: userId,
                '@REAL_STATUS': [1, 2, 3, 4, -1, -2, -3],
              },
              start: (i - 1) * limit,
            },
          };
        }

        batchCommandsGetUserTasks.set(batchCommandsIndex, currentCommands);
      }

      const batchResponseGetTasks: object[] = [];

      for (const cmds of batchCommandsGetUserTasks.values()) {
        const result = await this.bitrixService.callBatch(cmds);
        batchResponseGetTasks.push(result);
      }

      return batchResponseGetTasks.length;
      const taskIds: string[] = [];
      batchResponseGetTasks.forEach((commandsResult) => {
        for (const commandResult of Object.values(commandsResult)) {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-call
          commandResult.result.tasks.map((task: object) => {
            // @ts-ignore
            taskIds.push(task.id);
          });
        }
      });

      const batchCommandsDeleteUserTasks = new Map<number, B24BatchCommands>(
        [],
      );

      let batchRemoveTasksIndex = 0;
      taskIds.forEach((taskId) => {
        let currentCommands =
          batchCommandsDeleteUserTasks.get(batchRemoveTasksIndex) ?? {};

        if (Object.keys(currentCommands).length === 50) {
          batchRemoveTasksIndex += 1;
        }

        currentCommands =
          batchCommandsDeleteUserTasks.get(batchRemoveTasksIndex) ?? {};

        currentCommands[`remove_task-${taskId}`] = {
          method: 'tasks.task.delete',
          params: {
            taskId: taskId,
          },
        };

        batchCommandsDeleteUserTasks.set(
          batchRemoveTasksIndex,
          currentCommands,
        );
      });

      const response: object[] = [];
      for (const cmds of batchCommandsDeleteUserTasks.values()) {
        const result = await this.bitrixService.callBatch(cmds);
        response.push(result);
      }

      return response;
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
