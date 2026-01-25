// import {
//   Controller,
//   Get,
//   Post,
//   Patch,
//   Body,
//   Param,
//   Req,
//   UseGuards,
//   ForbiddenException,
//   Query,
// } from '@nestjs/common';
// import { TaskService } from './task.service';
// import {
//   CreateTaskDto,
//   SubmitTaskDto,
//   AdminReviewDto,
//   UpdateTaskDto,
//   AddTaskCommentDto,
// } from './dto';
// import { AuthGuard } from 'src/common/guards/auth.guard';
// import { TaskStatus, UserRoles } from 'src/common/enum';

// @Controller('task')
// export class TaskController {
//   constructor(private readonly taskService: TaskService) {}

//   @Post()
//   @UseGuards(AuthGuard)
//   async createTask(@Req() req: any, @Body() dto: CreateTaskDto) {
//     if (req.user.role !== UserRoles.CLIENT) {
//       throw new ForbiddenException('Only clients can create tasks');
//     }
//     const task = await this.taskService.createTask(dto, req.user.id);
//     return {
//       message: 'Task created successfully',
//       statusCode: 201,
//       data: task,
//     };
//   }

//   @Post(':id/comments')
//   @UseGuards(AuthGuard)
//   async addComment(
//     @Req() req: any,
//     @Param('id') taskId: string,
//     @Body() dto: AddTaskCommentDto,
//   ) {
//     const comments = await this.taskService.addComment(
//       taskId,
//       req.user.id,
//       req.user.role,
//       dto,
//     );

//     return {
//       message: 'Comment added successfully',
//       statusCode: 201,
//       data: comments,
//     };
//   }

//   @UseGuards(AuthGuard)
//   @Get('timeLine/admin')
//   async getAdminTimeline(@Req() req: any, @Query('status') status?: string) {
//     if (req.user.role !== UserRoles.ADMIN) {
//       throw new ForbiddenException('Admins only');
//     }

//     const statusFilter = status
//       ? (status.split(',') as TaskStatus[])
//       : undefined;

//     const tasks = await this.taskService.getAdminTimeline({
//       statusFilter,
//     });

//     return {
//       message: 'Admin timeline fetched',
//       statusCode: 200,
//       data: tasks,
//     };
//   }

//   @UseGuards(AuthGuard)
//   @Get('timeLine/user')
//   async getUserTimeline(@Req() req: any) {
//     if (req.user.role !== UserRoles.USER) {
//       throw new ForbiddenException('Users only');
//     }

//     const tasks = await this.taskService.getUserTimeline();

//     return {
//       message: 'User timeline fetched',
//       statusCode: 200,
//       data: tasks,
//     };
//   }

//   @UseGuards(AuthGuard)
//   @Get('timeline/client')
//   async getMyTimeline(@Req() req: any) {
//     if (req.user.role !== UserRoles.CLIENT) {
//       throw new ForbiddenException('Only clients can view their timeline');
//     }

//     const tasks = await this.taskService.getTimelineByClient(req.user.id);
//     return { message: 'Client timeline fetched', statusCode: 200, data: tasks };
//   }

//   @UseGuards(AuthGuard)
//   @Get('client/:clientId')
//   async getClientTasks(@Param('clientId') clientId: string) {
//     const tasks = await this.taskService.getTasksByClient(clientId);
//     return { message: 'Client tasks fetched', statusCode: 200, data: tasks };
//   }

//   @Get(':id')
//   @UseGuards(AuthGuard)
//   async getTask(@Param('id') id: string, @Req() req: any) {
//     const task = await this.taskService.getTaskById(
//       id,
//       req.user.id,
//       req.user.role,
//     );
//     return { message: 'Task fetched', statusCode: 200, data: task };
//   }

//   @Patch(':id')
//   @UseGuards(AuthGuard)
//   async updateTask(
//     @Param('id') id: string,
//     @Body() dto: UpdateTaskDto,
//     @Req() req: any,
//   ) {
//     const task = await this.taskService.updateTask(id, dto, req.user);
//     return { message: 'Task updated', statusCode: 200, data: task };
//   }

//   @Patch(':id/take')
//   @UseGuards(AuthGuard)
//   async takeTask(@Param('id') id: string, @Req() req: any) {
//     if (req.user.role !== UserRoles.USER) {
//       throw new ForbiddenException('Only users can take tasks');
//     }

//     const task = await this.taskService.takeTask(id, req.user.id);

//     return {
//       message: 'Task taken successfully',
//       statusCode: 200,
//       data: task,
//     };
//   }

//   @Patch(':id/submit')
//   @UseGuards(AuthGuard)
//   async submitTask(
//     @Param('id') id: string,
//     @Body() dto: SubmitTaskDto,
//     @Req() req: any,
//   ) {
//     if (req.user.role !== UserRoles.USER) {
//       throw new ForbiddenException('Only Users can submit tasks');
//     }

//     const task = await this.taskService.submitTask(id, dto, req.user.id);
//     return { message: 'Task submitted', statusCode: 200, data: task };
//   }

//   @Patch(':id/review')
//   @UseGuards(AuthGuard)
//   async adminReview(
//     @Param('id') id: string,
//     @Body() dto: AdminReviewDto,
//     @Req() req: any,
//   ) {
//     if (req.user.role !== UserRoles.ADMIN) {
//       throw new ForbiddenException('Only admins can review tasks');
//     }
//     const task = await this.taskService.adminReviewTask(id, dto, req.user.id);
//     return {
//       message: 'Task reviewed',
//       statusCode: 200,
//       data: task,
//     };
//   }

//   @Get('admin/statistics')
//   @UseGuards(AuthGuard)
//   async getAdminStatistics(@Req() req: any) {
//     if (req.user.role !== UserRoles.ADMIN) {
//       throw new ForbiddenException('Admins only');
//     }

//     const stats = await this.taskService.getAdminStatistics();

//     return {
//       message: 'Admin statistics fetched successfully',
//       statusCode: 200,
//       data: stats,
//     };
//   }
// }
