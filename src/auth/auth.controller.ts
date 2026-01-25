import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  UseGuards,
  ForbiddenException,
  BadRequestException,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto, CreateUserDto } from './dto';
import { AuthGuard } from 'src/common/guards/auth.guard';
import { UserRoles } from 'src/common/enum';
import type { Response } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { user, accessToken } = await this.authService.login(
      dto.phoneNumber,
      dto.password,
    );
    res.cookie('access_token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000,
    });

    return {
      message: 'logged in successfully',
      statusCode: 200,
      data: user,
    };
  }

  @UseGuards(AuthGuard)
  @Get('me')
  async getMe(@Req() req: any) {
    if (!req.user) {
      throw new UnauthorizedException();
    }

    const user = await this.authService.getMe(req.user.sub);
    return {
      message: 'get me',
      statusCode: 200,
      data: user,
    };
  }

  @UseGuards(AuthGuard)
  @Post('create-user')
  async createUser(@Body() dto: CreateUserDto, @Req() req: any) {
    if (req.user.role !== UserRoles.ADMIN) {
      throw new ForbiddenException('Only admin can create users');
    }

    try {
      const newUser = await this.authService.createUser(dto);
      return {
        message: 'user created successfully',
        statusCode: 201,
        data: newUser,
      };
    } catch (err) {
      if (err instanceof BadRequestException) {
        return {
          message: err.message,
          statusCode: 400,
          error: 'Bad Request',
        };
      }
      throw err;
    }
  }

  @UseGuards(AuthGuard)
  @Post('logout')
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('access_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });

    return {
      message: 'logged out successfully',
      statusCode: 200,
    };
  }
}
