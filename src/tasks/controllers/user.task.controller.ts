import {
  Controller,
  Get,
  Patch,
  Body,
  Param,
  Req,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { SubmitTaskDto } from '../dto';
import { AuthGuard } from 'src/common/guards/auth.guard';
import { TaskStatus, UserRoles } from 'src/common/enum';
import { UserTaskService } from '../services/user.task.service';

@Controller('task/user')
export class UserTaskController {
  constructor(private readonly userTaskService: UserTaskService) {}

@UseGuards(AuthGuard)
@Get('timeLine/user')
async getUserTimeline(@Req() req: any) {
  if (req.user.role !== UserRoles.USER) {
    throw new ForbiddenException('Users only');
  }

  const tasks = await this.userTaskService.getUserTimeline(req.user.sub);

  return {
    message: 'User timeline fetched',
    statusCode: 200,
    data: tasks,
  };
}
  @Get(':id')
  @UseGuards(AuthGuard)
  async getTask(@Param('id') id: string, @Req() req: any) {
    const task = await this.userTaskService.getTaskById(
      id,
      req.user.sub,
      req.user.role,
    );
    return { message: 'Task fetched', statusCode: 200, data: task };
  }

  @Patch(':id/take')
  @UseGuards(AuthGuard)
  async takeTask(@Param('id') id: string, @Req() req: any) {
    if (req.user.role !== UserRoles.USER) {
      throw new ForbiddenException('Only users can take tasks');
    }

    const task = await this.userTaskService.takeTask(id, req.user.sub);

    return {
      message: 'Task taken successfully',
      statusCode: 200,
      data: task,
    };
  }

  @Patch(':id/submit')
  @UseGuards(AuthGuard)
  async submitTask(
    @Param('id') id: string,
    @Body() dto: SubmitTaskDto,
    @Req() req: any,
  ) {
    if (req.user.role !== UserRoles.USER) {
      throw new ForbiddenException('Only Users can submit tasks');
    }

    const task = await this.userTaskService.submitTask(id, dto, req.user.sub);
    return { message: 'Task submitted', statusCode: 200, data: task };
  }
}
