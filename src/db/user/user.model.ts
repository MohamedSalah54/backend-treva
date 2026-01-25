import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, HydratedDocument, Types } from 'mongoose';
import { MongooseModule } from '@nestjs/mongoose';
import { UserRoles } from 'src/common/enum';

export interface IImage {
  secure_url: string;
  public_id: string;
  folderId?: string;
}
export type TUser = HydratedDocument<User> & Document;

@Schema({
  timestamps: true,
  versionKey: false,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
})
export class User {
  @Prop({ required: true })
  firstName: string;

  @Prop({ required: true })
  lastName: string;

  @Prop()
  title: string;

  @Prop({
    type: String,
    unique: true,
    sparse: true,
    lowercase: true,
  })
  email?: string;

  @Prop({ required: true })
  password: string;

  @Prop({
    required: true,
    enum: UserRoles,
    default: UserRoles.USER,
  })
  role: UserRoles;

  @Prop({ type: { secure_url: String, public_id: String, folderId: String } })
  profileImage?: IImage;

  @Prop({
    type: String,
    required: true,
    unique: true,
    index: true,
    match: /^[0-9]{8,15}$/,
  })
  phoneNumber: string;

  @Prop()
  whatsappLink?: string;

  @Prop({
    type: {
      inProgress: { type: Number, default: 0 },
      completed: { type: Number, default: 0 },
    },
    default: {},
  })
  taskStats?: {
    inProgress: number;
    completed: number;
  };

  @Prop({
    type: [
      {
        title: { type: String, required: true },
        description: { type: String },
        images: [
          {
            secure_url: { type: String, required: true },
            public_id: { type: String, required: true },
            folderId: { type: String },
          },
        ],
      },
    ],
    default: [],
  })
  tasksHistory?: { title: string; description?: string; images: IImage[] }[];

  @Prop({ default: 0 })
  totalTasksRequested?: number;

  @Prop({ type: Types.ObjectId, ref: User.name })
  createdBy?: Types.ObjectId;

  @Prop({ default: true })
  isActive: boolean;
}

export const UserSchema = SchemaFactory.createForClass(User);

export const UserModel = MongooseModule.forFeature([
  { name: User.name, schema: UserSchema },
]);
