import {
  makeCounterProvider,
  makeHistogramProvider,
} from '@willsoto/nestjs-prometheus';

export const metricsProviders = [
  // HTTP Metrics
  makeCounterProvider({
    name: 'http_request_total',
    help: 'Total HTTP requests',
    labelNames: ['method', 'path', 'status_code', 'version'],
  }),
  makeHistogramProvider({
    name: 'http_request_duration_seconds',
    help: 'HTTP request duration',
    labelNames: ['method', 'path', 'status_code'],
    buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
  }),

  // Database Metrics
  makeCounterProvider({
    name: 'prisma_query_total',
    help: 'Total Prisma queries',
    labelNames: ['operation', 'model'],
  }),
  makeHistogramProvider({
    name: 'prisma_query_duration_seconds',
    help: 'Prisma query duration',
    labelNames: ['operation', 'model'],
    buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 5],
  }),

  // Queue Metrics
  makeCounterProvider({
    name: 'bullmq_jobs_total',
    help: 'Total BullMQ jobs',
    labelNames: ['queue_name', 'status'],
  }),
  makeHistogramProvider({
    name: 'bullmq_job_duration_seconds',
    help: 'BullMQ job duration',
    labelNames: ['queue_name'],
    buckets: [0.1, 0.5, 1, 2, 5, 10, 30, 60],
  }),

  // Business Metrics
  makeCounterProvider({
    name: 'user_registrations_total',
    help: 'Total user registrations',
    labelNames: ['status'],
  }),
  makeCounterProvider({
    name: 'orders_total',
    help: 'Total orders',
    labelNames: ['status', 'payment_method'],
  }),
];
