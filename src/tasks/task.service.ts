// import { UserRepo } from './../db/user/user.repo';
// import {
//   Injectable,
//   NotFoundException,
//   BadRequestException,
//   ForbiddenException,
// } from '@nestjs/common';
// import {
//   CreateTaskDto,
//   SubmitTaskDto,
//   AdminReviewDto,
//   UpdateTaskDto,
//   AddTaskCommentDto,
// } from './dto';
// import { TaskStatus, AdminDecision, UserRoles } from 'src/common/enum';
// import { Types } from 'mongoose';
// import { TaskRepo } from 'src/db/tasks/task.repo';

// @Injectable()
// export class TaskService {
//   constructor(
//     private readonly taskRepo: TaskRepo,
//     private readonly userRepo: UserRepo,
//   ) {}

//   async createTask(dto: CreateTaskDto, clientId: string) {
//     const taskData = {
//       ...dto,
//       status: TaskStatus.AVAILABLE,
//       createdBy: new Types.ObjectId(clientId),
//     };

//     const task = await this.taskRepo.create(taskData);

//     await this.userRepo.updateOne({
//       filter: { _id: clientId },
//       update: {
//         $inc: { totalTasksRequested: 1 },
//         $push: {
//           tasksHistory: {
//             title: dto.title,
//             description: dto.description,
//             images: dto.requestImages || [],
//           },
//         },
//       },
//     });

//     return task;
//   }

//   async addComment(
//     taskId: string,
//     userId: string,
//     role: UserRoles,
//     dto: AddTaskCommentDto,
//   ) {
//     const task = await this.taskRepo.findOne({
//       filter: { _id: taskId },
//     });

//     if (!task) {
//       throw new NotFoundException('Task not found');
//     }

//     const isClientOwner =
//       role === UserRoles.CLIENT && task.createdBy.toString() === userId;

//     const isAdmin = role === UserRoles.ADMIN;

//     if (!isAdmin && !isClientOwner) {
//       throw new ForbiddenException('Not allowed to comment on this task');
//     }

//     task.comments.push({
//       userId: new Types.ObjectId(userId),
//       role,
//       comment: dto.comment,
//       images: dto.images,
//       createdAt: new Date(),
//     });

//     await task.save();

//     return this.taskRepo.findByIdWithComments(taskId);
//   }

//   async getAdminTimeline(options: { statusFilter?: TaskStatus[] }) {
//     let filter: any = {};

//     if (options.statusFilter?.length) {
//       filter.status = { $in: options.statusFilter };
//     }

//     const tasks = await this.taskRepo.find({
//       filter,
//       sort: { createdAt: -1 },
//       populate: [
//         { path: 'assignedUserId', select: 'firstName lastName email' },
//       ],
//     });

//     return tasks.map((task) => ({
//       ...task.toObject(),
//       userStatus:
//         task.status === TaskStatus.AVAILABLE
//           ? 'receive'
//           : task.status === TaskStatus.COMPLETED
//             ? 'complete'
//             : task.status,
//     }));
//   }

//   async getUserTimeline() {
//     const tasks = await this.taskRepo.find({
//       filter: { status: TaskStatus.AVAILABLE },
//       sort: { createdAt: -1 },
//     });

//     return tasks.map((task) => ({
//       ...task.toObject(),
//       userStatus: 'receive',
//     }));
//   }

//   async getTasksByClient(clientId: string) {
//     const filter = { createdBy: new Types.ObjectId(clientId) };
//     const tasks = await this.taskRepo.find({ filter });
//     return tasks;
//   }

//   async getTimelineByClient(clientId: string) {
//     const filter = { createdBy: new Types.ObjectId(clientId) };

//     const tasks = await this.taskRepo.find({
//       filter,
//       sort: { createdAt: -1 },
//       options: {
//         populate: [
//           {
//             path: 'comments.userId',
//             select: 'firstName lastName profileImage role',
//           },
//         ],
//       },
//     });

//     return tasks.map((task) => {
//       let clientStatus = task.status;

//       if (
//         task.status === TaskStatus.AVAILABLE ||
//         task.status === TaskStatus.IN_PROGRESS ||
//         task.status === TaskStatus.UNDER_REVIEW
//       ) {
//         clientStatus = 'receive' as any;
//       }

//       if (task.status === TaskStatus.COMPLETED) {
//         clientStatus = 'complete' as any;
//       }

//       return { ...task.toObject(), clientStatus };
//     });
//   }

//   async getTaskById(taskId: string, userId?: string, role?: string) {
//     const task = await this.taskRepo.findOne({ filter: { _id: taskId } });
//     if (!task) throw new NotFoundException('Task not found');

