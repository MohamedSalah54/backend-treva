import { UserRepo } from '../../db/user/user.repo';
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { CreateTaskDto, UpdateTaskDto, AddTaskCommentDto } from '../dto';
import { TaskStatus, AdminDecision, UserRoles } from 'src/common/enum';
import { HydratedDocument, Types } from 'mongoose';
import { TaskRepo } from 'src/db/tasks/task.repo';
import { Task } from 'src/db/tasks/task.model';

@Injectable()
export class ClientTaskService {
  constructor(
    private readonly taskRepo: TaskRepo,
    private readonly userRepo: UserRepo,
  ) {}

  async createTask(dto: CreateTaskDto, clientId: string) {
    const taskData = {
      ...dto,
      status: TaskStatus.AVAILABLE,
      createdBy: new Types.ObjectId(clientId),
    };

    const task = await this.taskRepo.create(taskData);

    await this.userRepo.updateOne({
      filter: { _id: clientId },
      update: {
        $inc: { totalTasksRequested: 1 },
        $push: {
          tasksHistory: {
            title: dto.title,
            description: dto.description,
            images: dto.requestImages || [],
          },
        },
      },
    });

    return task;
  }

  async addComment(
    taskId: string,
    userId: string,
    role: UserRoles,
    dto: AddTaskCommentDto,
  ) {
    const task = await this.taskRepo.findOne({
      filter: { _id: taskId },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    const isAdmin = role === UserRoles.ADMIN;
    const isClientOwner = task.createdBy.toString() === userId;

    if (role === UserRoles.CLIENT) {
      if (!isClientOwner) {
        throw new ForbiddenException('Not allowed to comment on this task');
      }

      if (task.status === TaskStatus.COMPLETED) {
        throw new BadRequestException(
          'Comments are closed for completed tasks',
        );
      }
    }

    if (!isAdmin && !isClientOwner) {
      throw new ForbiddenException('Not allowed to comment on this task');
    }

    if (
      (!dto.comment || dto.comment.trim() === '') &&
      (!dto.images || dto.images.length === 0)
    ) {
      throw new BadRequestException('Cannot post an empty comment');
    }

    task.comments.push({
      _id: new Types.ObjectId(),
      userId: new Types.ObjectId(userId),
      role,
      comment: dto.comment,
      images: dto.images,
      createdAt: new Date(),
    });

    await task.save();

    return this.taskRepo.findByIdWithComments(taskId);
  }

  async getTimelineByClient(clientId: string) {
    const filter = { createdBy: new Types.ObjectId(clientId) };

    const tasks = await this.taskRepo.find({
      filter,
      sort: { createdAt: -1 },
      options: {
        populate: [
          {
            path: 'comments.userId',
            select: 'firstName lastName profileImage role',
          },
          {
            path: 'createdBy',
            select: 'firstName lastName profileImage',
          },
        ],
      },
    });

    const mappedTasks = tasks.map((task) => {
      let clientStatus = task.status;

      if (
        task.status === TaskStatus.AVAILABLE ||
        task.status === TaskStatus.IN_PROGRESS ||
        task.status === TaskStatus.UNDER_REVIEW
      ) {
        clientStatus = 'receive' as any;
      }

      if (task.status === TaskStatus.COMPLETED) {
        clientStatus = 'complete' as any;
      }

      return { ...task.toObject(), clientStatus };
    });

    return mappedTasks;
  }

  async getTaskById(
    taskId: string,
    userId: string,
    role: string,
  ): Promise<HydratedDocument<Task>> {
    let taskObjectId: Types.ObjectId;
    let userObjectId: Types.ObjectId;

    try {
      taskObjectId = new Types.ObjectId(taskId);
      userObjectId = new Types.ObjectId(userId);
    } catch {
      throw new ForbiddenException('Invalid task ID');
    }

    const filter: any = { _id: taskObjectId };
    if (role === UserRoles.CLIENT) filter.createdBy = userObjectId;

    const task = await this.taskRepo
      .findOne({ filter })
      .populate({
        path: 'createdBy',
        select: 'firstName lastName profileImage',
      })
      .populate({
        path: 'comments.userId',
        select: 'firstName lastName profileImage',
      });

    if (!task) {
      throw new ForbiddenException('Task not found');
    }

    return task;
  }

  // async updateTaskStatus(
  //   taskId: string,
  //   dto: UpdateTaskDto,
  //   user: { sub: string; role: UserRoles },
  // ) {
  //   const task = await this.taskRepo.findOne({ filter: { _id: taskId } });
  //   if (!task) throw new NotFoundException('Task not found');

  //   if (
  //     user.role === UserRoles.CLIENT &&
  //     task.createdBy.toString() !== user.sub
  //   ) {
  //     throw new ForbiddenException('Clients can only edit their own tasks');
  //   }

  //   const updateData =
  //     user.role === UserRoles.CLIENT ? { status: dto.status } : dto;

  //   return this.taskRepo.updateOne({
  //     filter: { _id: taskId },
  //     update: { $set: updateData },
  //     options: { new: true },
  //   });
  // }
  async updateTaskStatus(
    taskId: string,
    dto: UpdateTaskDto,
    user: { sub: string; role: UserRoles },
  ) {
    const task = await this.taskRepo.findOne({ filter: { _id: taskId } });
    if (!task) throw new NotFoundException('Task not found');

    if (
      user.role === UserRoles.CLIENT &&
      task.createdBy.toString() !== user.sub
    ) {
      throw new ForbiddenException('Clients can only edit their own tasks');
    }

    if (user.role === UserRoles.CLIENT) {
      const next = dto.status as TaskStatus;

      const allowed: TaskStatus[] = [
        TaskStatus.AVAILABLE,
        TaskStatus.IN_PROGRESS,
        TaskStatus.UNDER_REVIEW,
        TaskStatus.COMPLETED,
      ];
      if (!allowed.includes(next)) {
        throw new BadRequestException('Invalid status');
      }

      const isBackFromCompleted =
        task.status === TaskStatus.COMPLETED &&
        (next === TaskStatus.UNDER_REVIEW ||
          next === TaskStatus.IN_PROGRESS ||
          next === TaskStatus.AVAILABLE);

      const finalStatus = isBackFromCompleted ? TaskStatus.AVAILABLE : next;

      const update: any = { status: finalStatus };

      if (finalStatus === TaskStatus.AVAILABLE) {
        update.submission = null;
        update.adminReview = null;
        update.assignedUserId = null;
      }

      return this.taskRepo.updateOne({
        filter: { _id: taskId },
        update: { $set: update },
        options: { new: true },
      });
    }

    return this.taskRepo.updateOne({
      filter: { _id: taskId },
      update: { $set: dto },
      options: { new: true },
    });
  }

  async setClientReview(taskId: string, userId: string, role: UserRoles, clientReview: "yes" | "no") {
  const task = await this.taskRepo.findOne({ filter: { _id: taskId } });
  if (!task) throw new NotFoundException("Task not found");

  const isClientOwner = task.createdBy.toString() === userId;

  if (role !== UserRoles.CLIENT || !isClientOwner) {
    throw new ForbiddenException("Not allowed");
  }

  const updated = await this.taskRepo.updateOne({
    filter: { _id: new Types.ObjectId(taskId) },
    update: { clientReview },
  });

  return updated;
}

async canDownload(taskId: string, userId: string, role: UserRoles) {
  const task = await this.taskRepo.findOne({ filter: { _id: taskId } });
  if (!task) throw new NotFoundException("Task not found");

  const isAdmin = role === UserRoles.ADMIN;
  const isClientOwner = task.createdBy.toString() === userId;

  if (!isAdmin && !isClientOwner) {
    throw new ForbiddenException("Not allowed");
  }

  if (role === UserRoles.CLIENT && task.clientReview !== "yes") {
    throw new BadRequestException("Approve result first");
  }

  if (!task.isPaid) {
    throw new BadRequestException("Pay first");
  }

  return { ok: true, images: task.submission?.images ?? [] };
}
}
