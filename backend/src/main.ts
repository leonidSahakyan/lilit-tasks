import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';

import helmet from 'helmet';

import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { JwtAuthGuard } from './auth/jwt-auth.guard';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  app.setGlobalPrefix('api');

  app.use(helmet());

  const allowedOrigins = (process.env.FRONTEND_ORIGIN || '')
    .split(',')
    .map((o) => o.trim());

  app.enableCors({
        origin: [allowedOrigins],
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
        credentials: false,
    });

  app.useGlobalGuards(app.get(JwtAuthGuard));

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const port = configService.get<number>('PORT') || 3000;
  await app.listen(port);
  console.log(`Backend is running on http://localhost:${port}`);
}
bootstrap();
