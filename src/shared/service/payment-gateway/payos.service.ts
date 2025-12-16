import { ENVIRONMENT } from '@core/config/env.config';
import { Injectable } from '@nestjs/common';
import { WinstonLogger } from '@shared/service/logger/winston.logger';
import axios, { AxiosInstance } from 'axios';
import { createHmac } from 'crypto';
import { PayOSCreatePaymentDto } from './dto/payos-create-payment.dto';
import { PayOSPaymentResponse } from './dto/payos-payment-response.dto';

@Injectable()
export class PayOSService {
  private readonly axiosInstance: AxiosInstance;
  private readonly apiKey: string;
  private readonly clientId: string;
  private readonly checksumKey: string;

  constructor() {
    this.apiKey = ENVIRONMENT.PAYOS_API_KEY;
    this.clientId = ENVIRONMENT.PAYOS_CLIENT_ID;
    this.checksumKey = ENVIRONMENT.PAYOS_CHECKSUM_KEY;

    this.axiosInstance = axios.create({
      baseURL: 'https://api-merchant.payos.vn/v2',
      headers: {
        'x-api-key': this.apiKey,
        'x-client-id': this.clientId,
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Generate HMAC SHA256 signature for PayOS payment request
   * Sorts keys alphabetically and uses key=value format as per PayOS spec
   * @param data Payment data to sign
   * @returns Hex signature string
   */
  private generateSignature(data: {
    orderCode: number;
    amount: number;
    description: string;
    cancelUrl: string;
    returnUrl: string;
  }): string {
    // Sort keys alphabetically and build signature string
    const rawData = Object.keys(data)
      .sort()
      .map((key) => `${key}=${data[key]}`)
      .join('&');

    const hmac = createHmac('sha256', this.checksumKey);
    hmac.update(rawData);
    return hmac.digest('hex');
  }

  /**
   * Create a payment request and get QR code
   * @param paymentData Payment request data
   * @returns Payment response with QR code and checkout URL
   */
  async createPayment(
    paymentData: Omit<PayOSCreatePaymentDto, 'signature'>,
  ): Promise<PayOSPaymentResponse> {
    try {
      const signature = this.generateSignature(paymentData);

      const requestBody: PayOSCreatePaymentDto = {
        ...paymentData,
        signature,
      };

      WinstonLogger.info('Creating PayOS payment request', {
        metadata: {
          orderCode: paymentData.orderCode,
          amount: paymentData.amount,
        },
      });

      const response = await this.axiosInstance.post<PayOSPaymentResponse>(
        '/payment-requests',
        requestBody,
      );

      WinstonLogger.info('PayOS payment created successfully', {
        metadata: {
          orderCode: paymentData.orderCode,
          paymentLinkId: response.data.data.paymentLinkId,
        },
      });

      return response.data;
    } catch (error) {
      WinstonLogger.error('Failed to create PayOS payment', {
        metadata: {
          orderCode: paymentData.orderCode,
          error: error.response?.data || error.message,
        },
      });
      throw error;
    }
  }

  /**
   * Verify webhook signature from PayOS
   * Uses the same sorting algorithm as signature generation
   * @param webhookData Webhook data received from PayOS (data object only)
   * @param receivedSignature Signature from webhook payload
   * @returns Boolean indicating if signature is valid
   */
  verifyWebhookSignature(
    webhookData: Record<string, any>,
    receivedSignature: string,
  ): boolean {
    try {
      // Sort keys alphabetically and build signature string
      const rawData = Object.keys(webhookData)
        .sort()
        .map((key) => `${key}=${webhookData[key]}`)
        .join('&');

      const hmac = createHmac('sha256', this.checksumKey);
      hmac.update(rawData);
      const expectedSignature = hmac.digest('hex');

      const isValid = expectedSignature === receivedSignature;

      if (!isValid) {
        WinstonLogger.warn('PayOS webhook signature verification failed', {
          metadata: {
            expected: expectedSignature,
            received: receivedSignature,
            rawData,
          },
        });
      }

      return isValid;
    } catch (error) {
      WinstonLogger.error('Failed to verify PayOS webhook signature', {
        metadata: { error: error.message },
      });
      return false;
    }
  }
}
