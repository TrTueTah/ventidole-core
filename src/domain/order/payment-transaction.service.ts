import { Injectable } from '@nestjs/common';
import { ErrorCode } from '@shared/enum/error-code.enum';
import { CustomError } from '@shared/helper/error';
import { WinstonLogger } from '@shared/service/logger/winston.logger';
import { PayOSService } from '@shared/service/payment-gateway/payos.service';
import { PrismaService } from '@shared/service/prisma/prisma.service';
import {
  PaymentTransaction,
  PaymentTransactionStatus,
} from 'src/db/prisma/client';

@Injectable()
export class PaymentTransactionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly payosService: PayOSService,
  ) {}

  /**
   * Generate unique orderCode for PayOS
   * Uses current timestamp with random suffix to ensure uniqueness
   * Must fit within INT4 (max: 2,147,483,647)
   * @returns Unique numeric orderCode
   */
  private generateOrderCode(): number {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    // Use last 7 digits of timestamp (max ~9,999,999) + 3-digit random (max 999)
    // This creates a max value of ~9,999,999,999 but we need to keep it under 2,147,483,647
    // So we'll use last 6 digits of timestamp + 3-digit random = 9 digits max (999,999,999)
    const orderCode = parseInt(
      `${timestamp.toString().slice(-6)}${random.toString().padStart(3, '0')}`,
    );
    return orderCode;
  }

  /**
   * Create payment transaction and generate PayOS payment link
   * @param orderId Order UUID
   * @param userId User UUID
   * @param amount Payment amount in VND
   * @param description Payment description
   * @returns Created payment transaction with PayOS data
   */
  async createPaymentTransaction(
    orderId: string,
    userId: string,
    amount: number,
    description: string,
  ): Promise<PaymentTransaction> {
    // Generate unique orderCode
    const orderCode = this.generateOrderCode();

    // Verify orderCode is unique (race condition protection)
    const existingTransaction = await this.prisma.paymentTransaction.findUnique(
      {
        where: { orderCode },
      },
    );

    if (existingTransaction) {
      // Extremely rare case - retry with new orderCode
      return this.createPaymentTransaction(
        orderId,
        userId,
        amount,
        description,
      );
    }

    // Create PayOS payment link
    let payosResponse;
    try {
      // TODO: Remove hardcoded amount - PayOS requires integer amounts (VND)
      payosResponse = await this.payosService.createPayment({
        orderCode,
        amount: 2000,
        description,
        // Deep link URLs for mobile app navigation
        cancelUrl: `ventidole://payment/failure/${orderId}`,
        returnUrl: `ventidole://payment/success/${orderId}`,
      });
    } catch (error) {
      WinstonLogger.error('PayOS service error', {
        metadata: {
          orderId,
          orderCode,
          error: error.message,
        },
      });
      throw new CustomError(
        ErrorCode.PaymentTransactionCreateFailed,
        `Failed to create payment link: ${error.message}`,
      );
    }

    // Create payment transaction record
    const transaction = await this.prisma.paymentTransaction.create({
      data: {
        orderId,
        userId,
        amount,
        provider: 'PAYOS',
        orderCode,
        paymentLinkId: payosResponse.data.paymentLinkId,
        status: PaymentTransactionStatus.PENDING,
        checkoutUrl: payosResponse.data.checkoutUrl,
        qrCode: payosResponse.data.qrCode,
      },
    });

    WinstonLogger.info('Payment transaction created', {
      metadata: {
        transactionId: transaction.id,
        orderId,
        orderCode,
        amount,
      },
    });

    return transaction;
  }

  /**
   * Find payment transaction by orderCode
   * @param orderCode PayOS orderCode
   * @returns Payment transaction or null
   */
  async findByOrderCode(orderCode: number): Promise<PaymentTransaction | null> {
    return this.prisma.paymentTransaction.findUnique({
      where: { orderCode },
      include: {
        order: true,
        user: true,
      },
    });
  }

  /**
   * Update payment transaction status (idempotent)
   * @param orderCode PayOS orderCode
   * @param status New status
   * @param paidAt Optional payment timestamp
   * @returns Updated transaction
   */
  async updateTransactionStatus(
    orderCode: number,
    status: PaymentTransactionStatus,
    paidAt?: Date,
  ): Promise<PaymentTransaction> {
    const transaction = await this.findByOrderCode(orderCode);

    if (!transaction) {
      throw new CustomError(ErrorCode.PaymentTransactionNotFound, orderCode);
    }

    // Idempotency check - if already PAID, don't update
    if (
      transaction.status === PaymentTransactionStatus.PAID &&
      status === PaymentTransactionStatus.PAID
    ) {
      WinstonLogger.info(
        'Payment transaction already PAID - idempotent handling',
        {
          metadata: { orderCode, transactionId: transaction.id },
        },
      );
      return transaction;
    }

    // Update transaction
    const updated = await this.prisma.paymentTransaction.update({
      where: { orderCode },
      data: {
        status,
        paidAt:
          paidAt ||
          (status === PaymentTransactionStatus.PAID ? new Date() : undefined),
        updatedAt: new Date(),
      },
    });

    WinstonLogger.info('Payment transaction status updated', {
      metadata: {
        orderCode,
        transactionId: updated.id,
        oldStatus: transaction.status,
        newStatus: status,
      },
    });

    return updated;
  }

  /**
   * Get latest payment transaction for an order
   * @param orderId Order UUID
   * @returns Latest payment transaction or null
   */
  async getLatestTransactionForOrder(
    orderId: string,
  ): Promise<PaymentTransaction | null> {
    return this.prisma.paymentTransaction.findFirst({
      where: { orderId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Check if order has pending payment transaction
   * @param orderId Order UUID
   * @returns True if pending transaction exists
   */
  async hasPendingTransaction(orderId: string): Promise<boolean> {
    const count = await this.prisma.paymentTransaction.count({
      where: {
        orderId,
        status: PaymentTransactionStatus.PENDING,
      },
    });
    return count > 0;
  }

  /**
   * Expire pending transactions for an order
   * @param orderId Order UUID
   */
  async expirePendingTransactions(orderId: string): Promise<void> {
    await this.prisma.paymentTransaction.updateMany({
      where: {
        orderId,
        status: PaymentTransactionStatus.PENDING,
      },
      data: {
        status: PaymentTransactionStatus.EXPIRED,
        updatedAt: new Date(),
      },
    });

    WinstonLogger.info('Expired pending transactions for order', {
      metadata: { orderId },
    });
  }
}
