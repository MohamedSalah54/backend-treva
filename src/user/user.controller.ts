import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from 'src/common/guards/auth.guard';
import { UpdateUserDto } from './dto';
import { UserService } from './user.service';

@Controller('profile')
export class UserController {
  constructor(private readonly userService: UserService) {}

  
  @UseGuards(AuthGuard)
  @Patch('me')
  async updateProfile(@Req() req: any, @Body() dto: UpdateUserDto) {
    const user = await this.userService.updateUser(req.user.sub, dto);
    return {
      message: 'profile updated successfully',
      statusCode: 200,
      data: user,
    };
  }

  @Get('me')
  @UseGuards(AuthGuard)
  async getProfile(@Req() req: any) {
    const user = await this.userService.getProfile(req.user.sub);
    return {
      message: 'profile fetched successfully',
      statusCode: 200,
      data: user,
    };
  }

  @Get(':id')
  async getPublicProfile(@Param('id') id: string) {
    const user = await this.userService.getPublicProfile(id);
    return {
      message: 'Public profile fetched successfully',
      statusCode: 200,
      data: user,
    };
  }

  @Get(':id/full-profile')
@UseGuards(AuthGuard)
async getFullProfile(@Req() req: any, @Param('id') id: string) {
  const requesterRole = req.user.role;
  const profile = await this.userService.getProfileWithTasks(id, requesterRole);

  return {
    message: 'Profile fetched successfully',
    statusCode: 200,
    data: profile,
  };
}

}
