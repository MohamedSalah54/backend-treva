import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ProjectionType, QueryOptions, Types } from 'mongoose';
import { BaseRepo } from 'src/db/base.repo';
import { Task, TTask } from './task.model';
import { TaskStatus } from 'src/common/enum';
import { IImage } from '../user/user.model';

@Injectable()
export class TaskRepo extends BaseRepo<TTask> {
  constructor(
    @InjectModel(Task.name) private readonly taskModel: Model<TTask>,
  ) {
    super(taskModel);
  }

  findByStatus(
    status: TaskStatus,
    projection?: ProjectionType<TTask>,
    options?: QueryOptions,
  ) {
    return this.find({ filter: { status }, projection, options });
  }

  assignTask(taskId: string, userId: string) {
    return this.updateOne({
      filter: { _id: taskId },
      update: { assignedUserId: userId, status: TaskStatus.IN_PROGRESS },
    });
  }

takeTask(taskId: string, userId: string) {
  return this.updateOne({
    filter: {
      _id: new Types.ObjectId(taskId),
      status: TaskStatus.AVAILABLE,
    },
    update: {
      status: TaskStatus.IN_PROGRESS,
      assignedUserId: new Types.ObjectId(userId), 
    },
  });
}

  submitTask(taskId: string, images: any[]) {
    return this.updateOne({
      filter: { _id: taskId },
      update: {
        submission: { images, submittedAt: new Date() },
        status: TaskStatus.UNDER_REVIEW,
      },
    });
  }

reviewTask(
  taskId: string,
  decision: string,
  comment?: string,
  images?: IImage[],
  adminId?: string,
) {
  const adminReviewUpdate = {
    decision,
    comment,
    images,
    reviewedAt: new Date(),
    adminId: new Types.ObjectId(adminId),
  };

  const adminComment = {
    userId: new Types.ObjectId(adminId),
    role: 'admin',
    comment,
    images,
    createdAt: new Date(),
  };

  return this.updateOne({
    filter: { _id: taskId },
    update: {
      adminReview: adminReviewUpdate,
      $push: { comments: adminComment }, // ده يضيفه في مصفوفة الكومنتات
      status:
        decision === 'approved' ? TaskStatus.COMPLETED : TaskStatus.REJECTED,
    },
  });
}

findByIdWithComments(taskId: string) {
  return this.findOne({
    filter: { _id: taskId },
    options: {
      populate: {
        path: 'comments.userId',
        select: 'firstName lastName profileImage role', 
      },
    },
  });
}

}
