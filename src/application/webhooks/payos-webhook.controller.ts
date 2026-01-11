import {
  Controller,
  Post,
  Body,
  Headers,
  BadRequestException,
  NotFoundException,
  Logger,
  Inject,
} from '@nestjs/common';
import { PayOSService } from '@infra/payos/payos.service';
import { PayOSWebhookDto, PayOSPaymentStatus } from '@infra/payos/dto/payos-webhook.dto';
import { SubscriptionRepository } from '@domain/membership/subscription/subscription.repository';
import { MembershipTierRepository } from '@domain/membership/membership-tier/membership-tier.repository';
import { OrderApplicationService } from '@application/user/order/order.service';

/**
 * PayOS Webhook Controller
 *
 * Handles payment confirmation webhooks from PayOS.
 *
 * Responsibilities:
 * - Verify webhook signature
 * - Process subscription payment confirmations
 * - Ensure idempotency
 *
 * Security:
 * - Validates HMAC SHA256 signature from PayOS
 * - Prevents replay attacks and tampering
 */
@Controller('webhooks/payos')
export class PayOSWebhookController {
  private readonly logger = new Logger(PayOSWebhookController.name);

  constructor(
    private readonly payosService: PayOSService,
    @Inject('SubscriptionRepository')
    private readonly subscriptionRepository: SubscriptionRepository,
    @Inject('MembershipTierRepository')
    private readonly tierRepository: MembershipTierRepository,
    private readonly orderService: OrderApplicationService,
  ) {}

  /**
   * Handle PayOS webhook for subscription payments
   *
   * Flow:
   * 1. Verify signature
   * 2. Find subscription by orderCode
   * 3. Confirm payment (PENDING_PAYMENT → ACTIVE)
   * 4. Increment tier subscriber count
   * 5. Return success
   */
  @Post('subscription')
  async handleSubscriptionPayment(
    @Body() webhookData: PayOSWebhookDto,
    @Headers('x-payos-signature') signature: string,
  ): Promise<{ success: boolean }> {
    this.logger.log(
      `Received PayOS webhook for subscription payment: orderCode=${webhookData.data.orderCode}`,
    );

    // 1. Verify signature
    if (!signature) {
      throw new BadRequestException('Missing signature header');
    }

    const isValid = this.payosService.verifyWebhookSignature(
      webhookData.data,
      signature,
    );

    if (!isValid) {
      this.logger.warn(
        `Invalid webhook signature for orderCode=${webhookData.data.orderCode}`,
      );
      throw new BadRequestException('Invalid signature');
    }

    // 2. Check payment status
    if (webhookData.data.status !== PayOSPaymentStatus.PAID) {
      this.logger.log(
        `Payment not completed: orderCode=${webhookData.data.orderCode}, status=${webhookData.data.status}`,
      );
      return { success: true }; // Acknowledge webhook but don't process
    }

    // 3. Find subscription by orderCode
    const subscription = await this.subscriptionRepository.findByOrderCode(
      webhookData.data.orderCode,
    );

    if (!subscription) {
      this.logger.warn(
        `Subscription not found for orderCode=${webhookData.data.orderCode}`,
      );
      throw new NotFoundException('Subscription not found');
    }

    // 4. Idempotency check - if already active, skip
    if (subscription.isActive()) {
      this.logger.log(
        `Subscription already active: id=${subscription.id.value}, orderCode=${webhookData.data.orderCode}`,
      );
      return { success: true };
    }

    // 5. Confirm payment (PENDING_PAYMENT → ACTIVE)
    const paidAt = new Date();
    subscription.confirmPayment(paidAt);

    // 6. Increment tier subscriber count
    const tier = await this.tierRepository.findById(subscription.tierId);
    if (tier) {
      tier.incrementSubscriberCount();
      await this.tierRepository.save(tier);
    }

    // 7. Persist subscription (publishes domain events)
    await this.subscriptionRepository.save(subscription);

    this.logger.log(
      `Subscription payment confirmed: id=${subscription.id.value}, orderCode=${webhookData.data.orderCode}`,
    );

    return { success: true };
  }

  /**
   * Handle PayOS webhook for order payments
   *
   * Flow:
   * 1. Verify signature
   * 2. Find order by orderCode
   * 3. Confirm payment (PENDING_PAYMENT → PAID)
   * 4. Return success
   */
  @Post('order')
  async handleOrderPayment(
    @Body() webhookData: PayOSWebhookDto,
    @Headers('x-payos-signature') signature: string,
  ): Promise<{ success: boolean }> {
    this.logger.log(
      `Received PayOS webhook for order payment: orderCode=${webhookData.data.orderCode}`,
    );

    // 1. Verify signature
    if (!signature) {
      throw new BadRequestException('Missing signature header');
    }

    const isValid = this.payosService.verifyWebhookSignature(
      webhookData.data,
      signature,
    );

    if (!isValid) {
      this.logger.warn(
        `Invalid webhook signature for orderCode=${webhookData.data.orderCode}`,
      );
      throw new BadRequestException('Invalid signature');
    }

    // 2. Check payment status
    if (webhookData.data.status !== PayOSPaymentStatus.PAID) {
      this.logger.log(
        `Payment not completed: orderCode=${webhookData.data.orderCode}, status=${webhookData.data.status}`,
      );
      return { success: true }; // Acknowledge webhook but don't process
    }

    // 3. Process order payment (idempotency handled in service)
    await this.orderService.handlePaymentSuccess(webhookData.data.orderCode);

    this.logger.log(
      `Order payment webhook processed successfully: orderCode=${webhookData.data.orderCode}`,
    );

    return { success: true };
  }
}
