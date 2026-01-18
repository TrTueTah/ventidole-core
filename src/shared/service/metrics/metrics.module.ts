import { Module } from '@nestjs/common';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';
import { ENVIRONMENT } from '@core/config/env.config';
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
  providers: [...metricsProviders],
  exports: [PrometheusModule, ...metricsProviders],
})
export class MetricsModule {}
