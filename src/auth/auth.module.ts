import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthGuard } from 'src/common/guards/auth.guard';
import { UserModule } from 'src/user/user.module';
import { TokenService } from 'src/common/services/security/token.service';

@Module({
  imports: [
    UserModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '7d' },
    }),
  ],
  controllers: [AuthController],
  providers: [TokenService, AuthService, AuthGuard],
  exports: [TokenService, AuthGuard],
})
export class AuthModule {}

