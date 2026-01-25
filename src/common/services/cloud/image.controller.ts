import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { multerOptions } from 'src/common/utils/multer.utils';
import { CloudService } from './cloudinary';

@Controller('upload')
export class ImageController {
  constructor(private readonly cloudService: CloudService) {}

  @Post('profile')
  @UseInterceptors(FileInterceptor('file', multerOptions(['image/jpeg', 'image/png'])))
  async uploadProfile(@UploadedFile() file: Express.Multer.File) {
    const { public_id, secure_url } = await this.cloudService.uploadFile({
      path: file.path,
      folder: 'profile',
    });
    return { public_id, secure_url };
  }

  @Post('tasks')
  @UseInterceptors(FileInterceptor('file', multerOptions(['image/jpeg', 'image/png'])))
  async uploadCourse(@UploadedFile() file: Express.Multer.File) {
    const { public_id, secure_url } = await this.cloudService.uploadFile({
      path: file.path,
      folder: 'tasks',
    });
    return { public_id, secure_url };
  }
}

