# React Native Order & Payment Integration Guide

## Overview

This guide provides step-by-step instructions for integrating the Order & Payment system into your React Native application. The system uses **Stream Chat for real-time payment notifications** and **Knock for push notifications** to provide instant updates when payments are completed, eliminating the need for polling.

The system supports two payment methods:

- **CREDIT**: PayOS QR code-based payment (async confirmation via webhook + real-time event + push notification)
- **COD**: Cash on Delivery (instant confirmation)

## Key Features

✅ **Instant Payment Notifications** - Real-time updates via Stream Chat and Knock  
✅ **Push Notifications** - Reach users even when app is closed  
✅ **No Polling Required** - Event-driven architecture saves battery and bandwidth  
✅ **Automatic Fallback** - Falls back to polling if real-time connection fails  
✅ **Multi-device Support** - Notifications delivered to all user devices  
✅ **Deep Linking** - Tap notification to open order details

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Installation](#installation)
3. [Why Real-time Events vs Polling](#why-real-time-events-vs-polling)
4. [API Endpoints](#api-endpoints)
5. [Authentication](#authentication)
6. [TypeScript Types](#typescript-types)
7. [Order Confirmation Flow](#order-confirmation-flow)
8. [Payment Handling](#payment-handling)
9. [Best Practices](#best-practices)
10. [Testing](#testing)
11. [Backend Implementation Notes](#backend-implementation-notes)
12. [Error Handling](#error-handling)
13. [Complete Example](#complete-example)

---

## Prerequisites

- React Native app with TypeScript
- Axios or Fetch for API calls
- JWT token management for authentication
- **Stream Chat SDK** (`stream-chat`, `stream-chat-react-native`) - **Required for real-time updates**
- **Knock SDK** (`@knocklabs/react-native`) - **Required for push notifications**
- Firebase Cloud Messaging (FCM) configured for push notifications
- (Optional) React Native WebView for QR code display
- (Optional) Deep linking for payment return flow

> **Important**: This guide uses **Stream Chat for real-time payment notifications** and **Knock for push notifications** instead of polling. Ensure you have both integrated before implementing order payments.

---

## Why Real-time Events vs Polling?

### Stream Chat Advantages

| Feature             | Polling Approach          | Stream Chat Events      |
| ------------------- | ------------------------- | ----------------------- |
| **Latency**         | 3-5 seconds delay         | Instant (<100ms)        |
| **Battery Usage**   | High (constant requests)  | Low (WebSocket)         |
| **Network Usage**   | High (repeated API calls) | Low (single connection) |
| **Server Load**     | High (frequent requests)  | Low (event-driven)      |
| **Scalability**     | Limited                   | Excellent               |
| **Offline Support** | Manual sync required      | Automatic event queue   |
| **User Experience** | Delayed updates           | Instant feedback        |

### Flow Comparison

**Old Polling Approach:**

```
User pays → Wait 3-5 sec → Poll API → Check status → Wait 3-5 sec → Poll API → ...
Total time to confirm: 6-10 seconds (variable)
```

**New Real-time Approach:**

```
User pays → PayOS webhook → Backend updates order
            ↓
            ├─→ Stream Chat event → In-app notification (instant)
            └─→ Knock push notification → Device notification (instant)

Total time to confirm: <1 second (consistent)
```

### Notification Methods

The system uses **two complementary notification channels**:

1. **Stream Chat Events** - For in-app real-time updates
   - Instant updates while app is active
   - No server polling required
   - Low battery impact

2. **Knock Push Notifications** - For out-of-app alerts
   - Reach users even when app is closed
   - System-level notifications
   - Uses Firebase Cloud Messaging (FCM)

---

## API Endpoints

### Base URL

```typescript
const API_BASE_URL = 'https://your-api-domain.com';
const API_VERSION = 'v1';
```

### Available Endpoints

#### Order Endpoints

| Method | Endpoint                            | Description                      | Auth Required |
| ------ | ----------------------------------- | -------------------------------- | ------------- |
| POST   | `/v1/orders/confirm`                | Confirm order and create payment | Yes           |
| POST   | `/v1/orders/:orderId/retry-payment` | Retry failed payment             | Yes           |
| GET    | `/v1/orders/:orderId`               | Get order status                 | Yes           |

#### Knock Notification Endpoints

| Method | Endpoint                 | Description                               | Auth Required |
| ------ | ------------------------ | ----------------------------------------- | ------------- |
| POST   | `/v1/knock/token`        | Generate Knock authentication token       | Yes           |
| POST   | `/v1/knock/register-fcm` | Register FCM token for push notifications | Yes           |

#### Stream Chat Endpoints

| Method | Endpoint                | Description                               | Auth Required |
| ------ | ----------------------- | ----------------------------------------- | ------------- |
| POST   | `/v1/stream-chat/token` | Generate Stream Chat authentication token | Yes           |

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

// Stream Chat Event Types
export interface OrderStatusEvent {
  type: 'order.status_updated';
  order_id: string;
  status: OrderStatus;
  total_amount: number;
  payment_method: PaymentMethod;
  payment_status: PaymentTransactionStatus;
  can_retry: boolean;
  created_at: string;
  updated_at: string;
}

export interface StreamAuthResponse {
  token: string;
  apiKey: string;
  userId: string;
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
3. **Listen for Real-time Updates**: Subscribe to Stream Chat custom events for order status
4. **Handle Completion**: Show success/failure based on event notifications

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

### Subscribe to Real-time Order Events

```typescript
// services/streamChatService.ts
import { StreamChat } from 'stream-chat';

export interface StreamAuthResponse {
  token: string;
  apiKey: string;
  userId: string;
}

export const getStreamToken = async (
  userId: string,
  jwtToken: string,
): Promise<StreamAuthResponse> => {
  const response = await apiClient.post<BaseResponse<StreamAuthResponse>>(
    '/stream-chat/token',
    { userId },
    {
      headers: {
        Authorization: `Bearer ${jwtToken}`,
      },
    },
  );

  if (response.statusCode !== 200 || !response.data) {
    throw new Error(response.message || 'Failed to get Stream token');
  }

  return response.data;
};

// hooks/useStreamChat.ts
import { useState, useEffect } from 'react';
import { StreamChat } from 'stream-chat';
import { getStreamToken } from '../services/streamChatService';

export const useStreamChat = (userId: string, jwtToken: string) => {
  const [chatClient, setChatClient] = useState<StreamChat | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let client: StreamChat | null = null;

    const setupChat = async () => {
      try {
        const streamAuth = await getStreamToken(userId, jwtToken);

        client = StreamChat.getInstance(streamAuth.apiKey);

        await client.connectUser(
          {
            id: userId,
          },
          streamAuth.token,
        );

        setChatClient(client);
        setIsReady(true);
      } catch (error) {
        console.error('Failed to connect to Stream Chat:', error);
      }
    };

    setupChat();

    return () => {
      if (client) {
        client.disconnectUser();
      }
    };
  }, [userId, jwtToken]);

  return { chatClient, isReady };
};

// hooks/useOrderEvents.ts
import { useState, useEffect } from 'react';
import { Event, StreamChat } from 'stream-chat';
import { OrderStatusResponse } from '../types/order';

interface UseOrderEventsOptions {
  chatClient: StreamChat | null;
  orderId: string;
  onStatusChange?: (status: OrderStatusResponse) => void;
}

export const useOrderEvents = ({
  chatClient,
  orderId,
  onStatusChange,
}: UseOrderEventsOptions) => {
  const [status, setStatus] = useState<OrderStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!chatClient || !orderId) return;

    // Listen for custom order events
    const handleOrderEvent = (event: Event) => {
      if (event.type === 'order.status_updated' && event.order_id === orderId) {
        const newStatus: OrderStatusResponse = {
          id: event.order_id,
          status: event.status,
          totalAmount: event.total_amount,
          paymentMethod: event.payment_method,
          paymentStatus: event.payment_status,
          canRetry: event.can_retry || false,
          createdAt: event.created_at,
          updatedAt: event.updated_at || new Date().toISOString(),
        };

        setStatus(newStatus);
        setLoading(false);

        if (onStatusChange) {
          onStatusChange(newStatus);
        }
      }
    };

    // Subscribe to custom events
    chatClient.on(handleOrderEvent);

    // Fetch initial status
    const fetchInitialStatus = async () => {
      try {
        const response = await apiClient.get<BaseResponse<OrderStatusResponse>>(
          `/orders/${orderId}`,
        );

        if (response.statusCode === 200 && response.data) {
          setStatus(response.data);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to fetch initial order status');
      } finally {
        setLoading(false);
      }
    };

    fetchInitialStatus();

    // Cleanup
    return () => {
      chatClient.off(handleOrderEvent);
    };
  }, [chatClient, orderId, onStatusChange]);

  return { status, loading, error };
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

  // Get authenticated user info
  const { userId, jwtToken } = useAuth(); // Your auth hook

  // Connect to Stream Chat
  const { chatClient, isReady } = useStreamChat(userId, jwtToken);

  // Listen for order status updates
  const { status, loading, error } = useOrderEvents({
    chatClient: isReady ? chatClient : null,
    orderId,
    onStatusChange: (newStatus) => {
      if (newStatus.status === OrderStatus.PAID) {
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
        <View style={styles.statusIndicator}>
          <ActivityIndicator size="small" color="#007AFF" />
          <Text style={styles.statusText}>Waiting for payment confirmation...</Text>
        </View>
      )}

      {!isReady && (
        <View style={styles.statusIndicator}>
          <ActivityIndicator size="small" color="#FFA500" />
          <Text style={styles.statusText}>Connecting to real-time updates...</Text>
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
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    padding: 10,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  statusText: {
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

## Installation

### Stream Chat SDK

```bash
npm install stream-chat stream-chat-react-native
# or
yarn add stream-chat stream-chat-react-native

# Install peer dependencies (if not already installed)
npm install @react-native-community/netinfo
```

### Knock SDK for Push Notifications

```bash
npm install @knocklabs/react-native
# or
yarn add @knocklabs/react-native

# Install dependencies
npm install @react-native-firebase/app @react-native-firebase/messaging
npm install @notifee/react-native
```

### Firebase Cloud Messaging Setup

1. **Android**: Add `google-services.json` to `android/app/`
2. **iOS**: Add `GoogleService-Info.plist` to iOS project

See [Knock React Native Documentation](https://docs.knock.app/sdks/react-native/quick-start) for detailed setup.

---

## Best Practices

### 1. Stream Chat Connection Management

```typescript
// Create a reusable context for Stream Chat client
import { StreamChat } from 'stream-chat';
import { createContext, useContext, useEffect, useState } from 'react';

const StreamChatContext = createContext<StreamChat | null>(null);

export const useStreamChatContext = () => {
  const client = useContext(StreamChatContext);
  if (!client) {
    throw new Error('StreamChat client not initialized');
  }
  return client;
};

// In your App.tsx or root provider
export const StreamChatProvider = ({ children, userId, jwtToken }) => {
  const { chatClient, isReady } = useStreamChat(userId, jwtToken);

  if (!isReady) {
    return <LoadingScreen />;
  }

  return (
    <StreamChatContext.Provider value={chatClient}>
      {children}
    </StreamChatContext.Provider>
  );
};
```

### 2. Token Refresh

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

### 3. Real-time Event Best Practices

```typescript
// Always unsubscribe from events when component unmounts
useEffect(() => {
  if (!chatClient) return;

  const handleOrderEvent = (event: Event) => {
    if (event.type === 'order.status_updated') {
      // Handle event
    }
  };

  chatClient.on(handleOrderEvent);

  return () => {
    chatClient.off(handleOrderEvent);
  };
}, [chatClient]);

// Implement fallback to polling if Stream Chat connection fails
const [streamConnected, setStreamConnected] = useState(true);

useEffect(() => {
  if (!streamConnected && paymentMethod === PaymentMethod.CREDIT) {
    // Fallback to polling every 5 seconds
    const pollInterval = setInterval(async () => {
      try {
        const orderStatus = await getOrderStatus(orderId);
        if (orderStatus.status === OrderStatus.PAID) {
          clearInterval(pollInterval);
          // Handle success
        }
      } catch (error) {
        console.error('Polling error:', error);
      }
    }, 5000);

    return () => clearInterval(pollInterval);
  }
}, [streamConnected, paymentMethod, orderId]);

// Monitor connection status
useEffect(() => {
  if (!chatClient) return;

  const handleConnectionChange = (event: Event) => {
    setStreamConnected(event.online ?? true);
  };

  chatClient.on('connection.changed', handleConnectionChange);

  return () => {
    chatClient.off('connection.changed', handleConnectionChange);
  };
}, [chatClient]);
```

### 4. Offline Handling

- Cache order data locally
- Show cached status when offline
- Stream Chat SDK handles offline automatically - events are queued and delivered when back online

```typescript
// Check connection status and show appropriate UI
if (!streamConnected) {
  return (
    <View style={styles.offlineWarning}>
      <Text>You're offline. Reconnecting...</Text>
    </View>
  );
}
```

### 5. Deep Linking

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

### 6. Knock Push Notification Setup

```typescript
// services/knockService.ts
import Knock from '@knocklabs/react-native';
import messaging from '@react-native-firebase/messaging';

export const initializeKnock = async (userId: string, jwtToken: string) => {
  // Get Knock token from backend
  const response = await apiClient.post(
    '/knock/token',
    { userId },
    { headers: { Authorization: `Bearer ${jwtToken}` } },
  );

  const { token } = response.data.data;

  // Initialize Knock
  await Knock.setup({
    publishableKey: 'YOUR_KNOCK_PUBLIC_API_KEY',
    userId,
    userToken: token,
  });

  // Request notification permissions
  const authStatus = await messaging().requestPermission();
  const enabled =
    authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
    authStatus === messaging.AuthorizationStatus.PROVISIONAL;

  if (enabled) {
    // Get FCM token
    const fcmToken = await messaging().getToken();

    // Register FCM token with backend (Knock)
    await apiClient.post(
      '/knock/register-fcm',
      { fcmToken },
      { headers: { Authorization: `Bearer ${jwtToken}` } },
    );

    console.log('FCM token registered with Knock');
  }
};

// Handle incoming notifications
export const setupKnockNotificationHandlers = () => {
  // Foreground notification handler
  messaging().onMessage(async (remoteMessage) => {
    console.log('Notification received in foreground:', remoteMessage);

    // Show in-app notification or update UI
    if (remoteMessage.data?.type === 'order_paid') {
      // Handle order paid notification
      const orderId = remoteMessage.data.orderId;
      // Navigate or update UI
    }
  });

  // Background/Quit notification handler
  messaging().setBackgroundMessageHandler(async (remoteMessage) => {
    console.log('Notification received in background:', remoteMessage);
  });

  // Notification opened handler
  messaging().onNotificationOpenedApp((remoteMessage) => {
    console.log('Notification opened:', remoteMessage);

    // Navigate to appropriate screen
    if (remoteMessage.data?.orderId) {
      // navigation.navigate('OrderDetails', { orderId: remoteMessage.data.orderId });
    }
  });

  // Check if app was opened from a notification (killed state)
  messaging()
    .getInitialNotification()
    .then((remoteMessage) => {
      if (remoteMessage) {
        console.log('App opened from notification:', remoteMessage);
        // Handle navigation
      }
    });
};

// App.tsx or root component
useEffect(() => {
  if (userId && jwtToken) {
    initializeKnock(userId, jwtToken);
    setupKnockNotificationHandlers();
  }
}, [userId, jwtToken]);
```

### 7. Security

- Never log sensitive payment information
- Validate all input on frontend before submitting
- Use HTTPS for all API calls
- Store tokens securely (iOS Keychain, Android Keystore)
- Stream Chat and Knock tokens are generated server-side for security

---

## Testing

### Test Scenarios

1. **CREDIT Payment Success with Real-time Updates**
   - Confirm order with CREDIT method
   - Verify Stream Chat connection is established
   - Display QR code
   - Scan and pay via PayOS
   - **Verify push notification is received** (even if app is in background)
   - Verify real-time event is received (order.status_updated) if app is active
   - Check status changes to PAID instantly without manual refresh

2. **Push Notification Handling**
   - Close the app completely
   - Make a payment via PayOS
   - **Verify push notification appears on device**
   - Tap notification
   - Verify app opens to correct order screen

3. **Foreground Notification**
   - Keep app open and active
   - Complete payment
   - Verify in-app notification or UI update
   - Check that push notification is also delivered

4. **Stream Chat Connection Failure Fallback**
   - Disable or simulate Stream Chat connection failure
   - Confirm order
   - Verify fallback polling mechanism activates
   - **Push notifications still work** via Knock
   - Test that payment status is still detected

5. **CREDIT Payment Timeout**
   - Confirm order
   - Don't complete payment
   - Wait for expiration
   - Verify expiration event is received in real-time
   - Test retry flow

6. **COD Order**
   - Confirm order with COD
   - Verify instant confirmation
   - Check order status is CONFIRMED

7. **Network Errors**
   - Test with airplane mode
   - Verify Stream Chat reconnection when back online
   - Test that pending events are delivered after reconnection
   - Verify error messages

8. **Insufficient Stock**
   - Try ordering more than available stock
   - Verify error handling

9. **Multi-device Notification**
   - Complete payment
   - **Verify push notification on all registered devices**
   - Verify in-app update on active devices
   - Test notification deduplication

10. **FCM Token Registration**
    - Fresh app install
    - Login with credentials
    - **Verify FCM token is registered** with backend
    - Check backend logs for successful registration

---

## Support

For issues or questions:

- Backend API documentation: `/docs/ORDER_PAYMENT_SYSTEM.md`
- Setup guide: `/docs/SETUP.md`
- Error codes reference: `/src/shared/enum/error-code.enum.ts`

---

## Backend Implementation Notes

**For Backend Developers**: The backend automatically handles real-time notifications through two channels when payment is confirmed.

### Implemented Backend Flow

When PayOS webhook confirms payment, the `handlePaymentSuccess` method in `order.service.ts`:

1. **Updates order status** to `PAID` in database
2. **Sends push notification** via Knock to user's device
3. **Triggers post-payment logic** (inventory, analytics, etc.)

### Notification Implementation

```typescript
// src/domain/order/order.service.ts

async handlePaymentSuccess(orderCode: number): Promise<void> {
  // ... order update logic ...

  // Automatically send Knock push notification
  await this.knockService.sendInAppNotification({
    recipients: [order.userId],
    title: 'Payment Successful',
    text: `Your payment of ${order.totalAmount.toLocaleString()} VND has been confirmed. Order #${orderCode}`,
    metadata: {
      orderId: order.id,
      orderCode,
      amount: order.totalAmount,
      type: 'order_paid',
    },
  });

  // Optionally: Send Stream Chat custom event for in-app updates
  try {
    const streamClient = getStreamChatClient();

    await streamClient.sendUserCustomEvent(order.userId, {
      type: 'order.status_updated',
      order_id: order.id,
      status: order.status,
      total_amount: order.totalAmount,
      payment_method: order.paymentMethod,
      payment_status: 'PAID',
      can_retry: false,
      created_at: order.createdAt.toISOString(),
      updated_at: new Date().toISOString(),
    });
  } catch (error) {
    WinstonLogger.error('Failed to send Stream Chat event', {
      metadata: { orderId: order.id, error: error.message },
    });
  }
}
```

### Required Backend Modules

- **KnockModule**: Already imported in `OrderModule`
- **KnockService**: Injected in `OrderService` constructor
- **Stream Chat** (optional): For in-app real-time events

No additional backend changes needed - notifications are sent automatically when PayOS webhook is received.

---

## Configuration

### Required Environment Variables (Backend)

Ensure these are configured in your backend `.env`:

```env
# Knock Configuration
KNOCK_API_KEY=your_knock_api_key
KNOCK_SIGNING_KEY=your_knock_signing_key
KNOCK_PUSH_CHANNEL_ID=your_knock_push_channel_id
KNOCK_IN_APP_WORKFLOW_KEY=your_knock_workflow_key

# Stream Chat Configuration
STREAM_CHAT_API_KEY=your_stream_api_key
STREAM_CHAT_SECRET=your_stream_secret

# PayOS Configuration
PAYOS_CLIENT_ID=your_payos_client_id
PAYOS_API_KEY=your_payos_api_key
PAYOS_CHECKSUM_KEY=your_payos_checksum_key
```

### Required Configuration (React Native)

```typescript
// config.ts
export const CONFIG = {
  API_BASE_URL: 'https://your-api-domain.com',
  KNOCK_PUBLIC_KEY: 'pk_test_xxxxx', // Get from Knock dashboard
  // Stream Chat API key obtained from backend endpoint
};
```

---

## Troubleshooting

### Push Notifications Not Received

1. **Check FCM Token Registration**

   ```typescript
   // Verify token is registered
   const fcmToken = await messaging().getToken();
   console.log('FCM Token:', fcmToken);
   ```

2. **Verify Knock Configuration**
   - Check `KNOCK_PUSH_CHANNEL_ID` in backend
   - Verify FCM credentials in Knock dashboard
   - Test notification from Knock dashboard

3. **Check Notification Permissions**
   ```typescript
   const authStatus = await messaging().requestPermission();
   console.log('Permission status:', authStatus);
   ```

### Stream Chat Events Not Received

1. **Verify Connection**

   ```typescript
   chatClient.on('connection.changed', (event) => {
     console.log('Stream connected:', event.online);
   });
   ```

2. **Check Token Validity**
   - Ensure backend is generating valid tokens
   - Check token expiration

3. **Fallback Active**
   - System should automatically fall back to polling
   - Check console for polling logs

### Payment QR Code Not Loading

1. **Check PayOS Configuration**
   - Verify PayOS credentials in backend `.env`
   - Test PayOS API connectivity

2. **Network Issues**
   - Ensure HTTPS is enabled
   - Check firewall/proxy settings

---

## Changelog

### v2.1.0 (Push Notifications)

- **NEW**: Knock push notifications for payment confirmations
- **NEW**: Push notifications work even when app is closed
- **NEW**: FCM token registration with Knock backend
- **NEW**: Notification handlers for foreground, background, and killed states
- **IMPROVED**: Dual notification system (Stream Chat + Knock) for better reliability
- **IMPROVED**: Notification deep linking to order details

### v2.0.0 (Real-time Updates)

- **NEW**: Real-time order status updates via Stream Chat custom events
- **NEW**: Stream Chat integration for instant payment notifications
- **IMPROVED**: Automatic fallback to polling if Stream Chat connection fails
- **IMPROVED**: Better offline support with event queuing
- **REMOVED**: Primary reliance on polling (now fallback only)
- Order confirmation with CREDIT and COD support
- Retry payment functionality
- Comprehensive error handling

### v1.0.0 (Initial Release)

- Order confirmation with CREDIT and COD support
- Payment status polling
- Retry payment functionality
- Comprehensive error handling
