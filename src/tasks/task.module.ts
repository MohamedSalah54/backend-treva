import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UserModule } from 'src/user/user.module';
import { AuthModule } from 'src/auth/auth.module';
import { TaskRepo } from 'src/db/tasks/task.repo';
import { Task, TaskSchema } from 'src/db/tasks/task.model';
import { UserTaskController } from './controllers/user.task.controller';
import { ClientTaskController } from './controllers/client.task.controller';
import { AdminTaskController } from './controllers/admin.task.controller';
import { UserTaskService } from './services/user.task.service';
import { ClientTaskService } from './services/client.task.service';
import { AdminTaskService } from './services/admin.task.service';
import { TaskSchedulerService } from './services/task-scheduler.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Task.name, schema: TaskSchema }]),
      forwardRef(() => AuthModule),
    forwardRef(() => UserModule), // ✅ circular
  ],
  providers: [UserTaskService, ClientTaskService, AdminTaskService, TaskRepo, TaskSchedulerService],
  controllers: [UserTaskController, ClientTaskController, AdminTaskController],
  exports: [UserTaskService, ClientTaskService, AdminTaskService, TaskRepo, TaskSchedulerService],
})
export class TaskModule {}
