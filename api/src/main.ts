import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module.js';
import { setupSwagger } from './swagger.js';
import { TransformInterceptor } from './common/interceptors/transform.interceptor.js';
import { AppExceptionFilter } from './common/filters/app-exception.filter.js';
import { TrimPipe } from './common/pipes/trim.pipe.js';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  app.enableShutdownHooks();
  app.use(cookieParser());
  app.enableCors({
    origin: [config.get<string>('CLIENT_URL'), 'http://localhost:3001'],
    credentials: true,
  });
  app.useGlobalPipes(new TrimPipe());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(app.get(AppExceptionFilter));
  app.useLogger(app.get(Logger));
  app.useGlobalInterceptors(new TransformInterceptor());

  setupSwagger(app);

  await app.listen(config.get<number>('PORT') ?? 3000);
}
await bootstrap();
