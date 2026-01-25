// src/task/task-scheduler.service.ts
import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { TaskStatus } from 'src/common/enum';
import { TaskRepo } from 'src/db/tasks/task.repo';
import { UserRepo } from 'src/db/user/user.repo';

@Injectable()
export class TaskSchedulerService {
  constructor(
    private readonly taskRepo: TaskRepo,
    private readonly userRepo: UserRepo,
  ) {}

  // Cron job تتنفذ كل دقيقة، للتست ممكن كل 5 ثواني: '*/5 * * * * *'
@Cron('*/5 * * * * *') // كل 5 ثواني للتست
async checkExpiredTasks() {

  const now = new Date();

  const expiredTasks = await this.taskRepo.find({
    filter: {
      status: TaskStatus.IN_PROGRESS,
      expiresAt: { $lt: now },
    },
  });


  for (const task of expiredTasks) {
    await this.taskRepo.updateOne({
      filter: { _id: task._id },
      update: {
        status: TaskStatus.AVAILABLE,
        assignedUserId: null,
        expiresAt: null,
      },
    });

    await this.userRepo.updateOne({
      filter: { _id: task.assignedUserId },
      update: { $inc: { 'taskStats.inProgress': -1 } },
    });

  }
}

}
