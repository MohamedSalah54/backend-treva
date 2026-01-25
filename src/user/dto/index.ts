import { IsOptional, IsString, Matches } from 'class-validator';
import type { IImage } from 'src/db/user/user.model';

export class UpdateUserDto {
  @IsOptional()
  profileImage: IImage;

  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @Matches(/^[0-9]{8,15}$/)
  phoneNumber?: string;

  @IsOptional()
  @IsString()
  whatsappLink?: string;
}
