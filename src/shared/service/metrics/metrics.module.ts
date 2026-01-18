import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';
import { ENVIRONMENT } from '@core/config/env.config';
import { MetricsInterceptor } from '@core/interceptor/metrics.interceptor';
import { metricsProviders } from './metrics.provider';

@Module({
  imports: [
    PrometheusModule.register({
      defaultMetrics: {
        enabled: true,
        config: {
          prefix: 'nestjs_',
        },
      },
      path: '/metrics',
      defaultLabels: {
        app: 'ventidole-core',
        environment: ENVIRONMENT.NODE_ENV,
      },
    }),
  ],
  providers: [
    ...metricsProviders,
    MetricsInterceptor,
    {
      provide: APP_INTERCEPTOR,
      useClass: MetricsInterceptor,
    },
  ],
  exports: [PrometheusModule, ...metricsProviders, MetricsInterceptor],
})
export class MetricsModule {}
