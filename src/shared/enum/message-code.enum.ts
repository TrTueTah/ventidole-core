export enum MessageCode {
  ServerStarted = "server_started",
  ServerStartFailed = "server_start_failed",

  RedisConnected = "redis_connected",
  RedisFailedToConnect = "redis_failed_to_connect",
  RedisRetrying = "redis_retrying",
  RedisMaxRetryAttempt = "redis_max_retry_attempt",

  JobProcessing = "job_processing",
  JobCompleted = "job_completed",

  SendMailSuccessfully = "send_mail_successfully",

  CronJobStarted = "cron_job_started",
  CronJobCompleted = "cron_job_completed",
  CronJobFailed = "cron_job_failed",
}
