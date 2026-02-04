import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Req,
  UseGuards,
  ForbiddenException,
  NotFoundException,
  Query,
} from '@nestjs/common';
import {
  CreateTaskDto,
  UpdateTaskDto,
  AddTaskCommentDto,
  SetClientReviewDto,
} from '../dto';
import { AuthGuard } from 'src/common/guards/auth.guard';
import { UserRoles } from 'src/common/enum';
import { ClientTaskService } from '../services/client.task.service';

@Controller('task/client')
export class ClientTaskController {
  constructor(private readonly clientTaskService: ClientTaskService) {}

  @Post()
  @UseGuards(AuthGuard)
  async createTask(@Req() req: any, @Body() dto: CreateTaskDto) {
    if (req.user.role !== UserRoles.CLIENT) {
      throw new ForbiddenException('Only clients can create tasks');
    }
    const task = await this.clientTaskService.createTask(dto, req.user.sub);
    return {
      message: 'Task created successfully',
      statusCode: 201,
      data: task,
    };
  }

  @Post(':id/comments')
  @UseGuards(AuthGuard)
  async addComment(
    @Req() req: any,
    @Param('id') taskId: string,
    @Body() dto: AddTaskCommentDto,
  ) {
    const comments = await this.clientTaskService.addComment(
      taskId,
      req.user.sub,
      req.user.role,
      dto,
    );

    return {
      message: 'Comment added successfully',
      statusCode: 201,
      data: comments,
    };
  }

  @UseGuards(AuthGuard)
  @Get('timeline/client')
  async getMyTimeline(@Req() req: any) {
    if (req.user.role !== UserRoles.CLIENT) {
      throw new ForbiddenException('Only clients can view their timeline');
    }

    const tasks = await this.clientTaskService.getTimelineByClient(
      req.user.sub,
    );
    return { message: 'Client timeline fetched', statusCode: 200, data: tasks };
  }
  @Get('client/:id')
  @UseGuards(AuthGuard)
  async getTask(@Param('id') id: string, @Req() req: any) {
    try {
      const task = await this.clientTaskService.getTaskById(
        id,
        req.user.sub,
        req.user.role,
      );

      return { message: 'Task fetched', statusCode: 200, data: task };
    } catch (err) {
      if (
        err instanceof NotFoundException ||
        err instanceof ForbiddenException
      ) {
        return { message: err.message, statusCode: 404, data: null };
      }
      throw err;
    }
  }

  @Patch('state/:id')
  @UseGuards(AuthGuard)
  async updateTask(
    @Param('id') id: string,
    @Body() dto: UpdateTaskDto,
    @Req() req: any,
  ) {
    const task = await this.clientTaskService.updateTaskStatus(
      id,
      dto,
      req.user,
    );
    return { message: 'Task updated', statusCode: 200, data: task };
  }

  @UseGuards(AuthGuard)
  @Post(':id/review')
  setClientReview(
    @Param('id') id: string,
    @Body() dto: SetClientReviewDto,
    @Req() req: any,
  ) {
    return this.clientTaskService.setClientReview(
      id,
      req.user.sub,
      req.user.role,
      dto.clientReview,
    );
  }
  
  @UseGuards(AuthGuard)
  @Post(':id/can-download')
  canDownload(@Param('id') id: string, @Req() req: any) {
    return this.clientTaskService.canDownload(id, req.user.sub, req.user.role);
  }
}
