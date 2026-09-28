import { NestFactory } from "@nestjs/core";
import { WorkerModule } from "./worker.module.js";
import { Logger } from 'nestjs-pino';

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(WorkerModule, { bufferLogs: true });
    
    app.useLogger(app.get(Logger));
    app.enableShutdownHooks();
}

await bootstrap();