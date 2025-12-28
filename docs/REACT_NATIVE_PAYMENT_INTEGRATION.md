# React Native Payment Integration Guide

## Overview

This guide covers the complete payment flow integration for React Native apps using the Ventidole Order API. It includes order creation, payment link handling, status polling, and navigation patterns.

## Payment Flow Architecture

```
┌─────────────┐
│   Cart      │
│   Screen    │
└──────┬──────┘
       │ 1. User clicks "Checkout"
       ▼
┌─────────────┐
│  Checkout   │
│   Screen    │──────┐
└──────┬──────┘      │ 2. Select payment method
       │             │    - COD (Cash on Delivery)
       │             │    - CREDIT (PayOS)
       │             └──► Select shipping address
       │ 3. Call POST /v1/orders/confirm
       ▼
┌─────────────────────────┐
│   Order Created         │
│   - COD: CONFIRMED      │
│   - CREDIT: PENDING     │
└──────┬──────────────────┘
       │
       ├─► COD Flow
       │   └──► Navigate to Order Success Screen
       │
       └─► CREDIT Flow
           │ 4. Get paymentLink from response
           ▼
       ┌────────────────┐
       │  Open Payment  │
       │  Link (WebView │
       │  or Browser)   │
       └────────┬───────┘
                │ 5. User completes payment
                │    on PayOS website
                ▼
       ┌────────────────────────┐
       │  PayOS Webhook →       │
       │  Backend receives      │
       │  payment confirmation  │
       └────────┬───────────────┘
                │ 6. Backend sends real-time event
                │    via GetStream
                ▼
       ┌────────────────────────┐
       │  App receives event    │
       │  'order_status_updated'│
       │  Status: CONFIRMED     │
       └────────┬───────────────┘
                │ 7. Instant UI update
                ▼
       ┌────────────────┐
       │  Order Success │
       │     Screen     │
       └────────────────┘
```

### Real-time vs Polling

**✅ New Approach (GetStream Real-time Events):**

- User pays → Webhook triggers backend → GetStream event sent → App receives instantly (~500ms)
- No polling overhead
- Instant status updates
- Battery-efficient
- Works even when app is backgrounded (via push notifications)

**❌ Old Approach (Polling - Deprecated):**

- Poll every 3 seconds → High battery usage
- Variable delay (3-10 seconds)
- Network overhead
- Doesn't work when app is backgrounded

## API Endpoints

### 1. Confirm Order (Create Order)

**Endpoint:** `POST /v1/orders/confirm`

**Headers:**

```javascript
{
  "Authorization": "Bearer {token}",
  "Content-Type": "application/json"
}
```

**Request Body:**

```typescript
interface ConfirmOrderDto {
  paymentMethod: 'CREDIT' | 'COD';
  addressId: string; // UUID of shipping address
}
```

**Response (200 Created):**

```typescript
interface OrderResponseDto {
  orderId: string; // UUID
  orderCode: string | null; // e.g., "ORD-20231227-12345"
  totalAmount: number; // e.g., 150000
  status: OrderStatus; // "PENDING_PAYMENT" | "CONFIRMED" | "PROCESSING" | "SHIPPING" | "COMPLETED" | "CANCELLED"
  paymentMethod: 'CREDIT' | 'COD';
  paymentInfo?: {
    paymentLinkId: string; // PayOS payment link ID
    checkoutUrl: string; // Payment URL to open
    qrCode: string; // QR code for payment (base64 or URL)
  } | null;
  createdAt: string; // ISO 8601 timestamp
}
```

### 2. Get Order Status (Optional - For Fallback)

**Endpoint:** `GET /v1/orders/{orderId}`

**Note:** With GetStream real-time events, polling is no longer needed. This endpoint can be used as a fallback if real-time connection fails.

**Headers:**

```javascript
{
  "Authorization": "Bearer {token}"
}
```

**Response:**

```typescript
// Same as OrderResponseDto above
// paymentInfo will be null if payment is completed
```

### 3. Get User Orders (Order List)

**Endpoint:** `GET /v1/orders?page=1&limit=20&status=CONFIRMED`

**Query Parameters:**

- `page` (optional): Page number, default 1
- `limit` (optional): Items per page, default 20
- `status` (optional): Filter by order status

**Response:**

