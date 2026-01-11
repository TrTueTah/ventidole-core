/**
 * PayOS Payment Response
 *
 * Response structure from PayOS API after creating a payment request.
 */
export interface PayOSPaymentResponse {
  code: string;
  desc: string;
  data: {
    bin: string;
    accountNumber: string;
    accountName: string;
    amount: number;
    description: string;
    orderCode: number;
    currency: string;
    paymentLinkId: string;
    status: string; // Initial status is always 'PENDING'
    checkoutUrl: string;
    qrCode: string; // Base64-encoded QR image
  };
  signature: string;
}
