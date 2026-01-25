import { BadRequestException, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Types } from 'mongoose';
import { UserRepo } from 'src/db/user/user.repo';

@Injectable()
@Injectable()
export class TokenService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly userRepo: UserRepo,
  ) {}


async verify(token: string) {
  if (!token) throw new BadRequestException('No token provided');

  const payload: any = this.jwtService.verify(token, {
    secret: process.env.JWT_SECRET,
  });

  if (!payload?.sub) {
    throw new BadRequestException('Invalid token payload');
  }

  const user = await this.userRepo.findOne({
    filter: { _id: new Types.ObjectId(payload.sub) },
    projection: { password: 0 },
  });

  if (!user) throw new BadRequestException('User not found');

  return user;
}


}