```typescript
interface OrderListResponse {
  statusCode: number;
  message: string;
  data: OrderListDto[];
  paging: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  error: null;
  errorCode: null;
}

interface OrderListDto {
  id: string;
  orderCode: string | null;
  totalAmount: number;
  status: OrderStatus;
  paymentMethod: 'CREDIT' | 'COD';
  itemCount: number;
  createdAt: string;
  paidAt: string | null;
}
```

### 4. Get Order Details

**Endpoint:** `GET /v1/orders/{orderId}/details`

**Response:**

```typescript
interface OrderDetailDto {
  id: string;
  orderCode: string | null;
  totalAmount: number;
  status: OrderStatus;
  paymentMethod: 'CREDIT' | 'COD';
  shippingAddress: string; // JSON string containing address details
  items: OrderItemDto[];
  createdAt: string;
  paidAt: string | null;
}

interface OrderItemDto {
  id: string;
  productId: string;
  productName: string;
  variantId: string | null;
  variantName: string | null;
  price: number;
  quantity: number;
  mediaUrls: string[]; // Array of image URLs
}
```

### 5. Retry Payment (Failed Payment)

**Endpoint:** `POST /v1/orders/{orderId}/retry-payment`

**Use Case:** When payment link expires or user needs to retry payment

**Response:** Same as OrderResponseDto

## React Native Implementation

### 1. API Service (TypeScript)

```typescript
// services/orderApi.ts
import axios from 'axios';

const API_BASE_URL = 'https://your-api.com/v1';

export interface ConfirmOrderRequest {
  paymentMethod: 'CREDIT' | 'COD';
  addressId: string;
}

export interface OrderResponse {
  orderId: string;
  orderCode: string | null;
  totalAmount: number;
  status: string;
  paymentMethod: string;
  paymentInfo?: {
    paymentLinkId: string;
    checkoutUrl: string;
    qrCode: string;
  } | null;
  createdAt: string;
}

class OrderService {
  private getHeaders(token: string) {
    return {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }

  async confirmOrder(
    token: string,
    data: ConfirmOrderRequest,
  ): Promise<OrderResponse> {
    const response = await axios.post(`${API_BASE_URL}/orders/confirm`, data, {
      headers: this.getHeaders(token),
    });
    return response.data.data;
  }

  async getOrderStatus(token: string, orderId: string): Promise<OrderResponse> {
    const response = await axios.get(`${API_BASE_URL}/orders/${orderId}`, {
      headers: this.getHeaders(token),
    });
    return response.data.data;
  }

  async getUserOrders(
    token: string,
    page: number = 1,
    limit: number = 20,
    status?: string,
  ) {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(status && { status }),
    });

    const response = await axios.get(`${API_BASE_URL}/orders?${params}`, {
      headers: this.getHeaders(token),
    });
    return response.data;
  }

  async getOrderDetails(token: string, orderId: string) {
    const response = await axios.get(
      `${API_BASE_URL}/orders/${orderId}/details`,
      { headers: this.getHeaders(token) },
    );
    return response.data.data;
  }

  async retryPayment(token: string, orderId: string): Promise<OrderResponse> {
    const response = await axios.post(
      `${API_BASE_URL}/orders/${orderId}/retry-payment`,
      {},
      { headers: this.getHeaders(token) },
    );
    return response.data.data;
  }
}

export default new OrderService();
```

### 2. Checkout Screen Component

