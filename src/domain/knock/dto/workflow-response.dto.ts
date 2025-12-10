import { ApiProperty } from '@nestjs/swagger';

export class WorkflowResponseDto {
  @ApiProperty({
    description: 'Success status',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Workflow run ID from Knock',
    example: '01HG2XQZV5YJ9K8M7N6P5Q4R3S',
  })
  workflowRunId: string;
}
