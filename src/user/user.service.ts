import { Injectable, NotFoundException } from '@nestjs/common';
import { UserRepo } from 'src/db/user/user.repo';
import { UpdateUserDto } from './dto';
import { Types } from 'mongoose';
import { TaskRepo } from 'src/db/tasks/task.repo';

@Injectable()
export class UserService {
  constructor(
    private readonly userRepo: UserRepo,
    private readonly taskRepo: TaskRepo,
  ) {}

  async updateUser(userId: string, dto: UpdateUserDto) {
    // 1️⃣ تحديث باستخدام updateOne
    const result = await this.userRepo.updateOne({
      filter: { _id: userId },
      update: { $set: dto },
      options: { runValidators: true },
    });

    // 2️⃣ جلب المستند بعد التحديث
    const updatedUser = await this.userRepo.findOne({
      filter: { _id: userId },
    });

    return updatedUser;
  }

  // async getProfile(userId: string) {
  //   const user = await this.userRepo.findOne({
  //     filter: { _id: userId },
  //     projection: { password: 0 },
  //   });
  //   if (!user) {
  //     throw new NotFoundException('User not found');
  //   }
  //   return user;
  // }
  async getProfile(userId: string) {
    const user = await this.userRepo.findOne({
      filter: { _id: userId },
      projection: { password: 0 },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const stats = await this.getTaskStats(userId, user.role);

    return {
      ...user.toObject(),
      ...stats,
    };
  }

  // async getPublicProfile(userId: string) {
  //   const user = await this.userRepo.findOne({
  //     filter: { _id: new Types.ObjectId(userId) },
  //     projection: { password: 0, email: 0, phoneNumber: 0 },
  //   });
  //   if (!user) {
  //     throw new NotFoundException('User not found');
  //   }
  //   return user;
  // }

  async getPublicProfile(userId: string) {
    const user = await this.userRepo.findOne({
      filter: { _id: new Types.ObjectId(userId) },
      projection: { password: 0, email: 0, phoneNumber: 0 },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const stats = await this.getTaskStats(user._id.toString(), user.role);

    return {
      ...user.toObject(),
      ...stats,
    };
  }

  private async getTaskStats(userId: string, role: string) {
    if (role === 'client') {
      const totalTasksRequested = await this.taskRepo.count({
        client: userId,
      });

      return { totalTasksRequested };
    }

    if (role === 'user') {
      const [completed, inProgress] = await Promise.all([
        this.taskRepo.count({ assignedTo: userId, status: 'completed' }),
        this.taskRepo.count({ assignedTo: userId, status: 'in_progress' }),
      ]);

      return {
        taskStats: {
          completed,
          inProgress,
        },
      };
    }

    return {};
  }

  async getProfileWithTasks(userId: string, requesterRole: string) {
    const user = await this.userRepo.findOne({
      filter: { _id: userId },
      projection: { password: 0 },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const data: any = {
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      title: user.title,
      role: user.role,
    };

    const isSelf = requesterRole === user.role;

    // =============================
    // 👤 USER DATA
    // =============================
    const attachUserData = () => {
      data.taskStats = user.taskStats || { completed: 0, inProgress: 0 };
      data.tasksHistory = (user.tasksHistory || []).map((t: any) => ({
        _id: t._id,
        title: t.title,
        description: t.description,
      }));
    };

    // =============================
    // 👤 CLIENT DATA
    // =============================
    const attachClientData = async () => {
      const totalTasksRequested = await this.taskRepo.count({
        createdBy: user._id,
      });

      const tasks = await this.taskRepo.find({
        filter: { createdBy: user._id },
      });

      data.totalTasksRequested = totalTasksRequested;
      data.tasksHistory = tasks.map((t) => ({
        _id: t._id,
        title: t.title,
        description: t.description,
        createdAt: t.createdAt,
      }));
    };

    // =============================
    // 🔐 ACCESS RULES
    // =============================

    // ✅ أي حد يشوف نفسه
    if (isSelf) {
      if (user.role === 'user') attachUserData();
      if (user.role === 'client') await attachClientData();
    }

    // ✅ Admin يشوف أي حد
    else if (requesterRole === 'admin') {
      if (user.role === 'user') attachUserData();
      if (user.role === 'client') await attachClientData();
    }

    // ✅ Client يشوف User
    else if (requesterRole === 'client' && user.role === 'user') {
      attachUserData();
    }

    // ✅ User يشوف Client
    else if (requesterRole === 'user' && user.role === 'client') {
      await attachClientData();
    }

    return data;
  }
}
