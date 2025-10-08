import { MessageCode } from "@shared/enum/message-code.enum";
import chalk from "chalk";

const redisColorized = `[${chalk.bold.red("REDIS")}]`;

const Message: Record<MessageCode, string | ((...param: unknown[]) => string)> = {
  [MessageCode.ServerStarted]: (port: number) => `✅ Server ready at http://localhost:${port}`,
  [MessageCode.ServerStartFailed]: (error) => `❌ Error while starting server, ${error}`,

  [MessageCode.RedisConnected]: `${redisColorized} Connected`,
  [MessageCode.RedisFailedToConnect]: (msg: string) => `${redisColorized} Failed to connect: ${msg}`,
  [MessageCode.RedisRetrying]: (times: number, delay: number) =>
    `${redisColorized} Connection retry, attempt ${times}, waiting for ${delay}ms`,
  [MessageCode.RedisMaxRetryAttempt]: `${redisColorized} Stopping reconnection attempts. Max retry duration reached`,

  [MessageCode.JobProcessing]: (jobId: string, jobName: string) => `Processing job [${jobName}] id: ${jobId}`,
  [MessageCode.JobCompleted]: (jobId: string, jobName: string) => `Complete job [${jobName}] id: ${jobId}`,

  [MessageCode.SendMailSuccessfully]: (payload: string) =>
    `Email sent successfully to recipients with the following parameters: ${payload}`,

  [MessageCode.CronJobStarted]: (jobName: string, startedAt: string) => `Job [${jobName}] started at ${startedAt}`,
  [MessageCode.CronJobCompleted]: (jobName: string, completedAt: string) =>
    `Job [${jobName}] completed at ${completedAt}`,
  [MessageCode.CronJobFailed]: (jobName: string, failedAt: string) => `Job [${jobName}] failed at ${failedAt}`,
} as const;

export function getMessage(code: MessageCode, ...param: unknown[]): string {
  const message = Message[code];
  return typeof message === "function" ? message(...param) : message;
}