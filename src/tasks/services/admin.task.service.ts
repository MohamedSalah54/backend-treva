import { UserRepo } from '../../db/user/user.repo';
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { AdminReviewDto, UpdateTaskDto, AddTaskCommentDto } from '../dto';
import { TaskStatus, AdminDecision, UserRoles } from 'src/common/enum';
import { Types } from 'mongoose';
import { TaskRepo } from 'src/db/tasks/task.repo';

@Injectable()
export class AdminTaskService {
  constructor(
    private readonly taskRepo: TaskRepo,
    private readonly userRepo: UserRepo,
  ) {}

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

    const isClientOwner =
      role === UserRoles.CLIENT && task.createdBy.toString() === userId;

    const isAdmin = role === UserRoles.ADMIN;

    if (!isAdmin && !isClientOwner) {
      throw new ForbiddenException('Not allowed to comment on this task');
    }
    const user = await this.userRepo.findOne({
      filter: { _id: userId },
      projection: { firstName: 1, lastName: 1 },
    });

    task.comments.push({
      _id: new Types.ObjectId(),
      userId: new Types.ObjectId(userId),
      userName: user ? `${user.firstName} ${user.lastName}` : undefined,
      role,
      comment: dto.comment,
      images: dto.images,
      createdAt: new Date(),
      isDeleted: false, // ✅
    });

    await task.save();

    return this.taskRepo.findByIdWithComments(taskId);
  }
