import fs from 'fs';
import path from 'path';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from '../../src/app.module';
import { ApiVersion } from '@shared/enum/api-version.enum';

async function generate() {
  const app = await NestFactory.create(AppModule, { logger: false });

  // Build a minimal swagger config; if you have a doc.config or use global setup, adjust accordingly
    const config = new DocumentBuilder()
      .setTitle("API Docs")
      .setDescription("Custom Swagger UI in NestJS")
      .setVersion(ApiVersion.V1)
      .addBearerAuth({
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      })
      .build();

  const document = SwaggerModule.createDocument(app, config);
  const outPath = path.resolve(process.cwd(), 'openapi.json');
  fs.writeFileSync(outPath, JSON.stringify(document, null, 2));
  console.log('Wrote', outPath);
  await app.close();
}

generate().catch((err) => {
  console.error(err);
  process.exit(1);
});
