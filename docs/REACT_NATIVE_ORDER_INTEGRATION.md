# React Native Order & Payment Integration Guide

## Overview

This guide provides step-by-step instructions for integrating the Order & Payment system into your React Native application. The system supports two payment methods:

- **CREDIT**: PayOS QR code-based payment (async confirmation via webhook)
- **COD**: Cash on Delivery (instant confirmation)

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [API Endpoints](#api-endpoints)
3. [Authentication](#authentication)
4. [TypeScript Types](#typescript-types)
5. [Order Confirmation Flow](#order-confirmation-flow)
6. [Payment Handling](#payment-handling)
7. [Error Handling](#error-handling)
8. [Complete Example](#complete-example)

---

## Prerequisites

- React Native app with TypeScript
- Axios or Fetch for API calls
- JWT token management for authentication
- (Optional) React Native WebView for QR code display
- (Optional) Deep linking for payment return flow

---

## API Endpoints

### Base URL

```typescript
const API_BASE_URL = 'https://your-api-domain.com';
const API_VERSION = 'v1';
```

### Available Endpoints

| Method | Endpoint                            | Description                      | Auth Required |
| ------ | ----------------------------------- | -------------------------------- | ------------- |
| POST   | `/v1/orders/confirm`                | Confirm order and create payment | Yes           |
| POST   | `/v1/orders/:orderId/retry-payment` | Retry failed payment             | Yes           |
| GET    | `/v1/orders/:orderId`               | Get order status                 | Yes           |

---

## Authentication

All order endpoints require JWT authentication via Bearer token.

```typescript
// api/client.ts
import axios from 'axios';

const apiClient = axios.create({
  baseURL: `${API_BASE_URL}/${API_VERSION}`,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth interceptor
apiClient.interceptors.request.use(
  async (config) => {
    const token = await getAccessToken(); // Your token retrieval method
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Add response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response) {
      throw error.response.data;
    }
    throw error;
  },
);

export default apiClient;
```

---

## TypeScript Types

```typescript
// types/order.ts

export enum PaymentMethod {
  CREDIT = 'CREDIT',
  COD = 'COD',
}

export enum OrderStatus {
  PENDING_PAYMENT = 'PENDING_PAYMENT',
  CONFIRMED = 'CONFIRMED',
  PAID = 'PAID',
  SHIPPING = 'SHIPPING',
  DELIVERED = 'DELIVERED',
  CANCELED = 'CANCELED',
  EXPIRED = 'EXPIRED',
}

export enum PaymentTransactionStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  FAILED = 'FAILED',
  CANCELED = 'CANCELED',
  EXPIRED = 'EXPIRED',
}

export interface OrderItem {
  productId: string;
  variantId?: string;
  quantity: number;
  price: number;
}

export interface ConfirmOrderRequest {
  items: OrderItem[];
  paymentMethod: PaymentMethod;
  shippingAddress: string;
  customerPhone: string;
  customerName: string;
  note?: string;
}

export interface PaymentInfo {
  orderCode: number;
  checkoutUrl: string;
  qrCode: string;
  paymentLinkId: string;
}

export interface OrderResponse {
  id: string;
  status: OrderStatus;
  totalAmount: number;
  paymentMethod: PaymentMethod;
  shippingAddress: string;
  customerPhone: string;
  customerName: string;
  note: string | null;
  createdAt: string;
  updatedAt: string;
  paymentInfo: PaymentInfo | null;
}

export interface BaseResponse<T> {
  statusCode: number;
  message: string;
  data: T | null;
  error: any;
  errorCode?: string;
}

export interface OrderStatusResponse {
  id: string;
  status: OrderStatus;
  totalAmount: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentTransactionStatus | null;
  canRetry: boolean;
  createdAt: string;
  updatedAt: string;
}
```

---

## Order Confirmation Flow

### 1. Confirm Order (CREDIT Payment)

```typescript
// services/orderService.ts
import apiClient from '../api/client';
import {
  ConfirmOrderRequest,
  OrderResponse,
  BaseResponse,
} from '../types/order';

export const confirmOrder = async (
  orderData: ConfirmOrderRequest,
): Promise<OrderResponse> => {
  const response = await apiClient.post<BaseResponse<OrderResponse>>(
    '/orders/confirm',
    orderData,
  );

  if (response.statusCode !== 201 || !response.data) {
    throw new Error(response.message || 'Order confirmation failed');
  }

  return response.data;
};
```

### 2. Confirm Order (COD Payment)

```typescript
// COD orders are instantly confirmed
const orderData: ConfirmOrderRequest = {
  items: [
    {
      productId: 'prod_123',
      variantId: 'var_456',
      quantity: 2,
      price: 29.99,
    },
  ],
  paymentMethod: PaymentMethod.COD,
  shippingAddress: '123 Main St, City, Country',
  customerPhone: '+1234567890',
  customerName: 'John Doe',
  note: 'Please call before delivery',
};

const order = await confirmOrder(orderData);

// For COD, order.status will be 'CONFIRMED'
// For CREDIT, order.status will be 'PENDING_PAYMENT'
```

---

## Payment Handling

### CREDIT Payment Flow

1. **Get Payment QR Code**: Display `paymentInfo.qrCode` to user
2. **Redirect to Checkout**: Open `paymentInfo.checkoutUrl` in WebView or browser
3. **Poll Order Status**: Check payment status every 3-5 seconds
4. **Handle Completion**: Show success/failure based on status

### Display QR Code

```typescript
// components/PaymentQRCode.tsx
import React from 'react';
import { View, Image, Text, TouchableOpacity, Linking } from 'react-native';
import { PaymentInfo } from '../types/order';

interface Props {
  paymentInfo: PaymentInfo;
}

export const PaymentQRCode: React.FC<Props> = ({ paymentInfo }) => {
  const openCheckout = async () => {
    const canOpen = await Linking.canOpenURL(paymentInfo.checkoutUrl);
    if (canOpen) {
      await Linking.openURL(paymentInfo.checkoutUrl);
    }
  };

  return (
    <View style={{ alignItems: 'center', padding: 20 }}>
      <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>
        Scan QR Code to Pay
      </Text>

      <Image
        source={{ uri: paymentInfo.qrCode }}
        style={{ width: 300, height: 300 }}
        resizeMode="contain"
      />

      <Text style={{ marginTop: 10, color: '#666' }}>
        Order Code: {paymentInfo.orderCode}
      </Text>

      <TouchableOpacity
        onPress={openCheckout}
        style={{
          marginTop: 20,
          backgroundColor: '#007AFF',
          padding: 15,
          borderRadius: 8,
        }}
      >
        <Text style={{ color: 'white', fontWeight: 'bold' }}>
          Open Payment Page
        </Text>
      </TouchableOpacity>
    </View>
  );
};
```

### Poll Order Status

```typescript
// services/orderService.ts
export const getOrderStatus = async (
  orderId: string,
): Promise<OrderStatusResponse> => {
  const response = await apiClient.get<BaseResponse<OrderStatusResponse>>(
    `/orders/${orderId}`,
  );

  if (response.statusCode !== 200 || !response.data) {
    throw new Error(response.message || 'Failed to get order status');
  }

  return response.data;
};

// hooks/useOrderPolling.ts
import { useState, useEffect, useRef } from 'react';
import { getOrderStatus } from '../services/orderService';
import { OrderStatusResponse } from '../types/order';

interface UseOrderPollingOptions {
  orderId: string;
  interval?: number; // milliseconds
  onStatusChange?: (status: OrderStatusResponse) => void;
  enabled?: boolean;
}

export const useOrderPolling = ({
  orderId,
  interval = 3000,
  onStatusChange,
  enabled = true,
}: UseOrderPollingOptions) => {
  const [status, setStatus] = useState<OrderStatusResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      setError(null);
      const newStatus = await getOrderStatus(orderId);
      setStatus(newStatus);

      if (onStatusChange) {
        onStatusChange(newStatus);
      }

      // Stop polling if payment is complete or failed
      if (
        newStatus.status === 'PAID' ||
        newStatus.status === 'CONFIRMED' ||
        newStatus.status === 'CANCELED' ||
        newStatus.status === 'EXPIRED'
      ) {
        stopPolling();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch order status');
    } finally {
      setLoading(false);
    }
  };

  const startPolling = () => {
    if (!intervalRef.current && enabled) {
      fetchStatus(); // Fetch immediately
      intervalRef.current = setInterval(fetchStatus, interval);
    }
  };

  const stopPolling = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  useEffect(() => {
    if (enabled) {
      startPolling();
    }

    return () => {
      stopPolling();
    };
  }, [orderId, enabled]);

  return { status, loading, error, refetch: fetchStatus, stopPolling };
};
```

### Retry Payment

```typescript
// services/orderService.ts
export const retryPayment = async (orderId: string): Promise<OrderResponse> => {
  const response = await apiClient.post<BaseResponse<OrderResponse>>(
    `/orders/${orderId}/retry-payment`,
  );

  if (response.statusCode !== 201 || !response.data) {
    throw new Error(response.message || 'Payment retry failed');
  }

  return response.data;
};
```

---

## Error Handling

### Error Codes

| Error Code                       | Description                    | User Action              |
| -------------------------------- | ------------------------------ | ------------------------ |
| `OrderNotFound`                  | Order doesn't exist            | Contact support          |
| `OrderAccessDenied`              | Not authorized to access order | Check authentication     |
| `OrderCannotRetryPayment`        | Cannot retry in current status | Wait or contact support  |
| `OrderAlreadyPaid`               | Order already paid             | No action needed         |
| `OrderItemsEmpty`                | No items in order              | Add items to cart        |
| `OrderProductInvalid`            | Product not found or inactive  | Remove invalid product   |
| `OrderProductUnavailable`        | Product unavailable            | Choose different product |
| `OrderVariantNotFound`           | Variant doesn't exist          | Select valid variant     |
| `OrderInsufficientStock`         | Not enough stock               | Reduce quantity          |
| `PaymentTransactionNotFound`     | Payment transaction missing    | Retry payment            |
| `PaymentTransactionCreateFailed` | Failed to create payment       | Try again                |

### Error Handler

```typescript
// utils/errorHandler.ts
import { BaseResponse } from '../types/order';

export const handleOrderError = (error: any): string => {
  if (error.errorCode) {
    const errorMessages: Record<string, string> = {
      OrderNotFound: 'Order not found. Please check your order ID.',
      OrderAccessDenied: 'You do not have permission to access this order.',
      OrderCannotRetryPayment: 'Cannot retry payment for this order.',
      OrderAlreadyPaid: 'This order has already been paid.',
      OrderItemsEmpty: 'Order must contain at least one item.',
      OrderProductInvalid: 'One or more products are invalid.',
      OrderProductUnavailable: 'Product is currently unavailable.',
      OrderVariantNotFound: 'Selected variant does not exist.',
      OrderInsufficientStock: 'Insufficient stock for the requested quantity.',
      PaymentTransactionNotFound: 'Payment transaction not found.',
      PaymentTransactionCreateFailed:
        'Failed to create payment. Please try again.',
    };

    return (
      errorMessages[error.errorCode] || error.message || 'An error occurred'
    );
  }

  return error.message || 'An unexpected error occurred';
};
```

---

## Complete Example

### Payment Screen Component

```typescript
// screens/PaymentScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  Alert,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { PaymentQRCode } from '../components/PaymentQRCode';
import { useOrderPolling } from '../hooks/useOrderPolling';
import { retryPayment } from '../services/orderService';
import { PaymentMethod, OrderStatus } from '../types/order';
import { handleOrderError } from '../utils/errorHandler';

export const PaymentScreen: React.FC = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { orderId, paymentMethod } = route.params as {
    orderId: string;
    paymentMethod: PaymentMethod;
  };

  const [retrying, setRetrying] = useState(false);

  const { status, loading, error, stopPolling } = useOrderPolling({
    orderId,
    enabled: paymentMethod === PaymentMethod.CREDIT,
    interval: 3000,
    onStatusChange: (newStatus) => {
      if (newStatus.status === OrderStatus.PAID) {
        stopPolling();
        Alert.alert('Success', 'Payment completed successfully!', [
          {
            text: 'OK',
            onPress: () => navigation.navigate('OrderSuccess', { orderId }),
          },
        ]);
      } else if (
        newStatus.status === OrderStatus.EXPIRED ||
        newStatus.status === OrderStatus.CANCELED
      ) {
        stopPolling();
        Alert.alert('Payment Failed', 'Payment was not completed.', [
          {
            text: 'Retry',
            onPress: handleRetry,
          },
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => navigation.goBack(),
          },
        ]);
      }
    },
  });

  const handleRetry = async () => {
    try {
      setRetrying(true);
      const newOrder = await retryPayment(orderId);

      Alert.alert('Retry Successful', 'New payment link created', [
        {
          text: 'OK',
          onPress: () => {
            // Refresh the screen with new payment info
            navigation.replace('Payment', {
              orderId: newOrder.id,
              paymentMethod: PaymentMethod.CREDIT,
            });
          },
        },
      ]);
    } catch (err: any) {
      Alert.alert('Retry Failed', handleOrderError(err));
    } finally {
      setRetrying(false);
    }
  };

  useEffect(() => {
    // For COD, navigate directly to success
    if (paymentMethod === PaymentMethod.COD) {
      navigation.replace('OrderSuccess', { orderId });
    }
  }, []);

  if (loading && !status) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading payment...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Complete Your Payment</Text>

      {status?.paymentInfo && (
        <PaymentQRCode paymentInfo={status.paymentInfo} />
      )}

      <View style={styles.statusContainer}>
        <Text style={styles.statusLabel}>Payment Status:</Text>
        <Text style={styles.statusValue}>{status?.paymentStatus}</Text>
      </View>

      <View style={styles.statusContainer}>
        <Text style={styles.statusLabel}>Order Status:</Text>
        <Text style={styles.statusValue}>{status?.status}</Text>
      </View>

      {loading && (
        <View style={styles.pollingIndicator}>
          <ActivityIndicator size="small" color="#007AFF" />
          <Text style={styles.pollingText}>Checking payment status...</Text>
        </View>
      )}

      {status?.canRetry && (
        <TouchableOpacity
          style={styles.retryButton}
          onPress={handleRetry}
          disabled={retrying}
        >
          {retrying ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.retryButtonText}>Retry Payment</Text>
          )}
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    fontSize: 16,
    color: '#d32f2f',
    textAlign: 'center',
    marginBottom: 20,
  },
  statusContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  statusLabel: {
    fontSize: 16,
    color: '#666',
  },
  statusValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  pollingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    padding: 10,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  pollingText: {
    marginLeft: 10,
    fontSize: 14,
    color: '#666',
  },
  retryButton: {
    marginTop: 20,
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
```

### Checkout Screen Component

```typescript
// screens/CheckoutScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { confirmOrder } from '../services/orderService';
import { PaymentMethod, OrderItem } from '../types/order';
import { handleOrderError } from '../utils/errorHandler';

export const CheckoutScreen: React.FC = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    shippingAddress: '',
    note: '',
    paymentMethod: PaymentMethod.CREDIT,
  });

  // Mock cart items - replace with your cart state
  const cartItems: OrderItem[] = [
    {
      productId: 'prod_123',
      variantId: 'var_456',
      quantity: 2,
      price: 29.99,
    },
  ];

  const handleConfirmOrder = async () => {
    // Validation
    if (!formData.customerName.trim()) {
      Alert.alert('Validation Error', 'Please enter your name');
      return;
    }
    if (!formData.customerPhone.trim()) {
      Alert.alert('Validation Error', 'Please enter your phone number');
      return;
    }
    if (!formData.shippingAddress.trim()) {
      Alert.alert('Validation Error', 'Please enter shipping address');
      return;
    }

    try {
      setLoading(true);

      const order = await confirmOrder({
        items: cartItems,
        paymentMethod: formData.paymentMethod,
        shippingAddress: formData.shippingAddress,
        customerPhone: formData.customerPhone,
        customerName: formData.customerName,
        note: formData.note || undefined,
      });

      Alert.alert('Order Confirmed', 'Your order has been created!', [
        {
          text: 'OK',
          onPress: () => {
            navigation.navigate('Payment', {
              orderId: order.id,
              paymentMethod: formData.paymentMethod,
            });
          },
        },
      ]);
    } catch (err: any) {
      Alert.alert('Order Failed', handleOrderError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Checkout</Text>

      <TextInput
        style={styles.input}
        placeholder="Full Name"
        value={formData.customerName}
        onChangeText={(text) =>
          setFormData({ ...formData, customerName: text })
        }
      />

      <TextInput
        style={styles.input}
        placeholder="Phone Number"
        value={formData.customerPhone}
        onChangeText={(text) =>
          setFormData({ ...formData, customerPhone: text })
        }
        keyboardType="phone-pad"
      />

      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Shipping Address"
        value={formData.shippingAddress}
        onChangeText={(text) =>
          setFormData({ ...formData, shippingAddress: text })
        }
        multiline
        numberOfLines={3}
      />

      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Note (optional)"
        value={formData.note}
        onChangeText={(text) => setFormData({ ...formData, note: text })}
        multiline
        numberOfLines={2}
      />

      <Text style={styles.sectionTitle}>Payment Method</Text>

      <TouchableOpacity
        style={[
          styles.paymentOption,
          formData.paymentMethod === PaymentMethod.CREDIT &&
            styles.paymentOptionSelected,
        ]}
        onPress={() =>
          setFormData({ ...formData, paymentMethod: PaymentMethod.CREDIT })
        }
      >
        <Text style={styles.paymentOptionText}>Credit Card / QR Code</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.paymentOption,
          formData.paymentMethod === PaymentMethod.COD &&
            styles.paymentOptionSelected,
        ]}
        onPress={() =>
          setFormData({ ...formData, paymentMethod: PaymentMethod.COD })
        }
      >
        <Text style={styles.paymentOptionText}>Cash on Delivery</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.confirmButton}
        onPress={handleConfirmOrder}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={styles.confirmButtonText}>Confirm Order</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    fontSize: 16,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 15,
  },
  paymentOption: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
  },
  paymentOptionSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#E3F2FD',
  },
  paymentOptionText: {
    fontSize: 16,
  },
  confirmButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  confirmButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
```

---

## Best Practices

### 1. Token Refresh

Implement automatic token refresh in your interceptor to handle expired tokens:

```typescript
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.data?.errorCode === 'token_expired') {
      // Refresh token and retry request
      const newToken = await refreshAccessToken();
      error.config.headers.Authorization = `Bearer ${newToken}`;
      return apiClient.request(error.config);
    }
    return Promise.reject(error);
  },
);
```

### 2. Polling Optimization

- Use exponential backoff for polling intervals
- Stop polling after order reaches final state
- Implement maximum polling duration (e.g., 10 minutes)

### 3. Offline Handling

- Cache order data locally
- Show cached status when offline
- Sync when connection restored

### 4. Deep Linking

Configure deep links for payment return flow:

```typescript
// Handle deep link from PayOS
Linking.addEventListener('url', (event) => {
  const url = new URL(event.url);
  if (url.pathname === '/payment-return') {
    const orderId = url.searchParams.get('orderId');
    navigation.navigate('Payment', { orderId });
  }
});
```

### 5. Security

- Never log sensitive payment information
- Validate all input on frontend before submitting
- Use HTTPS for all API calls
- Store tokens securely (iOS Keychain, Android Keystore)

---

## Testing

### Test Scenarios

1. **CREDIT Payment Success**
   - Confirm order with CREDIT method
   - Display QR code
   - Scan and pay via PayOS
   - Verify status changes to PAID

2. **CREDIT Payment Timeout**
   - Confirm order
   - Don't complete payment
   - Wait for expiration
   - Test retry flow

3. **COD Order**
   - Confirm order with COD
   - Verify instant confirmation
   - Check order status is CONFIRMED

4. **Network Errors**
   - Test with airplane mode
   - Verify error messages
   - Test retry mechanisms

5. **Insufficient Stock**
   - Try ordering more than available stock
   - Verify error handling

---

## Support

For issues or questions:

- Backend API documentation: `/docs/ORDER_PAYMENT_SYSTEM.md`
- Setup guide: `/docs/SETUP.md`
- Error codes reference: `/src/shared/enum/error-code.enum.ts`

---

## Changelog

### v1.0.0 (Initial Release)

- Order confirmation with CREDIT and COD support
- Payment status polling
- Retry payment functionality
- Comprehensive error handling
