import { Module } from '@nestjs/common';
import { ImageController } from './image.controller';
import { CloudService } from './cloudinary';

@Module({
  controllers: [ImageController],
  providers: [CloudService],
  exports: [CloudService],
})
export class ImageModule {}
