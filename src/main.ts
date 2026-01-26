// import { ValidationPipe } from '@nestjs/common';
// import cookieParser from 'cookie-parser';
// import { AppModule } from './app.module';
// import { NestFactory } from '@nestjs/core';
// import { queryParser } from './common/middlewares/qs.middleware';

// async function bootstrap() {
//   const app = await NestFactory.create(AppModule);

//   app.use(cookieParser());

//   app.use(queryParser);

//   app.useGlobalPipes(
//     new ValidationPipe({
//       whitelist: true,
//       forbidNonWhitelisted: true,
//       transform: true,
//     }),
//   );

//   app.enableCors({
//     origin: ['http://localhost:3000', 'https://treva-platform.vercel.app'],
//     credentials: true,
//   });

//   const port = process.env.PORT || 3001;

//   await app.listen(port);
// }
// bootstrap();

import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { NestFactory } from '@nestjs/core';
import { queryParser } from './common/middlewares/qs.middleware';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: ['http://localhost:3000', 'https://treva-platform.vercel.app'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });


  app.use(cookieParser());
  app.use((req, res, next) => {
    if (req.method === 'OPTIONS') return res.sendStatus(204);
    next();
  });

  app.use(queryParser);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const port = process.env.PORT || 3001;
  await app.listen(port);
}
bootstrap();
