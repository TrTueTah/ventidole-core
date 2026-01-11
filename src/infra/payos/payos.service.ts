import { ENVIRONMENT } from '@core/config/env.config';
import { Injectable, Logger } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import { createHmac } from 'crypto';
import { PayOSCreatePaymentDto } from './dto/payos-create-payment.dto';
import { PayOSPaymentResponse } from './dto/payos-payment-response.dto';

/**
 * PayOS Service
 *
 * Integration with PayOS payment gateway for QR code-based payments.
 *
 * Responsibilities:
 * - Create payment links with QR codes
 * - Generate HMAC SHA256 signatures
 * - Verify webhook signatures
 *
 * Note: Payment confirmation must be handled via webhook.
 * Do NOT trust frontend redirects (returnUrl).
 */
@Injectable()
export class PayOSService {
  private readonly logger = new Logger(PayOSService.name);
  private readonly axiosInstance: AxiosInstance;
  private readonly apiKey: string;
  private readonly clientId: string;
  private readonly checksumKey: string;

  constructor() {
    this.apiKey = ENVIRONMENT.PAYOS_API_KEY;
    this.clientId = ENVIRONMENT.PAYOS_CLIENT_ID;
    this.checksumKey = ENVIRONMENT.PAYOS_CHECKSUM_KEY;

    if (!this.apiKey || !this.clientId || !this.checksumKey) {
      throw new Error(
        'PayOS credentials not configured. Please set PAYOS_API_KEY, PAYOS_CLIENT_ID, and PAYOS_CHECKSUM_KEY',
      );
    }

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

      this.logger.log(
        `Creating PayOS payment: orderCode=${paymentData.orderCode}, amount=${paymentData.amount}`,
      );

      const response = await this.axiosInstance.post<PayOSPaymentResponse>(
        '/payment-requests',
        requestBody,
      );

      // Validate response structure
      if (!response.data || !response.data.data) {
        throw new Error(
          `Invalid PayOS response structure: ${JSON.stringify(response.data)}`,
        );
      }

      this.logger.log(
        `PayOS payment created: orderCode=${paymentData.orderCode}, paymentLinkId=${response.data.data.paymentLinkId}`,
      );

      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message;
      const statusCode = error.response?.status;

      this.logger.error(
        `Failed to create PayOS payment: orderCode=${paymentData.orderCode}, status=${statusCode}, error=${errorMessage}`,
      );

      throw new Error(
        `PayOS payment creation failed: ${statusCode ? `${statusCode} - ` : ''}${errorMessage}`,
      );
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
      // Convert null values to empty string to match PayOS signature format
      const rawData = Object.keys(webhookData)
        .sort()
        .map((key) => {
          const value = webhookData[key];
          // Handle null, undefined, or empty values
          const stringValue =
            value === null || value === undefined ? '' : String(value);
          return `${key}=${stringValue}`;
        })
        .join('&');

      const hmac = createHmac('sha256', this.checksumKey);
      hmac.update(rawData);
      const expectedSignature = hmac.digest('hex');

      const isValid = expectedSignature === receivedSignature;

      if (!isValid) {
        this.logger.warn(
          `PayOS webhook signature verification failed: expected=${expectedSignature}, received=${receivedSignature}`,
        );
      }

      return isValid;
    } catch (error) {
      this.logger.error(
        `Failed to verify PayOS webhook signature: ${error.message}`,
      );
      return false;
    }
  }
}