async deleteAdminComment(
  taskId: string,
  commentId: string,
  adminId: string,
  userRole: UserRoles,
) {
  console.log("🔥 SERVICE deleteAdminComment HIT");
  console.log({ taskId, commentId, adminId, userRole });

  if (userRole !== UserRoles.ADMIN) {
    throw new ForbiddenException('Only admin can delete comments');
  }

  const task = await this.taskRepo.findOne({ filter: { _id: taskId } });
  console.log("🧾 Task Found:", !!task);

  if (!task) throw new NotFoundException('Task not found');

  const comment = task.comments.find(
    (c) => c._id?.toString() === commentId,
  );

  console.log("💬 Comment Found:", !!comment);

  if (!comment) throw new NotFoundException('Comment not found');

  console.log("🗑 Before delete -> isDeleted:", comment.isDeleted);

  if (comment.isDeleted) {
    console.log("⚠ Already deleted - returning task");
    return this.taskRepo.findByIdWithComments(taskId);
  }

  comment.isDeleted = true;
  comment.deletedAt = new Date();
  comment.deletedBy = new Types.ObjectId(adminId);

  comment.comment = '';
  comment.images = [];

  await task.save();

  console.log("✅ Comment soft-deleted, returning updated task");

  return this.taskRepo.findByIdWithComments(taskId);
}


  async getAdminTimeline(options: { statusFilter?: TaskStatus[] }) {
    let filter: any = {};

    if (options.statusFilter?.length) {
      filter.status = { $in: options.statusFilter };
    }

    const tasks = await this.taskRepo.find({
      filter,
      sort: { createdAt: -1 },
      populate: [
        {
          path: 'assignedUserId',
          select: 'firstName lastName email',
        },
        {
          path: 'createdBy',
          select: 'firstName lastName  profileImage',
        },
      ],
    });

    return tasks.map((task) => ({
      ...task.toObject(),
      userStatus:
        task.status === TaskStatus.AVAILABLE
          ? 'receive'
          : task.status === TaskStatus.COMPLETED
            ? 'complete'
            : task.status,
    }));
  }

  async getTasksByClient(clientId: string) {
    const filter = { createdBy: new Types.ObjectId(clientId) };
    const tasks = await this.taskRepo.find({ filter });
    return tasks;
  }

  async getTaskById(taskId: string, userId?: string, role?: string) {
    const task = await this.taskRepo.findOne({ filter: { _id: taskId } });
    if (!task) throw new NotFoundException('Task not found');

    if (role !== UserRoles.ADMIN) {
      const userStatus =
        task.status === TaskStatus.AVAILABLE
          ? 'receive'
          : task.status === TaskStatus.COMPLETED
            ? 'complete'
            : task.status;
      return { ...task.toObject(), status: userStatus };
    }

    return task;
  }

  async updateTask(
    taskId: string,
    dto: UpdateTaskDto,
    user: { id: string; role: UserRoles },
  ) {
    const task = await this.taskRepo.findOne({ filter: { _id: taskId } });
    if (!task) throw new NotFoundException('Task not found');

    if (
      user.role === UserRoles.CLIENT &&
      task.createdBy.toString() !== user.id
    ) {
      throw new ForbiddenException('Clients can only edit their own tasks');
    }

    const updates: any = { ...dto };

    // ===== تعديل تلقائي لو الحالة تغيرت لـ "available"
    if (dto.status === 'available') {
      // 1️⃣ شيل assignedUserId
      updates.assignedUserId = null;

      updates.adminReview = {
        decision: AdminDecision.UNDER_REVIEW,
        reviewedAt: new Date(),
      };

      if (task.assignedUserId) {
        const statsUpdate: any = {};
        if (task.status === 'in_progress') {
          statsUpdate.inProgress = { $inc: -1 };
        }
        if (task.status === 'completed') {
          statsUpdate.completed = { $inc: -1 };
        }
        if (Object.keys(statsUpdate).length > 0) {
          await this.userRepo.updateOne({
            filter: { _id: task.assignedUserId },
            update: statsUpdate,
          });
        }
      }
    }

    return this.taskRepo.updateOne({
      filter: { _id: taskId },
      update: { $set: updates },
      options: { new: true },
    });
  }

  async adminReviewTask(taskId: string, dto: AdminReviewDto, adminId: string) {
    const task = await this.taskRepo.findOne({ filter: { _id: taskId } });
    if (!task) throw new NotFoundException('Task not found');

    const review = {
      decision: dto.decision as AdminDecision,
      comment: dto.comment,
      images: dto.images || [],
      reviewedAt: new Date(),
      adminId: new Types.ObjectId(adminId),
    };

    task.adminReview = review;

    if (dto.comment) {
      task.comments.push({
        userId: new Types.ObjectId(adminId),
        role: UserRoles.ADMIN,
        comment: dto.comment,
        images: dto.images || [],
        createdAt: new Date(),
      });
    }

    switch (dto.decision) {
      case AdminDecision.APPROVED:
        task.status = TaskStatus.COMPLETED;

        if (task.assignedUserId) {
          await this.userRepo.updateOne({
            filter: { _id: task.assignedUserId },
            update: {
              $inc: {
                'taskStats.inProgress': -1,
                'taskStats.completed': 1,
              },
              $push: {
                tasksHistory: {
                  taskId: task._id,
                  title: task.title,
                  description: task.description,
                  images: task.requestImages || [],
                  completedAt: new Date(),
                },
              },
            },
          });
        }

        break;
      case AdminDecision.REJECTED:
        task.status = TaskStatus.AVAILABLE;

        if (task.assignedUserId) {
          await this.userRepo.updateOne({
            filter: { _id: task.assignedUserId },
            update: {
              $inc: {
                'taskStats.inProgress': -1,
              },
            },
          });
        }

        task.assignedUserId = undefined;
        task.submission = undefined;
        task.adminReview = undefined;

        break;

      case AdminDecision.EDIT_REQUESTED:
        task.status = TaskStatus.IN_PROGRESS;
        task.submission = undefined;

        break;
    }

    await task.save();

    return task;
  }

  // async getAdminStatistics() {
  //   const [topClient] = await this.userRepo.aggregate([
  //     {
  //       $match: {
  //         role: UserRoles.CLIENT,
  //       },
  //     },
  //     {
  //       $sort: {
  //         totalTasksRequested: -1,
  //       },
  //     },
  //     {
  //       $limit: 1,
  //     },
  //     {
  //       $project: {
  //         _id: 1,
  //         name: 1,
  //         email: 1,
  //         totalTasksRequested: 1,
  //       },
  //     },
  //   ]);

  //   const [topUser] = await this.userRepo.aggregate([
  //     {
  //       $match: {
  //         role: UserRoles.USER,
  //       },
  //     },
  //     {
  //       $sort: {
  //         'taskStats.completed': -1,
  //       },
  //     },
  //     {
  //       $limit: 1,
  //     },
  //     {
  //       $project: {
  //         _id: 1,
  //         name: 1,
  //         email: 1,
  //         'taskStats.completed': 1,
  //       },
  //     },
  //   ]);

  //   return {
  //     topClient,
  //     topUser,
  //   };
  // }

  async getAdminStatistics() {
    /* ================= TASK COUNTS ================= */
    const [totalTasks, completedTasks, inProgressTasks, rejectedTasks] =
      await Promise.all([
        this.taskRepo.count(),
        this.taskRepo.count({ status: TaskStatus.COMPLETED }),
        this.taskRepo.count({ status: TaskStatus.IN_PROGRESS }),
        this.taskRepo.count({ status: TaskStatus.REJECTED }),
      ]);

    /* ================= TOP CLIENT ================= */
    const [topClient] = await this.userRepo.find({
      filter: { role: UserRoles.CLIENT } as any,
      sort: { totalTasksRequested: -1 },
      projection: { firstName: 1, lastName: 1, totalTasksRequested: 1 },
      limit: 1,
    });

    /* ================= TOP USER ================= */
    const [topUser] = await this.userRepo.find({
      filter: { role: UserRoles.USER } as any,
      sort: { 'taskStats.completed': -1 },
      projection: { firstName: 1, lastName: 1, taskStats: 1 },
      limit: 1,
    });

    return {
      tasksStats: {
        total: totalTasks,
        completed: completedTasks,
        inProgress: inProgressTasks,
        rejected: rejectedTasks,
      },

      topClient: topClient
        ? {
            id: topClient._id,
            name: `${topClient.firstName} ${topClient.lastName}`,
            totalTasksRequested: topClient.totalTasksRequested,
          }
        : null,

      topUser: topUser
        ? {
            id: topUser._id,
            name: `${topUser.firstName} ${topUser.lastName}`,
            completedTasks: topUser.taskStats?.completed || 0,
          }
        : null,
    };
  }

  async filterMyTasks(
    user: { sub: string; role: UserRoles },
    statusFilter?: TaskStatus[],
  ) {
    let filter: any = {};

    if (statusFilter && statusFilter.length > 0) {
      filter.status = { $in: statusFilter };
    }

    if (user.role === UserRoles.CLIENT) {
      // العميل يشوف مهامه فقط
      filter.createdBy = new Types.ObjectId(user.sub);
    }

    const tasks = await this.taskRepo.find({
      filter,
      sort: { createdAt: -1 },
      populate: [
        { path: 'assignedUserId', select: 'firstName lastName email' },
        { path: 'createdBy', select: 'firstName lastName profileImage' },
      ],
    });

    return tasks.map((task) => {
      let userStatus: string;
      if (task.status === TaskStatus.AVAILABLE) userStatus = 'receive';
      else if (task.status === TaskStatus.COMPLETED) userStatus = 'complete';
      else userStatus = task.status;

      return { ...task.toObject(), userStatus };
    });
  }
}
