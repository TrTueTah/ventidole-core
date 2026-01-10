import { initEnvironmentConfig } from '@core/config/env.config';
import { EventModule } from '@core/event/event.module';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot(initEnvironmentConfig()),
    EventModule, // Global event bus for domain events
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