//     if (role !== UserRoles.ADMIN) {
//       const userStatus =
//         task.status === TaskStatus.AVAILABLE
//           ? 'receive'
//           : task.status === TaskStatus.COMPLETED
//             ? 'complete'
//             : task.status;
//       return { ...task.toObject(), status: userStatus };
//     }

//     return task;
//   }

//   async updateTask(
//     taskId: string,
//     dto: UpdateTaskDto,
//     user: { id: string; role: UserRoles },
//   ) {
//     const task = await this.taskRepo.findOne({ filter: { _id: taskId } });
//     if (!task) throw new NotFoundException('Task not found');

//     if (
//       user.role === UserRoles.CLIENT &&
//       task.createdBy.toString() !== user.id
//     ) {
//       throw new ForbiddenException('Clients can only edit their own tasks');
//     }
//     return this.taskRepo.updateOne({
//       filter: { _id: taskId },
//       update: { $set: dto },
//       options: { new: true },
//     });
//   }

//   async takeTask(taskId: string, userId: string) {
//     const task = await this.taskRepo.takeTask(taskId, userId);

//     if (!task) {
//       throw new BadRequestException(
//         'Task is no longer available or already taken',
//       );
//     }

//     await this.userRepo.updateOne({
//       filter: { _id: userId },
//       update: { $inc: { 'taskStats.inProgress': 1 } },
//     });

//     return task;
//   }

//   async submitTask(taskId: string, dto: SubmitTaskDto, userId: string) {
//     const task = await this.taskRepo.findOne({
//       filter: { _id: taskId },
//     });

//     if (!task) {
//       throw new NotFoundException('Task not found');
//     }

//     if (!task.assignedUserId || task.assignedUserId.toString() !== userId) {
//       throw new ForbiddenException('You can only submit your own tasks');
//     }

//     if (task.status !== TaskStatus.IN_PROGRESS) {
//       throw new BadRequestException('Task is not in progress');
//     }

//     return this.taskRepo.updateOne({
//       filter: { _id: taskId },
//       update: {
//         submission: {
//           images: dto.images,
//           submittedAt: new Date(),
//         },
//         status: TaskStatus.UNDER_REVIEW,
//       },
//     });
//   }

//   async adminReviewTask(taskId: string, dto: AdminReviewDto, adminId: string) {
//     const task = await this.taskRepo.findOne({ filter: { _id: taskId } });
//     if (!task) throw new NotFoundException('Task not found');

//     const review = {
//       decision: dto.decision as AdminDecision,
//       comment: dto.comment,
//       images: dto.images || [],
//       reviewedAt: new Date(),
//       adminId: new Types.ObjectId(adminId),
//     };

//     task.adminReview = review;

//     if (dto.comment) {
//       task.comments.push({
//         userId: new Types.ObjectId(adminId),
//         role: UserRoles.ADMIN,
//         comment: dto.comment,
//         images: dto.images || [],
//         createdAt: new Date(),
//       });
//     }

//     switch (dto.decision) {
//       case AdminDecision.APPROVED:
//         task.status = TaskStatus.COMPLETED;

//         if (task.assignedUserId) {
//           await this.userRepo.updateOne({
//             filter: { _id: task.assignedUserId },
//             update: {
//               $inc: {
//                 'taskStats.inProgress': -1,
//                 'taskStats.completed': 1,
//               },
//               $push: {
//                 tasksHistory: {
//                   taskId: task._id,
//                   title: task.title,
//                   description: task.description,
//                   images: task.requestImages || [],
//                   completedAt: new Date(),
//                 },
//               },
//             },
//           });
//         }

//         break;

//       case AdminDecision.REJECTED:
//         task.status = TaskStatus.AVAILABLE;
//         task.assignedUserId = undefined;
//         break;

//       case AdminDecision.EDIT_REQUESTED:
//         task.status = TaskStatus.UNDER_REVIEW;
//         break;
//     }

//     await task.save();

//     return task;
//   }

//   async getAdminStatistics() {
//     const [topClient] = await this.userRepo.aggregate([
//       {
//         $match: {
//           role: UserRoles.CLIENT,
//         },
//       },
//       {
//         $sort: {
//           totalTasksRequested: -1,
//         },
//       },
//       {
//         $limit: 1,
//       },
//       {
//         $project: {
//           _id: 1,
//           name: 1,
//           email: 1,
//           totalTasksRequested: 1,
//         },
//       },
//     ]);

//     const [topUser] = await this.userRepo.aggregate([
//       {
//         $match: {
//           role: UserRoles.USER,
//         },
//       },
//       {
//         $sort: {
//           'taskStats.completed': -1,
//         },
//       },
//       {
//         $limit: 1,
//       },
//       {
//         $project: {
//           _id: 1,
//           name: 1,
//           email: 1,
//           'taskStats.completed': 1,
//         },
//       },
//     ]);

//     return {
//       topClient,
//       topUser,
//     };
//   }
// }
