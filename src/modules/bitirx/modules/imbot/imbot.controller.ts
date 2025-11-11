import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { BitrixImBotService } from '@/modules/bitirx/modules/imbot/imbot.service';
import {
  ApiBody,
  ApiExcludeEndpoint,
  ApiHeader,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { B24ApiTags } from '@/modules/bitirx/interfaces/bitrix-api.interface';
import { ImbotRegisterCommandDto } from '@/modules/bitirx/modules/imbot/dtos/imbot-register-command.dto';
import { AuthGuard } from '@/common/guards/auth.guard';
import { ImbotMessageAddDto } from '@/modules/bitirx/modules/imbot/dtos/imbot-message-add.dto';
import { BitrixBotCommandGuard } from '@/modules/bitirx/guards/bitrix-bot-command.guard';
import { OnImCommandKeyboardDto } from '@/modules/bitirx/modules/imbot/dtos/events.dto';
import { BitrixService } from '@/modules/bitirx/bitrix.service';
import { ImbotHandleApproveSmmAdvertLayout } from '@/modules/bitirx/modules/imbot/interfaces/imbot-handle.interface';

@ApiTags(B24ApiTags.IMBOT)
@Controller('bot')
export class BitrixBotController {
  constructor(
    private readonly bitrixBotService: BitrixImBotService,
    private readonly bitrixService: BitrixService,
  ) {}

  @ApiHeader({
    name: 'Authorization',
    description: 'Authorization token',
    example: 'bga token',
  })
  @ApiOperation({
    summary: 'Add new command',
  })
  @UseGuards(AuthGuard)
  @Post('/commands/add')
  async addBotCommand(@Body() body: ImbotRegisterCommandDto) {
    return this.bitrixBotService.addCommand(body);
  }

  @ApiOperation({
    summary: 'Get registered bot commands',
  })
  @ApiHeader({
    name: 'Authorization',
    description: 'Authorization token',
    example: 'bga token',
  })
  @UseGuards(AuthGuard)
  @Get('/commands')
  async getBotCommands() {
    return this.bitrixBotService.getBotCommands();
  }

  @ApiOperation({
    summary: 'Get bot command by id',
  })
  @ApiHeader({
    name: 'Authorization',
    description: 'Authorization token',
    example: 'bga token',
  })
  @UseGuards(AuthGuard)
  @Get('/commands/:id')
  async getBotCommandById(@Param('id') commandId: string) {
    return this.bitrixBotService.getBotCommandById(commandId);
  }

  @ApiExcludeEndpoint()
  @ApiOperation({
    summary: 'create new bot',
  })
  @ApiHeader({
    name: 'Authorization',
    description: 'Authorization token',
    example: 'bga token',
  })
  @UseGuards(AuthGuard)
  @Post('/add')
  async addBot() {
    throw new ForbiddenException();
  }

  @ApiOperation({
    summary: 'send message from bot',
  })
  @ApiHeader({
    name: 'Authorization',
    description: 'Authorization token',
    example: 'bga token',
  })
  @UseGuards(AuthGuard)
  @Post('/message/add')
  async sendMessage(@Body() fields: ImbotMessageAddDto) {
    return this.bitrixBotService.sendMessage(fields);
  }

  @UseGuards(AuthGuard)
  @Get('/list')
  async getBotList() {
    return this.bitrixBotService.getBotList();
  }

  @ApiExcludeEndpoint()
  @UseGuards(AuthGuard)
  @Delete('/remove')
  async removeBot() {
    throw new ForbiddenException();
  }

  @ApiOperation({
    summary: 'Handle bot commands',
    description: 'Available commands: ',
  })
  @UseGuards(BitrixBotCommandGuard)
  @Post('onimcommandadd')
  async handleCommand(@Body() body: OnImCommandKeyboardDto) {
    const { event, data } = body;

    if (event !== 'ONIMCOMMANDADD')
      throw new ForbiddenException('Invalid event');

    const { MESSAGE, MESSAGE_ID } = data.PARAMS;

    const [command, commandParams] = MESSAGE.split(' ', 2);

    switch (command) {
      case '/distributeNewDeal':
        break;

      case '/approveSmmAdvertLayouts':
        return this.bitrixBotService.handleApproveSmmAdvertLayout(
          JSON.parse(commandParams) as ImbotHandleApproveSmmAdvertLayout,
          MESSAGE_ID,
        );

      default:
        throw new BadRequestException('Command not handled yet');
    }
  }
}
