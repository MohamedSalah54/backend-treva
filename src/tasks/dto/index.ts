import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { AdminDecision, TaskStatus } from 'src/common/enum';
import { IImage } from 'src/db/user/user.model';

export class CreateTaskDto {
  @IsNotEmpty()
  title: string;

  @IsOptional()
  description?: string;

  @IsArray()
  requestImages: IImage[];

  @IsDateString()
  deadline: Date;
}

export class AddTaskCommentDto {
  @IsOptional()
  @IsString()
  comment?: string;

  @IsOptional()
  images?: IImage[];
}

export class UpdateTaskDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  requestImages?: IImage[];

  @IsOptional()
  @IsDateString()
  deadline?: Date;

  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  @IsOptional()
  @IsBoolean()
  isPaid?: boolean;
}

// export class SubmitTaskDto {
//   @IsArray()
//   images: IImage[];
// }

export class SubmitTaskDto {
  @IsArray()
  images: {
    original: {
      secure_url: string;
      public_id: string;
    };
    preview: {
      secure_url: string;
    };
  }[];
}

export class AdminReviewDto {
  @IsEnum(AdminDecision)
  decision: string;

  @IsOptional()
  comment?: string;

  @IsArray()
  @IsOptional()
  images?: IImage[];
}

export class SetClientReviewDto {
  @IsIn(["yes", "no"])
  clientReview: "yes" | "no";
}