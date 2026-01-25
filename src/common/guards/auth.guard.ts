import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { TokenService } from '../services/security/token.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly tokenService: TokenService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>('public', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) return true;

    const request = context.switchToHttp().getRequest();
    const token = request.cookies['access_token'];

    if (!token) {
      throw new UnauthorizedException('No access token found');
    }

    const user = await this.tokenService.verify(token);

    request.user = {
      sub: user._id.toString(),
      email: user.email,
      role: user.role,
    };
    

    return true;
  }
}