```typescript
// screens/CheckoutScreen.tsx
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert, Linking } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import orderService from '../services/orderApi';

interface CheckoutScreenProps {
  route: {
    params: {
      cartTotal: number;
      addressId: string;
    };
  };
}

export const CheckoutScreen: React.FC<CheckoutScreenProps> = ({ route }) => {
  const navigation = useNavigation();
  const { cartTotal, addressId } = route.params;
  const [loading, setLoading] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<'COD' | 'CREDIT'>('COD');

  const handleConfirmOrder = async () => {
    try {
      setLoading(true);

      // Get auth token from your auth context/storage
      const token = await getAuthToken(); // Implement this

      const orderData = {
        paymentMethod: selectedPayment,
        addressId: addressId,
      };

      const response = await orderService.confirmOrder(token, orderData);

      if (selectedPayment === 'COD') {
        // COD order is immediately confirmed
        navigation.replace('OrderSuccess', {
          orderId: response.orderId,
          orderCode: response.orderCode,
          totalAmount: response.totalAmount,
        });
      } else {
        // CREDIT payment - need to open payment link
        if (response.paymentInfo?.checkoutUrl) {
          // Navigate to payment webview screen
          navigation.replace('PaymentWebView', {
            orderId: response.orderId,
            paymentUrl: response.paymentInfo.checkoutUrl,
            totalAmount: response.totalAmount,
          });
        } else {
          Alert.alert('Error', 'Payment link not available');
        }
      }
    } catch (error: any) {
      Alert.alert(
        'Order Failed',
        error.response?.data?.message || 'Failed to create order'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ padding: 16 }}>
      <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 16 }}>
        Checkout
      </Text>

      {/* Payment Method Selection */}
      <View style={{ marginBottom: 24 }}>
        <Text style={{ fontSize: 16, marginBottom: 8 }}>Payment Method</Text>

        <TouchableOpacity
          style={{
            padding: 16,
            borderWidth: 1,
            borderColor: selectedPayment === 'COD' ? '#007AFF' : '#ccc',
            borderRadius: 8,
            marginBottom: 8,
          }}
          onPress={() => setSelectedPayment('COD')}
        >
          <Text>💵 Cash on Delivery (COD)</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={{
            padding: 16,
            borderWidth: 1,
            borderColor: selectedPayment === 'CREDIT' ? '#007AFF' : '#ccc',
            borderRadius: 8,
          }}
          onPress={() => setSelectedPayment('CREDIT')}
        >
          <Text>💳 Credit Card / QR Payment (PayOS)</Text>
        </TouchableOpacity>
      </View>

      {/* Total Amount */}
      <View style={{ marginBottom: 24 }}>
        <Text style={{ fontSize: 18, fontWeight: 'bold' }}>
          Total: {cartTotal.toLocaleString('vi-VN')} ₫
        </Text>
      </View>

      {/* Confirm Button */}
      <TouchableOpacity
        style={{
          backgroundColor: loading ? '#ccc' : '#007AFF',
          padding: 16,
          borderRadius: 8,
          alignItems: 'center',
        }}
        onPress={handleConfirmOrder}
        disabled={loading}
      >
        <Text style={{ color: 'white', fontSize: 16, fontWeight: 'bold' }}>
          {loading ? 'Processing...' : 'Confirm Order'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};
```

### 3. Payment WebView Screen (With Real-time Events)

```typescript
// screens/PaymentWebViewScreen.tsx
import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, Alert, BackHandler, Text } from 'react-native';
import { WebView } from 'react-native-webview';
import { useNavigation } from '@react-navigation/native';
import { useStreamChat } from '../hooks/useStreamChat';
import { useOrderStatusEvents } from '../hooks/useOrderStatusEvents';
import { getAuthToken, getUserId } from '../utils/auth'; // Your auth utilities

interface PaymentWebViewProps {
  route: {
    params: {
      orderId: string;
      paymentUrl: string;
      totalAmount: number;
      orderCode: string | null;
    };
  };
}

export const PaymentWebViewScreen: React.FC<PaymentWebViewProps> = ({ route }) => {
  const navigation = useNavigation();
  const { orderId, paymentUrl, totalAmount, orderCode } = route.params;
  const [loading, setLoading] = useState(true);
  const [streamStatus, setStreamStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');

  // Get user info
  const [userId, setUserId] = useState<string>('');
  const [jwtToken, setJwtToken] = useState<string>('');

  useEffect(() => {
    const loadUserInfo = async () => {
      const id = await getUserId();
      const token = await getAuthToken();
      setUserId(id);
      setJwtToken(token);
    };
    loadUserInfo();
  }, []);

  // Connect to Stream Chat
  const { chatClient, isReady } = useStreamChat(userId, jwtToken);

  useEffect(() => {
    if (isReady) {
      setStreamStatus('connected');
    }
  }, [isReady]);

  // Listen for order status events
  useOrderStatusEvents({
    chatClient: isReady ? chatClient : null,
    orderId,
    onStatusChange: (event) => {
      if (event.status === 'paid') {
        // Payment successful!
        Alert.alert(
          '✅ Payment Successful',
          `Your payment of ${totalAmount.toLocaleString('vi-VN')} ₫ has been confirmed.`,
          [
            {
              text: 'View Order',
              onPress: () => {
                navigation.replace('OrderSuccess', {
                  orderId,
                  orderCode: event.orderCode,
                  totalAmount,
                });
              },
            },
          ],
          { cancelable: false }
        );
      }
    },
  });

  // Handle Android back button
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      Alert.alert(
        'Cancel Payment?',
        'Are you sure you want to cancel this payment?',
        [
          { text: 'No', style: 'cancel' },
          {
            text: 'Yes',
            onPress: () => navigation.goBack(),
          },
        ]
      );
      return true; // Prevent default back action
    });

    return () => {
      backHandler.remove();
    };
  }, []);

  return (
    <View style={{ flex: 1 }}>
      {/* Connection Status Indicator */}
      {streamStatus !== 'connected' && (
        <View
          style={{
            backgroundColor: streamStatus === 'connecting' ? '#FFA500' : '#F44336',
            padding: 8,
            alignItems: 'center',
          }}
        >
          <Text style={{ color: 'white', fontSize: 12 }}>
            {streamStatus === 'connecting'
              ? '🔄 Connecting to real-time updates...'
              : '⚠️ Real-time updates unavailable'}
          </Text>
        </View>
      )}

      <WebView
        source={{ uri: paymentUrl }}
        onLoadStart={() => setLoading(true)}
        onLoadEnd={() => setLoading(false)}
        style={{ flex: 1 }}
        javaScriptEnabled={true}
        domStorageEnabled={true}
      />

      {loading && (
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: 'rgba(255,255,255,0.8)',
          }}
        >
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={{ marginTop: 12, color: '#666' }}>
            Loading payment gateway...
          </Text>
        </View>
      )}
    </View>
  );
};
```

