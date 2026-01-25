import {
  Controller,
  Get,
  Patch,
  Body,
  Param,
  Req,
  UseGuards,
  ForbiddenException,
  Query,
  Post,
  Delete,
} from '@nestjs/common';
import { AddTaskCommentDto, AdminReviewDto, UpdateTaskDto } from '../dto';
import { AuthGuard } from 'src/common/guards/auth.guard';
import { TaskStatus, UserRoles } from 'src/common/enum';
import { AdminTaskService } from '../services/admin.task.service';

@Controller('task/admin')
export class AdminTaskController {
  constructor(private readonly adminTaskService: AdminTaskService) {}

  @UseGuards(AuthGuard)
  @Get('admin/timeLine')
  async getAdminTimeline(@Req() req: any, @Query('status') status?: string) {
    if (req.user.role !== UserRoles.ADMIN) {
      throw new ForbiddenException('Admins only');
    }

    const statusFilter = status
      ? (status.split(',') as TaskStatus[])
      : undefined;

    const tasks = await this.adminTaskService.getAdminTimeline({
      statusFilter,
    });

    return {
      message: 'Admin timeline fetched',
      statusCode: 200,
      data: tasks,
    };
  }

  @Get('statistics')
  @UseGuards(AuthGuard)
  async getAdminStatistics(@Req() req: any) {
    if (req.user.role !== UserRoles.ADMIN) {
      throw new ForbiddenException('Admins only');
    }

    const stats = await this.adminTaskService.getAdminStatistics();

    return {
      message: 'Admin statistics fetched successfully',
      statusCode: 200,
      data: stats,
    };
  }

  @Post(':id/comments')
  @UseGuards(AuthGuard)
  async addComment(
    @Req() req: any,
    @Param('id') taskId: string,
    @Body() dto: AddTaskCommentDto,
  ) {
    const comments = await this.adminTaskService.addComment(
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
  @Get('getClient/:clientId')
  async getClientTasks(@Param('clientId') clientId: string) {
    const tasks = await this.adminTaskService.getTasksByClient(clientId);
    return { message: 'Client tasks fetched', statusCode: 200, data: tasks };
  }

  @UseGuards(AuthGuard)
  @Get('my-tasks')
  async getTasksByRole(@Req() req, @Query('status') status?: string) {
    const user = req.user;

    let statusFilter: TaskStatus[] | undefined;

    if (status) {
      statusFilter = status
        .split(',')
        .map((s) => s.trim())
        .filter((s) =>
          Object.values(TaskStatus).includes(s as TaskStatus),
        ) as TaskStatus[];
    }

    const tasks = await this.adminTaskService.filterMyTasks(user, statusFilter);
    return tasks;
  }

  @Get(':id')
  @UseGuards(AuthGuard)
  async getTask(@Param('id') id: string, @Req() req: any) {
    const task = await this.adminTaskService.getTaskById(
      id,
      req.user.sub,
      req.user.role,
    );
    return { message: 'Task fetched', statusCode: 200, data: task };
  }

  @Patch(':id')
  @UseGuards(AuthGuard)
  async updateTask(
    @Param('id') id: string,
    @Body() dto: UpdateTaskDto,
    @Req() req: any,
  ) {
    const task = await this.adminTaskService.updateTask(id, dto, req.user);
    return { message: 'Task updated', statusCode: 200, data: task };
  }

  @Delete(':taskId/comments/:commentId')
  @UseGuards(AuthGuard)
  async deleteAdminComment(
    @Param('taskId') taskId: string,
    @Param('commentId') commentId: string,
    @Req() req,
  ) {
    console.log('DELETE request received in controller');
    console.log('taskId:', taskId);
    console.log('commentId:', commentId);
    console.log('user role from req:', req.user?.role);

    try {
      const result = await this.adminTaskService.deleteAdminComment(
        taskId,
        commentId, // ✅ ده اللي جاي من Param
        req.user.sub, // ✅ ده adminId
        req.user.role,
      );
      console.log("controller params:", { taskId, commentId });
console.log("controller user:", { adminId: req.user?.id, role: req.user?.role });


      console.log('Service result:', result);
      return result;
    } catch (error) {
      console.error('Error caught in controller:', error);
      throw error;
    }
  }

  @Patch(':id/review')
  @UseGuards(AuthGuard)
  async adminReview(
    @Param('id') id: string,
    @Body() dto: AdminReviewDto,
    @Req() req: any,
  ) {
    if (req.user.role !== UserRoles.ADMIN) {
      throw new ForbiddenException('Only admins can review tasks');
    }
    const task = await this.adminTaskService.adminReviewTask(
      id,
      dto,
      req.user.sub,
    );
    return {
      message: 'Task reviewed',
      statusCode: 200,
      data: task,
    };
  }
}
