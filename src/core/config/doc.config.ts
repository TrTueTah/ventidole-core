import { INestApplication } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { ApiVersion } from "@shared/enum/api-version.enum";
import path from "path";
import { SwaggerTheme, SwaggerThemeNameEnum } from "swagger-themes";
import fs from 'fs';

export function setupSwagger(app: INestApplication) {
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

  const theme = new SwaggerTheme();
  const darkTheme = theme.getDefaultConfig(SwaggerThemeNameEnum.CLASSIC);

  SwaggerModule.setup("docs", app, document, {
    customCss: darkTheme.customCss,
  });
}