### 4. Order Success Screen

```typescript
// screens/OrderSuccessScreen.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import orderService from '../services/orderApi';

interface OrderSuccessProps {
  route: {
    params: {
      orderId: string;
      orderCode: string | null;
      totalAmount: number;
    };
  };
}

export const OrderSuccessScreen: React.FC<OrderSuccessProps> = ({ route }) => {
  const navigation = useNavigation();
  const { orderId, orderCode, totalAmount } = route.params;
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrderDetails();
  }, []);

  const loadOrderDetails = async () => {
    try {
      const token = await getAuthToken();
      const details = await orderService.getOrderDetails(token, orderId);
      setOrderDetails(details);
    } catch (error) {
      console.error('Failed to load order details:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: 'white' }}>
      <View style={{ padding: 16, alignItems: 'center' }}>
        {/* Success Icon */}
        <View
          style={{
            width: 80,
            height: 80,
            borderRadius: 40,
            backgroundColor: '#4CAF50',
            justifyContent: 'center',
            alignItems: 'center',
            marginVertical: 24,
          }}
        >
          <Text style={{ fontSize: 48, color: 'white' }}>✓</Text>
        </View>

        <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 8 }}>
          Order Placed Successfully!
        </Text>

        {orderCode && (
          <Text style={{ fontSize: 16, color: '#666', marginBottom: 4 }}>
            Order Code: {orderCode}
          </Text>
        )}

        <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 24 }}>
          Total: {totalAmount.toLocaleString('vi-VN')} ₫
        </Text>

        {/* Order Items */}
        {!loading && orderDetails && (
          <View style={{ width: '100%', marginBottom: 24 }}>
            <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 12 }}>
              Order Items
            </Text>
            {orderDetails.items.map((item: any) => (
              <View
                key={item.id}
                style={{
                  flexDirection: 'row',
                  padding: 12,
                  backgroundColor: '#f5f5f5',
                  borderRadius: 8,
                  marginBottom: 8,
                }}
              >
                {item.mediaUrls?.[0] && (
                  <Image
                    source={{ uri: item.mediaUrls[0] }}
                    style={{ width: 60, height: 60, borderRadius: 8, marginRight: 12 }}
                  />
                )}
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 16, fontWeight: '600' }}>
                    {item.productName}
                  </Text>
                  {item.variantName && (
                    <Text style={{ fontSize: 14, color: '#666' }}>
                      {item.variantName}
                    </Text>
                  )}
                  <Text style={{ fontSize: 14, marginTop: 4 }}>
                    {item.quantity} x {item.price.toLocaleString('vi-VN')} ₫
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Action Buttons */}
        <TouchableOpacity
          style={{
            backgroundColor: '#007AFF',
            padding: 16,
            borderRadius: 8,
            width: '100%',
            alignItems: 'center',
            marginBottom: 12,
          }}
          onPress={() => navigation.navigate('OrderList')}
        >
          <Text style={{ color: 'white', fontSize: 16, fontWeight: 'bold' }}>
            View My Orders
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={{
            borderWidth: 1,
            borderColor: '#007AFF',
            padding: 16,
            borderRadius: 8,
            width: '100%',
            alignItems: 'center',
          }}
          onPress={() => navigation.navigate('Home')}
        >
          <Text style={{ color: '#007AFF', fontSize: 16, fontWeight: 'bold' }}>
            Continue Shopping
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};
```

