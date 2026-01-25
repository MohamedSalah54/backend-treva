import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UserRepo } from 'src/db/user/user.repo';
import { CreateUserDto } from './dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly userRepo: UserRepo,
    private readonly jwtService: JwtService,
  ) {}

  async login(phoneNumber: string, password: string) {
    const user = await this.userRepo.findByPhoneNumber(phoneNumber);
    if (!user)
      throw new UnauthorizedException('رقم الهاتف او كلمة المرور غير صحيحة');

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      throw new UnauthorizedException('رقم الهاتف او كلمة المرور غير صحيحة');

    const payload = { sub: user._id, role: user.role };
    const token = await this.jwtService.signAsync(payload);

    return { accessToken: token, user };
  }

  async getMe(userId: string) {
    return this.userRepo
      .findOne({ filter: { _id: userId }, projection: { password: 0 } })
      .exec();
  }

  async createUser(dto: CreateUserDto) {
    // const existing = await this.userRepo.findByEmail(dto.email);

    const existing = await this.userRepo.findByPhoneNumber(dto.phoneNumber);
    if (existing) throw new BadRequestException('هذا الرقم موجود بالفعل');

    const hashed = await bcrypt.hash(dto.password, 10);
    return this.userRepo.create({ ...dto, password: hashed });
  }
}
