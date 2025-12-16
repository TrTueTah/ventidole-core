import { Public } from '@core/decorator/public.decorator';
import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ErrorCode } from '@shared/enum/error-code.enum';
import { CustomError } from '@shared/helper/error';
import { WinstonLogger } from '@shared/service/logger/winston.logger';
import { PaymentGatewayService } from '@shared/service/payment-gateway/payment-gateway.service';
import { PayOSWebhookDto } from './dto/payos-webhook.dto';
import { OrderService } from './order.service';

@Public()
@ApiTags('Webhooks')
@Controller('webhooks')
export class WebhookController {
  constructor(
    private readonly orderService: OrderService,
    private readonly paymentGateway: PaymentGatewayService,
  ) {}

  @Post('payos')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'PayOS payment webhook',
    description:
      'Webhook endpoint for PayOS payment confirmations. Must be publicly accessible, HTTPS, and respond within 5 seconds. No authentication required.',
  })
  @ApiResponse({
    status: 200,
    description: 'Webhook processed successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid signature or webhook data',
  })
  async handlePayOSWebhook(
    @Body() webhook: PayOSWebhookDto,
  ): Promise<{ success: boolean }> {
    WinstonLogger.info('PayOS webhook received', {
      metadata: {
        orderCode: webhook.data.orderCode,
        status: webhook.data.status,
        amount: webhook.data.amount,
      },
    });

    // CRITICAL: Verify webhook signature
    const isValid = this.paymentGateway.verifyWebhookSignature(
      webhook.data,
      webhook.signature,
    );

    if (!isValid) {
      WinstonLogger.error('PayOS webhook signature verification failed', {
        metadata: {
          orderCode: webhook.data.orderCode,
          receivedSignature: webhook.signature,
        },
      });
      throw new CustomError(ErrorCode.PaymentWebhookSignatureInvalid);
    }

    // Extract webhook data
    const { orderCode, status, amount } = webhook.data;

    try {
      // Handle different payment statuses
      switch (status) {
        case 'PAID':
          await this.orderService.handlePaymentSuccess(orderCode);
          WinstonLogger.info('Payment success handled', {
            metadata: { orderCode, amount },
          });
          break;

        case 'FAILED':
        case 'CANCELED':
        case 'EXPIRED':
          // Optionally handle failed/canceled/expired payments
          WinstonLogger.info('Payment not successful', {
            metadata: { orderCode, status },
          });
          // You can add logic to mark transaction as failed/canceled/expired
          break;

        default:
          WinstonLogger.warn('Unknown payment status from webhook', {
            metadata: { orderCode, status },
          });
      }

      return { success: true };
    } catch (error) {
      WinstonLogger.error('Error processing PayOS webhook', {
        metadata: {
          orderCode,
          error: error.message,
          stack: error.stack,
        },
      });

      // Still return 200 to prevent PayOS from retrying
      // But log the error for investigation
      return { success: false };
    }
  }
}
