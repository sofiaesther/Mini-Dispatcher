import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { RealtimeGateway } from './realtime/realtime.gateway';
import { AllExceptionsFilter } from './common/http-exception.filter';
import type { Server } from 'http';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({ origin: true }); // allow frontend (e.g. localhost:3000)
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, transform: true }),
  );
  const port = parseInt(process.env.PORT ?? '3001', 10);
  const httpServer = (await app.listen(port)) as Server;
  const gateway = app.get(RealtimeGateway);
  gateway.attachToServer(httpServer);
  console.log(`HTTP + WebSocket listening on port ${port}`);
}
void bootstrap();
