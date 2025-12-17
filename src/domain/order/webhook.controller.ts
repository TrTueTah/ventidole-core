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
        amount: webhook.data.amount,
      },
    });

    // CRITICAL: Verify webhook signature
    // PayOS signs all fields in webhook.data, not the top-level fields
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
    const { orderCode, amount } = webhook.data;
    // Note: PayOS webhook doesn't include 'status' field, payment is PAID when webhook is received

    try {
      // PayOS webhook is only sent for successful payments (code: "00")
      // Handle payment success
      await this.orderService.handlePaymentSuccess(orderCode);
      WinstonLogger.info('Payment success handled', {
        metadata: { orderCode, amount },
      });

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
