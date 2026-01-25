// import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
// import { Document, HydratedDocument, Types } from 'mongoose';
// import { IImage } from '../user/user.model';
// import { AdminDecision, TaskStatus } from 'src/common/enum';
// import { TaskComment } from './task-comment.schema';

// export type TTask = HydratedDocument<Task> & Document;
// @Schema({
//   timestamps: true,
//   versionKey: false,
//   toJSON: { virtuals: true },
//   toObject: { virtuals: true },
// })
// export class Task {
//   @Prop({ required: true })
//   title: string;

//   @Prop({ type: Types.ObjectId, ref: 'User', required: true })
//   createdBy: Types.ObjectId;

//   @Prop()
//   description: string;

//   @Prop({ type: [{ secure_url: String, public_id: String, folderId: String }] })
//   requestImages: IImage[];

//   @Prop({ required: true })
//   deadline: Date;

//   @Prop({ required: true, enum: TaskStatus, default: TaskStatus.AVAILABLE })
//   status: TaskStatus;

//   @Prop({ type: Types.ObjectId, ref: 'User' })
//   assignedUserId?: Types.ObjectId;

//   @Prop({ type: Date })
//   expiresAt?: Date;

//   @Prop({
//     type: {
//       images: [{ secure_url: String, public_id: String, folderId: String }],
//       submittedAt: Date,
//     },
//   })
//   submission?: {
//     images: IImage[];
//     submittedAt: Date;
//   };

//   @Prop({ type: [TaskComment], default: [] })
//   comments: TaskComment[];

//   @Prop({ type: Boolean, default: false })
//   isPaid: boolean;

//   @Prop({
//     type: {
//       decision: { type: String, enum: Object.values(AdminDecision) },
//       comment: String,
//       images: [{ secure_url: String, public_id: String, folderId: String }],
//       reviewedAt: Date,
//       adminId: { type: Types.ObjectId, ref: 'User' },
//     },
//   })
//   adminReview?: {
//     decision: AdminDecision;
//     comment?: string;
//     images?: IImage[];
//     reviewedAt: Date;
//     adminId: Types.ObjectId;
//   };
// }

// export const TaskSchema = SchemaFactory.createForClass(Task);

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, HydratedDocument, Types } from 'mongoose';
import { IImage } from '../user/user.model';
import { AdminDecision, TaskStatus } from 'src/common/enum';
import { TaskComment, TaskCommentSchema } from './task-comment.schema';

export type TTask = HydratedDocument<Task> & {
  createdAt: Date;
  updatedAt: Date;
};

@Schema({
  timestamps: true, // timestamps true -> Mongoose يضيف createdAt و updatedAt
  versionKey: false,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
})
export class Task {
  @Prop({ required: true })
  title: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  createdBy: Types.ObjectId;

  @Prop()
  description: string;

  @Prop({ type: [{ secure_url: String, public_id: String, folderId: String }] })
  requestImages: IImage[];

  @Prop({ required: true })
  deadline: Date;

  @Prop({ required: true, enum: TaskStatus, default: TaskStatus.AVAILABLE })
  status: TaskStatus;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  assignedUserId?: Types.ObjectId;

  @Prop({ type: Date })
  expiresAt?: Date;

  @Prop({
    type: {
      images: [{ secure_url: String, public_id: String, folderId: String }],
      submittedAt: Date,
    },
  })
  submission?: {
    images: IImage[];
    submittedAt: Date;
  };

  @Prop({
    type: [TaskCommentSchema],
    default: [],
  })
  comments: TaskComment[];  

  @Prop({ type: Boolean, default: false })
  isPaid: boolean;

  @Prop({
    type: {
      decision: { type: String, enum: Object.values(AdminDecision) },
      comment: String,
      images: [{ secure_url: String, public_id: String, folderId: String }],
      reviewedAt: Date,
      adminId: { type: Types.ObjectId, ref: 'User' },
    },
  })
  adminReview?: {
    decision: AdminDecision;
    comment?: string;
    images?: IImage[];
    reviewedAt: Date;
    adminId: Types.ObjectId;
  };
}

export const TaskSchema = SchemaFactory.createForClass(Task);
