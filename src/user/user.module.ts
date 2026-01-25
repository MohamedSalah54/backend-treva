import { forwardRef, Module } from '@nestjs/common';
import { UserModel } from 'src/db/user/user.model';
import { UserRepo } from 'src/db/user/user.repo';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { AuthModule } from 'src/auth/auth.module';
import { TaskModule } from 'src/tasks/task.module';

@Module({
 imports: [
    UserModel,
    forwardRef(() => AuthModule),
    forwardRef(() => TaskModule), // ✅ circular
  ],
  controllers: [UserController],
  providers: [UserRepo, UserService],
  exports: [UserRepo, UserService],
})
export class UserModule {}
