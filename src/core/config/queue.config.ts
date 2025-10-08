import { QueueOptions } from "bullmq";
import { ENVIRONMENT } from "./env.config";

export const initQueueConfig = (): QueueOptions => ({
  connection: {
    host: ENVIRONMENT.REDIS_HOST,
    port: ENVIRONMENT.REDIS_PORT,
  },
});
