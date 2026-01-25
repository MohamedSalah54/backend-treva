import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ProjectionType, QueryOptions } from 'mongoose';
import { BaseRepo } from 'src/db/base.repo';
import { TUser, User } from './user.model';
import { UserRoles } from 'src/common/enum';

@Injectable()
export class UserRepo extends BaseRepo<TUser> {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<TUser>,
  ) {
    super(userModel);
  }

  findByEmail(
    email: string,
    projection?: ProjectionType<TUser>,
    options?: QueryOptions,
  ) {
    return this.findOne({ filter: { email }, projection, options });
  }

  findByPhoneNumber(
    phoneNumber: string,
    projection?: ProjectionType<TUser>,
    options?: QueryOptions,
  ) {
    return this.findOne({ filter: { phoneNumber }, projection, options });
  }
  findByRole(role: UserRoles) {
    return this.find({ filter: { role } });
  }

  incrementUserTasks(userId: string, type: 'inProgress' | 'completed') {
    return this.updateOne({
      filter: { _id: userId },
      update: { $inc: { [`taskStats.${type}`]: 1 } },
    });
  }

  incrementClientTasks(clientId: string) {
    return this.updateOne({
      filter: { _id: clientId },
      update: { $inc: { totalTasksRequested: 1 } },
    });
  }
}
