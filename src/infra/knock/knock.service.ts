import { Injectable, Logger } from '@nestjs/common';
import getKnockClient from '@core/config/knock.config';

/**
 * Knock Service
 *
 * Infrastructure service for triggering Knock workflows.
 * Thin wrapper around Knock SDK - all business logic stays in domain/application layers.
 */
@Injectable()
export class KnockService {
  private readonly logger = new Logger(KnockService.name);
  private readonly client = getKnockClient();

  /**
   * Trigger a Knock workflow
   *
   * @param workflowKey - The Knock workflow identifier
   * @param recipients - User IDs to send notification to
   * @param data - Workflow data (variables for templates)
   * @param actor - Who triggered the notification
   * @returns Workflow run ID
   */
  async triggerWorkflow(
    workflowKey: string,
    recipients: string[],
    data: Record<string, any>,
    actor?: { id: string; name?: string; avatar?: string },
  ): Promise<string> {
    try {
      const response = await this.client.workflows.trigger(workflowKey, {
        recipients,
        data,
        actor: actor || { id: 'system', name: 'System' },
      });

      this.logger.log(
        `Triggered workflow ${workflowKey} for ${recipients.length} users`,
      );

      return response.workflow_run_id;
    } catch (error) {
      this.logger.error(
        `Failed to trigger workflow ${workflowKey}:`,
        error.message,
      );
      throw error;
    }
  }

  /**
   * Trigger workflow for multiple recipients in bulk
   *
   * This is the same as triggerWorkflow but accepts recipient objects with metadata.
   *
   * @param workflowKey - The Knock workflow identifier
   * @param recipients - Recipient objects with id, name, email
   * @param data - Workflow data
   * @param actor - Who triggered the notification
   * @returns Workflow run ID
   */
  async triggerWorkflowBulk(
    workflowKey: string,
    recipients: Array<{ id: string; name?: string; email?: string }>,
    data: Record<string, any>,
    actor?: { id: string; name?: string; avatar?: string },
  ): Promise<string> {
    // Knock SDK handles both string[] and object[] for recipients
    return this.triggerWorkflow(workflowKey, recipients as any, data, actor);
  }
}
