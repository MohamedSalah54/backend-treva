import { Module } from '@nestjs/common';
import { GlobalModule } from './global.module';
import { AuthModule } from './auth/auth.module';
import { ImageModule } from './common/services/cloud/image.module';
import { TaskModule } from './tasks/task.module';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    GlobalModule,
    AuthModule,
    ImageModule,
    TaskModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