### 5. Order List Screen

```typescript
// screens/OrderListScreen.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import orderService from '../services/orderApi';

export const OrderListScreen: React.FC = () => {
  const navigation = useNavigation();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedStatus, setSelectedStatus] = useState<string | undefined>();

  const loadOrders = async (pageNum: number = 1, refresh: boolean = false) => {
    try {
      if (refresh) setRefreshing(true);
      else setLoading(true);

      const token = await getAuthToken();
      const response = await orderService.getUserOrders(
        token,
        pageNum,
        20,
        selectedStatus
      );

      if (refresh || pageNum === 1) {
        setOrders(response.data);
      } else {
        setOrders([...orders, ...response.data]);
      }

      setPage(pageNum);
      setTotalPages(response.paging.totalPages);
    } catch (error) {
      console.error('Failed to load orders:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadOrders(1);
  }, [selectedStatus]);

  const handleLoadMore = () => {
    if (page < totalPages && !loading) {
      loadOrders(page + 1);
    }
  };

  const renderOrderItem = ({ item }: { item: any }) => {
    const statusColors: Record<string, string> = {
      PENDING_PAYMENT: '#FF9800',
      CONFIRMED: '#4CAF50',
      PROCESSING: '#2196F3',
      SHIPPING: '#9C27B0',
      COMPLETED: '#4CAF50',
      CANCELLED: '#F44336',
    };

    return (
      <TouchableOpacity
        style={{
          padding: 16,
          backgroundColor: 'white',
          borderRadius: 8,
          marginHorizontal: 16,
          marginBottom: 12,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 3,
        }}
        onPress={() =>
          navigation.navigate('OrderDetail', { orderId: item.id })
        }
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
          <Text style={{ fontSize: 16, fontWeight: 'bold' }}>
            {item.orderCode || `Order #${item.id.slice(0, 8)}`}
          </Text>
          <View
            style={{
              backgroundColor: statusColors[item.status] || '#666',
              paddingHorizontal: 8,
              paddingVertical: 4,
              borderRadius: 4,
            }}
          >
            <Text style={{ color: 'white', fontSize: 12, fontWeight: '600' }}>
              {item.status}
            </Text>
          </View>
        </View>

        <Text style={{ fontSize: 14, color: '#666', marginBottom: 4 }}>
          {item.itemCount} item(s) • {item.paymentMethod}
        </Text>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
          <Text style={{ fontSize: 16, fontWeight: 'bold' }}>
            {item.totalAmount.toLocaleString('vi-VN')} ₫
          </Text>
          <Text style={{ fontSize: 12, color: '#999' }}>
            {new Date(item.createdAt).toLocaleDateString('vi-VN')}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#f5f5f5' }}>
      {/* Status Filter */}
      <ScrollView
        horizontal
        style={{ maxHeight: 60, paddingVertical: 12 }}
        contentContainerStyle={{ paddingHorizontal: 16 }}
        showsHorizontalScrollIndicator={false}
      >
        {['All', 'PENDING_PAYMENT', 'CONFIRMED', 'PROCESSING', 'SHIPPING', 'COMPLETED'].map(
          (status) => (
            <TouchableOpacity
              key={status}
              style={{
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 20,
                backgroundColor:
                  (status === 'All' ? !selectedStatus : selectedStatus === status)
                    ? '#007AFF'
                    : '#e0e0e0',
                marginRight: 8,
              }}
              onPress={() => setSelectedStatus(status === 'All' ? undefined : status)}
            >
              <Text
                style={{
                  color:
                    (status === 'All' ? !selectedStatus : selectedStatus === status)
                      ? 'white'
                      : '#666',
                  fontWeight: '600',
                }}
              >
                {status}
              </Text>
            </TouchableOpacity>
          )
        )}
      </ScrollView>

      {/* Order List */}
      <FlatList
        data={orders}
        renderItem={renderOrderItem}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => loadOrders(1, true)} />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={() =>
          loading && page > 1 ? <ActivityIndicator style={{ padding: 16 }} /> : null
        }
        ListEmptyComponent={() =>
          !loading ? (
            <View style={{ padding: 32, alignItems: 'center' }}>
              <Text style={{ fontSize: 16, color: '#999' }}>No orders found</Text>
            </View>
          ) : null
        }
      />
    </View>
  );
};
```

## Navigation Setup

Add these screens to your React Navigation stack:

```typescript
// navigation/AppNavigator.tsx
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { CheckoutScreen } from '../screens/CheckoutScreen';
import { PaymentWebViewScreen } from '../screens/PaymentWebViewScreen';
import { OrderSuccessScreen } from '../screens/OrderSuccessScreen';
import { OrderListScreen } from '../screens/OrderListScreen';
import { OrderDetailScreen } from '../screens/OrderDetailScreen';

