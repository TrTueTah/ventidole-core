import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Counter, Histogram } from 'prom-client';
import { InjectMetric } from '@willsoto/nestjs-prometheus';

@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  constructor(
    @InjectMetric('http_request_total')
    public readonly httpRequestCounter: Counter<string>,
    @InjectMetric('http_request_duration_seconds')
    public readonly httpRequestDuration: Histogram<string>,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    const { method, route, baseUrl, path: reqPath } = request;
    const path = route?.path || baseUrl || reqPath || 'unknown';

    // Skip metrics endpoint to avoid recursion
    if (reqPath === '/metrics') {
      return next.handle();
    }

    console.log(`[MetricsInterceptor] ${method} ${path}`);
    const start = Date.now();

    return next.handle().pipe(
      tap(() => {
        console.log(`[MetricsInterceptor] SUCCESS ${method} ${path}`);
        const duration = (Date.now() - start) / 1000;
        const statusCode = context.switchToHttp().getResponse().statusCode;

        this.httpRequestCounter.inc({
          method,
          path,
          status_code: String(statusCode),
          version: 'v1',
        });

        this.httpRequestDuration.observe(
          { method, path, status_code: String(statusCode) },
          duration,
        );
      }),
      catchError((error) => {
        console.log(`[MetricsInterceptor] ERROR ${method} ${path}`, error?.status);
        const duration = (Date.now() - start) / 1000;
        const statusCode = error.status || error.statusCode || 500;

        this.httpRequestCounter.inc({
          method,
          path,
          status_code: String(statusCode),
          version: 'v1',
        });

        this.httpRequestDuration.observe(
          { method, path, status_code: String(statusCode) },
          duration,
        );

        return throwError(() => error);
      }),
    );
  }
}
