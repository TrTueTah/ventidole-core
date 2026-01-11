import { setupSwagger } from '@core/config/doc.config';
import { ENVIRONMENT } from '@core/config/env.config';
import { UnhandledExceptionFilter } from '@core/exception/exception.filter';
import { JwtAuthGuard } from '@core/guard/jwt-auth.guard';
import { HttpLoggerInterceptor } from '@core/interceptor/http-logger.interceptor';
import { CustomValidationPipe } from '@core/pipe/validation.pipe';
import { VersioningType } from '@nestjs/common';
import { NestFactory, Reflector } from '@nestjs/core';
import { getMessage } from '@shared/constant/message.constant';
import { MessageCode } from '@shared/enum/message-code.enum';
import { WinstonLogger } from '@shared/service/logger/winston.logger';
import bodyParser from 'body-parser';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { WinstonModule } from 'nest-winston';
import { AppModule } from './app.module';

async function bootstrap() {
  try {
    const app = await NestFactory.create(AppModule, {
      logger: WinstonModule.createLogger({ instance: WinstonLogger }),
      cors: {
        origin: ENVIRONMENT.CORS,
        credentials: ENVIRONMENT.CORS_CREDENTIALS,
      },
    });

    // Configure Helmet with appropriate settings for HTTP/HTTPS
    app.use(
      helmet({
        contentSecurityPolicy: {
          directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", 'data:', 'https:'],
          },
        },
        crossOriginOpenerPolicy: false, // Disable for non-HTTPS environments
        crossOriginEmbedderPolicy: false, // Disable for non-HTTPS environments
        hsts: false, // Disable HTTP Strict Transport Security for HTTP
        originAgentCluster: false, // Disable Origin-Agent-Cluster header
      }),
    );
    app.use(compression());
    app.use(cookieParser(ENVIRONMENT.COOKIE_SECRET));
    app.use(bodyParser.json({ limit: '1mb' }));
    app.use(bodyParser.urlencoded({ limit: '1mb', extended: true }));

    app.useGlobalPipes(new CustomValidationPipe());
    app.useGlobalFilters(new UnhandledExceptionFilter());
    app.useGlobalInterceptors(new HttpLoggerInterceptor());
    app.useGlobalGuards(new JwtAuthGuard(new Reflector()));
    app.enableVersioning({
      type: VersioningType.URI,
    });

    setupSwagger(app);
    await app.listen(ENVIRONMENT.PORT);
    WinstonLogger.info(getMessage(MessageCode.ServerStarted, ENVIRONMENT.PORT));
  } catch (error) {
    WinstonLogger.error(getMessage(MessageCode.ServerStartFailed, error));
    process.exit();
  }
}

bootstrap();
