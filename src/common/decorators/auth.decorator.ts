import { applyDecorators, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../guards/auth.guard';
import { RoleGuard } from '../guards/role.guard';
import { Roles } from './role.decorator';


export function Auth(...roles: string[]) {
  return applyDecorators(Roles(roles), UseGuards(AuthGuard, RoleGuard));
}
