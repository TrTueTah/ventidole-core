import { INestApplication } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { ApiVersion } from "@shared/enum/api-version.enum";
import path from "path";
import fs from "fs";
import yaml from "js-yaml";
import { SwaggerTheme, SwaggerThemeNameEnum } from "swagger-themes";

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

  // 🧩 Tạo tài liệu OpenAPI từ NestJS
  const document = SwaggerModule.createDocument(app, config);

  // 📝 Ghi ra file YAML thay vì JSON
  const outPath = path.resolve(process.cwd(), "openapi.yaml");
  const yamlData = yaml.dump(document);
  fs.writeFileSync(outPath, yamlData, "utf8");

  console.log("✅ OpenAPI spec written to", outPath);

  // 🎨 Swagger UI (tuỳ chọn)
  const theme = new SwaggerTheme();
  const darkTheme = theme.getDefaultConfig(SwaggerThemeNameEnum.CLASSIC);

  SwaggerModule.setup("docs", app, document, {
    customCss: darkTheme.customCss,
  });
}
