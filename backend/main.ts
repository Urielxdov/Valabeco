import "reflect-metadata";

import { NestFactory } from "@nestjs/core";
import { AppModule } from "./src/app.module";
import { ApiResponseInterceptor } from "./src/shared/api-response.interceptor";
import { DomainExceptionFilter } from "./src/shared/domain-exception.filter";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const frontendOrigin = process.env.FRONTEND_ORIGIN ?? "http://localhost:3000";

  app.enableCors({
    origin: frontendOrigin,
    credentials: true,
  });
  app.useGlobalFilters(new DomainExceptionFilter());
  app.useGlobalInterceptors(new ApiResponseInterceptor());

  const port = Number(process.env.BACKEND_PORT ?? 3001);
  await app.listen(port);
}

void bootstrap();
