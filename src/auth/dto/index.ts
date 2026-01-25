import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MinLength,
} from 'class-validator';
import { UserRoles } from 'src/common/enum';

export class LoginDto {
  @IsNotEmpty()
  @Matches(/^[0-9]{8,15}$/)
  phoneNumber: string;

  @IsString()
  @MinLength(6)
  password: string;
}

export class CreateUserDto {
  @IsNotEmpty()
  firstName: string;

  @IsNotEmpty()
  lastName: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsOptional()
  title?: string;

  @IsNotEmpty()
  @Matches(/^[0-9]{8,15}$/)
  phoneNumber: string;

  @IsOptional()
  whatsappLink?: string;

  @IsEnum(UserRoles)
  role: UserRoles;
}
