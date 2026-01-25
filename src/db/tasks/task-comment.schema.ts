import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { IImage } from '../user/user.model';
import { UserRoles } from 'src/common/enum';

// @Schema()
// export class TaskComment {
//   @Prop()
//   _id?: Types.ObjectId; 
//   @Prop({ type: Types.ObjectId, ref: 'User', required: true })
//   userId: Types.ObjectId;

//   @Prop({ required: true, enum: UserRoles })
//   role: UserRoles;

//   @Prop({ default: '' })
//   comment?: string;

//   @Prop({
//     type: [{ secure_url: String, public_id: String, folderId: String }],
//   })
//   images?: IImage[];

//   @Prop({ default: Date.now })
//   createdAt: Date;
// }


@Schema()
export class TaskComment {
  @Prop()
  _id?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  // اختياري لكن مفيد لتجنب populate لو تحب
  @Prop()
  userName?: string;

  @Prop({ required: true, enum: UserRoles })
  role: UserRoles;

  @Prop({ default: '' })
  comment?: string;

  @Prop({
    type: [{ secure_url: String, public_id: String, folderId: String }],
  })
  images?: IImage[];

  @Prop({ default: Date.now })
  createdAt: Date;

  // ====== Soft Delete Fields ======
  @Prop({ default: false })
  isDeleted?: boolean;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  deletedBy?: Types.ObjectId;

  // اختياري
  @Prop()
  deletedByName?: string;

  @Prop()
  deletedAt?: Date;
}
export const TaskCommentSchema = SchemaFactory.createForClass(TaskComment);
