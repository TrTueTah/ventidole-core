import { Knock } from '@knocklabs/node';
import { ENVIRONMENT } from './env.config';

let knockClient: Knock | null = null;

export const getKnockSecretKey = () => {
  if (!ENVIRONMENT.KNOCK_SECRET_KEY) {
    throw new Error(
      'KNOCK_SECRET_KEY must be defined in environment variables',
    );
  }
  return ENVIRONMENT.KNOCK_SECRET_KEY;
};

export const getKnockSigningKey = () => {
  if (!ENVIRONMENT.KNOCK_SIGNING_KEY) {
    throw new Error(
      'KNOCK_SIGNING_KEY must be defined in environment variables',
    );
  }
  return ENVIRONMENT.KNOCK_SIGNING_KEY;
};

// Channel IDs
export const getKnockPushChannelId = () => ENVIRONMENT.KNOCK_PUSH_CHANNEL_ID;
export const getKnockInAppChannelId = () => ENVIRONMENT.KNOCK_IN_APP_CHANNEL_ID;

// Workflow Keys
export const getKnockInAppWorkflowKey = () =>
  ENVIRONMENT.KNOCK_IN_APP_NOTIFICATION_WORKFLOW_KEY || 'in-app-notification';

const getKnockClient = (): Knock => {
  if (knockClient) {
    return knockClient;
  }

  const apiKey = ENVIRONMENT.KNOCK_SECRET_KEY;

  if (!apiKey) {
    throw new Error(
      'KNOCK_SECRET_KEY must be defined in environment variables',
    );
  }

  knockClient = new Knock({ apiKey });
  return knockClient;
};

export default getKnockClient;