const Stack = createNativeStackNavigator();

export const OrderNavigator = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="Checkout"
        component={CheckoutScreen}
        options={{ title: 'Checkout' }}
      />
      <Stack.Screen
        name="PaymentWebView"
        component={PaymentWebViewScreen}
        options={{
          title: 'Payment',
          headerLeft: () => null, // Disable back button
        }}
      />
      <Stack.Screen
        name="OrderSuccess"
        component={OrderSuccessScreen}
        options={{
          title: 'Order Confirmed',
          headerLeft: () => null, // Disable back button
        }}
      />
      <Stack.Screen
        name="OrderList"
        component={OrderListScreen}
        options={{ title: 'My Orders' }}
      />
      <Stack.Screen
        name="OrderDetail"
        component={OrderDetailScreen}
        options={{ title: 'Order Details' }}
      />
    </Stack.Navigator>
  );
};
```

## Dependencies Required

```bash
npm install react-native-webview
npm install @react-navigation/native @react-navigation/native-stack
npm install axios
npm install stream-chat stream-chat-react-native
```

## GetStream Setup

### 1. Get Stream Chat Token

First, get the Stream Chat authentication token from your backend:

```typescript
// services/streamChatService.ts
export interface StreamAuthResponse {
  token: string;
  apiKey: string;
  userId: string;
}

export const getStreamToken = async (
  userId: string,
  jwtToken: string,
): Promise<StreamAuthResponse> => {
  const response = await axios.get(`${API_BASE_URL}/stream-chat/token`, {
    headers: {
      Authorization: `Bearer ${jwtToken}`,
    },
  });
  return response.data.data;
};
```

### 2. Connect to Stream Chat

```typescript
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

        await client.connectUser({ id: userId }, streamAuth.token);

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
```

### 3. Listen for Order Events

```typescript
// hooks/useOrderStatusEvents.ts
import { useState, useEffect } from 'react';
import { StreamChat, Event } from 'stream-chat';

interface OrderStatusEvent {
  type: 'order_status_updated';
  orderId: string;
  orderCode: string;
  status: 'paid' | 'confirmed' | 'shipped' | 'delivered';
  trackingNumber?: string;
}

interface UseOrderStatusEventsOptions {
  chatClient: StreamChat | null;
  orderId: string;
  onStatusChange: (event: OrderStatusEvent) => void;
}

