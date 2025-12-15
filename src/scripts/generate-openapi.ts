import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { setupSwagger } from '@core/config/doc.config';

async function generateOpenAPI() {
  try {
    console.log('🚀 Bootstrapping NestJS application to generate OpenAPI spec...');

    const app = await NestFactory.create(AppModule, {
      logger: false, // Disable logging during generation
    });

    setupSwagger(app);

    console.log('✅ OpenAPI spec generated successfully!');
    await app.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error generating OpenAPI spec:', error);
    process.exit(1);
  }
}

generateOpenAPI();
