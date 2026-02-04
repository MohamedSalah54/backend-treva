import { UserRepo } from '../../db/user/user.repo';
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { SubmitTaskDto } from '../dto';
import { TaskStatus, AdminDecision, UserRoles } from 'src/common/enum';
import { Types } from 'mongoose';
import { TaskRepo } from 'src/db/tasks/task.repo';
import { TTask } from 'src/db/tasks/task.model';

@Injectable()
export class UserTaskService {
  constructor(
    private readonly taskRepo: TaskRepo,
    private readonly userRepo: UserRepo,
  ) {}

  async getUserTimeline(userId: string) {
    if (!userId) {
      console.warn('UserId is undefined! Returning empty timeline.');
      return [];
    }

    const userObjectId = new Types.ObjectId(userId);

    const tasks = await this.taskRepo
      .find({
        filter: {
          $or: [
            { status: TaskStatus.AVAILABLE },
            { assignedUserId: userObjectId },
          ],
        },
        sort: { createdAt: -1 },
      })
      .populate('createdBy')
      .populate('assignedUserId');

    const result = tasks.map((task) => {
      const assignedId =
        task.assignedUserId && task.assignedUserId._id
          ? task.assignedUserId._id
          : task.assignedUserId;

      let userStatus: string;
      if (task.status === TaskStatus.AVAILABLE) {
        userStatus = 'available';
      } else if (assignedId?.equals(userObjectId)) {
        userStatus = 'in_progress_or_other';
      } else {
        userStatus = 'other';
      }

      return {
        ...task.toObject(),
        userStatus,
        userUploadedFiles: task.requestImages?.length > 0 || false,
      };
    });

    return result;
  }

  // async getTaskById(taskId: string, userId?: string, role?: string) {
  //   const task = await this.taskRepo
  //     .findOne({ filter: { _id: taskId } })
  //     .populate('createdBy', 'firstName lastName profileImage')
  //     .populate('comments.userId', 'firstName lastName profileImage');

  //   if (!task) throw new NotFoundException('Task not found');

  //   return task;
  // }

  async getTaskById(taskId: string, userId?: string, role?: string) {
    const task = await this.taskRepo
      .findOne({ filter: { _id: taskId } })
      .populate('createdBy', 'firstName lastName profileImage')
      .populate('assignedUserId', 'firstName lastName profileImage') // <--- مهم
      .populate('comments.userId', 'firstName lastName profileImage');

    if (!task) throw new NotFoundException('Task not found');

    return task;
  }

  async takeTask(taskId: string, userId: string) {
    const user = await this.userRepo.updateOne({
      filter: { _id: userId, 'taskStats.inProgress': { $lt: 1 } },
      update: { $inc: { 'taskStats.inProgress': 1 } },
    });

    if (!user) {
      throw new BadRequestException('You can only take one task at a time');
    }

    const oneHourLater = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    // const oneHourLater = new Date(Date.now() + 5 * 1000); // 5 sec
    const task = await this.taskRepo.updateOne({
      filter: { _id: new Types.ObjectId(taskId), status: TaskStatus.AVAILABLE },
      // update: {
      //   status: TaskStatus.IN_PROGRESS,
      //   assignedUserId: new Types.ObjectId(userId),
      //   expiresAt: oneHourLater,
      // },
      update: {
        status: TaskStatus.IN_PROGRESS,
        assignedUserId: new Types.ObjectId(userId),
        expiresAt: oneHourLater,
        commentsEnabled: false,
      },
    });

    if (!task) {
      await this.userRepo.updateOne({
        filter: { _id: userId },
        update: { $inc: { 'taskStats.inProgress': -1 } },
      });

      throw new BadRequestException(
        'Task is no longer available or already taken',
      );
    }

    return task;
  }

  // async submitTask(taskId: string, dto: SubmitTaskDto, userId: string) {
  //   const task = await this.taskRepo.findOne({
  //     filter: { _id: taskId },
  //   });

  //   if (!task) {
  //     throw new NotFoundException('Task not found');
  //   }

  //   if (!task.assignedUserId || task.assignedUserId.toString() !== userId) {
  //     throw new ForbiddenException('You can only submit your own tasks');
  //   }

  //   if (task.status !== TaskStatus.IN_PROGRESS) {
  //     throw new BadRequestException('Task is not in progress');
  //   }

  //   return this.taskRepo.updateOne({
  //     filter: { _id: taskId },
  //     update: {
  //       submission: {
  //         images: dto.images,
  //         submittedAt: new Date(),
  //       },
  //       status: TaskStatus.UNDER_REVIEW,
  //       $unset: { expiresAt: '' },
  //     },
  //   });
  // }

  async submitTask(
    taskId: string,
    dto: SubmitTaskDto,
    userId: string,
  ): Promise<(TTask & { userHasSubmitted: true }) | null> {
    const task = await this.taskRepo.findOne({ filter: { _id: taskId } });

    if (!task) throw new NotFoundException('Task not found');
    if (!task.assignedUserId || task.assignedUserId.toString() !== userId)
      throw new ForbiddenException('You can only submit your own tasks');
    if (task.status !== TaskStatus.IN_PROGRESS)
      throw new BadRequestException('Task is not in progress');

    const updatedTask = await this.taskRepo.updateOne({
      filter: { _id: taskId },
      update: {
        submission: {
          images: dto.images,
          submittedAt: new Date(),
        },
        status: TaskStatus.UNDER_REVIEW,
        $unset: { expiresAt: '' },
      },
    });

    return {
      ...(updatedTask?.toObject() ?? {}),
      userHasSubmitted: true,
    } as TTask & { userHasSubmitted: true };
  }
}