export const useOrderStatusEvents = ({
  chatClient,
  orderId,
  onStatusChange,
}: UseOrderStatusEventsOptions) => {
  useEffect(() => {
    if (!chatClient) return;

    const handleEvent = (event: Event) => {
      // GetStream sends custom events to user's notification channel
      if (event.type === 'order_status_updated') {
        const data = event.data as OrderStatusEvent;

        // Only handle events for this specific order
        if (data.orderId === orderId) {
          onStatusChange(data);
        }
      }
    };

    // Subscribe to custom events
    chatClient.on(handleEvent);

    return () => {
      chatClient.off(handleEvent);
    };
  }, [chatClient, orderId, onStatusChange]);
};
```

## Best Practices

### 1. **Error Handling**

- Always wrap API calls in try-catch blocks
- Handle GetStream connection errors gracefully

### 2. **Loading States**

- Show loading indicators during API calls
- Disable buttons during processing
- Provide feedback to users
- Show Stream connection status

### 3. **Real-time Event Handling**

- Always unsubscribe from events on component unmount
- Handle reconnection scenarios (app backgrounding, network loss)
- Implement fallback to API polling if Stream connection fails
- Show connection status to user

### 4. **Security**

- Store auth tokens securely (use AsyncStorage or Keychain)
- Never expose sensitive data in navigation params
- Validate payment status server-side (backend handles this)
- Stream Chat tokens are generated server-side

### 5. **User Experience**

- Prevent accidental payment cancellation (confirm dialog)
- Show payment progress clearly
- Provide instant feedback via real-time events
- Handle payment completion even when app is backgrounded (via push notifications)
- Clear navigation flow without confusing back buttons

### 6. **Performance**

- Real-time events are more efficient than polling
- Reduced battery consumption
- Lower network usage
- Instant updates (< 1 second vs 3-10 seconds with polling)
- Provide retry options for failed payments
- Clear navigation flow without confusing back buttons

## Payment Status Flow

````
Order Status Transitions:

COD Flow:
CONFIRMED ──► PROCESSING ──► SHIPPING ──► COMPLETED
GetStream connection establishment
- [ ] Real-time payment confirmation (< 1 second)
- [ ] Successful payment flow with instant update
- [ ] Failed payment handling
- [ ] Payment retry functionality
- [ ] Order list pagination
- [ ] Order details display
- [ ] Network error handling
- [ ] GetStream reconnection after network loss
- [ ] Back button behavior during payment
- [ ] App backgrounding during payment
- [ ] Real-time events while app in background
- [ ] Stream connection status indicator
- [ ] COD order creation
- [ ] Credit card payment link opening
- [ ] Payment status polling
- [ ] Successful payment flow
- [ ] Failed payment handling
- [ ] Payment retry functionality
- [ ] Order list pagination
- [ ] Order details display
- [ ] Network error handling
- [ ] Back button behavior during payment
- [ ] App backgrounding during payment

## Support & Troubleshooting

### Common Issues

**1. Payment link not opening**
- CheReal-time events not received**
- Verify GetStream connection is established (`chatClient.connectionId` exists)
- Check Stream Chat token is valid
- Ensure user is connected: `chatClient.user.id` matches your userId
- Verify backend is sending events via `GetStreamNotificationService`
- Check event listener is properly registered

**3. GetStream connection failing**
- Verify API endpoint `/stream-chat/token` is accessible
- Check JWT token is valid
- Ensure Stream Chat API key is correct
- Check network connectivity
- Implement fallback to polling if needed

**4. Order not found**
- Verify user is authenticated
- Check orderId format (should be UUID)
- Ensure order belongs to user

**5. Cart items not cleared**
- Backend automatically clears cart on order creation
- Refresh cart after successful order
- Check backend logs if items persist

**6. Events received for wrong order**
- Ensure you filter events by orderId: `if (event.data.orderId === orderId)`
- Check that event listeners are cleaned up properly on unmount

### GetStream Event Structure

The backend sends events in this format:

```typescript
{
  type: 'order_status_updated',
  title: 'Order Update',
  message: 'Your payment has been confirmed', // or other status messages
  url: '/orders/{orderId}',
  data: {
    orderId: string,
    orderCode: string,
    status: 'paid' | 'confirmed' | 'shipped' | 'delivered',
    trackingNumber?: string
  }
}
````

### Debugging GetStream

```typescript
// Check if connected
console.log('Stream connected:', chatClient?.user?.id);
console.log('Connection ID:', chatClient?.connectionId);

// Log all events (for debugging only)
chatClient.on((event) => {
  console.log('Stream event:', event.type, event);
});

// Check notification channel exists
const channel = chatClient.channel('messaging', `notifications-${userId}`);
await channel.watch();
console.log('Channel state:', channel.state);
```

**4. Cart items not cleared**

- Backend automatically clears cart on order creation
- Refresh cart after successful order
- Check backend logs if items persist

---

**Last Updated:** December 27, 2025  
**API Version:** v1  
**React Native Version:** 0.72+
