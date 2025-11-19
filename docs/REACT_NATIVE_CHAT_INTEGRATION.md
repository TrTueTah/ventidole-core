# React Native Chat WebSocket Integration

## 📱 Step-by-Step Integration Guide

### 1. Install Dependencies
```bash
npm install socket.io-client @react-native-async-storage/async-storage
# or
yarn add socket.io-client @react-native-async-storage/async-storage
```

### 2. Create Chat Service (`services/ChatService.js`)

```javascript
import { io } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';

class ChatService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.listeners = new Map();
  }

  /**
   * Initialize and connect to chat server
   */
  async connect(serverUrl = 'http://your-server.com') {
    try {
      // Get JWT token from storage
      const token = await AsyncStorage.getItem('authToken');
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      // Create socket connection
      this.socket = io(`${serverUrl}/chat`, {
        auth: {
          token: token
        },
        transports: ['websocket', 'polling'], // React Native compatibility
        timeout: 10000,
      });

      this.setupEventHandlers();
      
      return new Promise((resolve, reject) => {
        this.socket.on('connect', () => {
          this.isConnected = true;
          console.log('✅ Connected to chat server');
          resolve(true);
        });

        this.socket.on('connect_error', (error) => {
          console.error('❌ Connection error:', error);
          reject(error);
        });
      });
    } catch (error) {
      console.error('Chat connection error:', error);
      throw error;
    }
  }

  /**
   * Setup all event handlers
   */
  setupEventHandlers() {
    // Connection events
    this.socket.on('disconnect', (reason) => {
      this.isConnected = false;
      console.log('Disconnected:', reason);
      this.emit('disconnected', { reason });
    });

    // Message events
    this.socket.on('new_message', (message) => {
      this.emit('newMessage', message);
    });

    this.socket.on('message_updated', (message) => {
      this.emit('messageUpdated', message);
    });

    this.socket.on('message_deleted', (data) => {
      this.emit('messageDeleted', data);
    });

    this.socket.on('message_read_receipt', (data) => {
      this.emit('messageReadReceipt', data);
    });

    // Typing events
    this.socket.on('user_typing', (data) => {
      this.emit('userTyping', data);
    });

    // Channel events
    this.socket.on('new_channel', (channel) => {
      this.emit('newChannel', channel);
    });

    // User status events
    this.socket.on('user_status_changed', (data) => {
      this.emit('userStatusChanged', data);
    });
  }

  /**
   * Join a chat channel
   */
  joinChannel(channelId) {
    if (!this.isConnected) {
      throw new Error('Not connected to chat server');
    }

    return new Promise((resolve, reject) => {
      this.socket.emit('join_channel', { channelId }, (response) => {
        if (response.error) {
          reject(new Error(response.error));
        } else {
          resolve(response);
        }
      });
    });
  }

  /**
   * Leave a chat channel
   */
  leaveChannel(channelId) {
    if (!this.isConnected) return;

    this.socket.emit('leave_channel', { channelId });
  }

  /**
   * Send typing indicator
   */
  startTyping(channelId, userName) {
    if (!this.isConnected) return;

    this.socket.emit('typing_start', { channelId, userName });
  }

  /**
   * Stop typing indicator
   */
  stopTyping(channelId) {
    if (!this.isConnected) return;

    this.socket.emit('typing_stop', { channelId });
  }

  /**
   * Mark message as read
   */
  markMessageAsRead(channelId, messageId) {
    if (!this.isConnected) return;

    this.socket.emit('message_read', { channelId, messageId });
  }

  /**
   * Event listener system
   */
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  off(event, callback) {
    if (!this.listeners.has(event)) return;
    
    const callbacks = this.listeners.get(event);
    const index = callbacks.indexOf(callback);
    if (index > -1) {
      callbacks.splice(index, 1);
    }
  }

  emit(event, data) {
    if (!this.listeners.has(event)) return;
    
    this.listeners.get(event).forEach(callback => {
      callback(data);
    });
  }

  /**
   * Disconnect from server
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.listeners.clear();
    }
  }

  /**
   * Check connection status
   */
  getConnectionStatus() {
    return this.isConnected;
  }
}

// Export singleton instance
export default new ChatService();
```

### 3. React Native Chat Hook (`hooks/useChat.js`)

```javascript
import { useState, useEffect, useCallback, useRef } from 'react';
import ChatService from '../services/ChatService';

export const useChat = (channelId = null) => {
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);
  const [error, setError] = useState(null);
  const typingTimeoutRef = useRef(null);

  // Connect to chat service
  const connect = useCallback(async (serverUrl) => {
    try {
      setError(null);
      await ChatService.connect(serverUrl);
      setIsConnected(true);
    } catch (err) {
      setError(err.message);
      setIsConnected(false);
    }
  }, []);

  // Join channel
  const joinChannel = useCallback(async (targetChannelId) => {
    try {
      const chId = targetChannelId || channelId;
      if (!chId) return;
      
      await ChatService.joinChannel(chId);
    } catch (err) {
      setError(err.message);
    }
  }, [channelId]);

  // Send typing indicator
  const sendTyping = useCallback((userName) => {
    if (!channelId) return;
    
    ChatService.startTyping(channelId, userName);
    
    // Auto-stop typing after 3 seconds
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    typingTimeoutRef.current = setTimeout(() => {
      ChatService.stopTyping(channelId);
    }, 3000);
  }, [channelId]);

  // Stop typing indicator
  const stopTyping = useCallback(() => {
    if (!channelId) return;
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
    
    ChatService.stopTyping(channelId);
  }, [channelId]);

  // Mark message as read
  const markAsRead = useCallback((messageId) => {
    if (!channelId) return;
    
    ChatService.markMessageAsRead(channelId, messageId);
  }, [channelId]);

  // Setup event listeners
  useEffect(() => {
    // New message handler
    const handleNewMessage = (message) => {
      // Only add if message belongs to current channel
      if (!channelId || message.channelId === channelId) {
        setMessages(prev => [...prev, message]);
      }
    };

    // Message updated handler
    const handleMessageUpdated = (updatedMessage) => {
      if (!channelId || updatedMessage.channelId === channelId) {
        setMessages(prev => 
          prev.map(msg => 
            msg.id === updatedMessage.id ? updatedMessage : msg
          )
        );
      }
    };

    // Message deleted handler
    const handleMessageDeleted = ({ channelId: msgChannelId, messageId }) => {
      if (!channelId || msgChannelId === channelId) {
        setMessages(prev => prev.filter(msg => msg.id !== messageId));
      }
    };

    // Typing indicator handler
    const handleUserTyping = ({ channelId: typingChannelId, userId, userName, isTyping }) => {
      if (!channelId || typingChannelId === channelId) {
        setTypingUsers(prev => {
          if (isTyping) {
            // Add user to typing list if not already there
            return prev.find(u => u.userId === userId) 
              ? prev 
              : [...prev, { userId, userName }];
          } else {
            // Remove user from typing list
            return prev.filter(u => u.userId !== userId);
          }
        });
      }
    };

    // Connection status handlers
    const handleDisconnected = () => {
      setIsConnected(false);
    };

    // Register event listeners
    ChatService.on('newMessage', handleNewMessage);
    ChatService.on('messageUpdated', handleMessageUpdated);
    ChatService.on('messageDeleted', handleMessageDeleted);
    ChatService.on('userTyping', handleUserTyping);
    ChatService.on('disconnected', handleDisconnected);

    // Cleanup function
    return () => {
      ChatService.off('newMessage', handleNewMessage);
      ChatService.off('messageUpdated', handleMessageUpdated);
      ChatService.off('messageDeleted', handleMessageDeleted);
      ChatService.off('userTyping', handleUserTyping);
      ChatService.off('disconnected', handleDisconnected);
      
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [channelId]);

  // Auto-join channel when connected
  useEffect(() => {
    if (isConnected && channelId) {
      joinChannel();
    }
  }, [isConnected, channelId, joinChannel]);

  return {
    isConnected,
    messages,
    typingUsers,
    error,
    connect,
    joinChannel,
    sendTyping,
    stopTyping,
    markAsRead,
    disconnect: () => ChatService.disconnect(),
  };
};
```

### 4. Chat Screen Component (`screens/ChatScreen.js`)

```javascript
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useChat } from '../hooks/useChat';

const ChatScreen = ({ route, navigation }) => {
  const { channelId, channelName } = route.params;
  const [messageText, setMessageText] = useState('');
  const [user, setUser] = useState(null);
  const flatListRef = useRef(null);
  
  const {
    isConnected,
    messages,
    typingUsers,
    error,
    connect,
    sendTyping,
    stopTyping,
    markAsRead,
  } = useChat(channelId);

  // Load user data and connect
  useEffect(() => {
    const initializeChat = async () => {
      try {
        // Load user data (replace with your user service)
        const userData = await getUserData(); // Your user service
        setUser(userData);

        // Connect to chat server
        await connect('http://your-server.com'); // Replace with your server URL
      } catch (err) {
        Alert.alert('Connection Error', err.message);
      }
    };

    initializeChat();
  }, [connect]);

  // Handle sending message
  const sendMessage = async () => {
    if (!messageText.trim() || !isConnected) return;

    try {
      // Send message via REST API (not WebSocket)
      const response = await fetch(`http://your-server.com/api/chat/channels/${channelId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await getAuthToken()}`, // Your auth token
        },
        body: JSON.stringify({
          content: messageText,
          type: 'TEXT',
        }),
      });

      if (response.ok) {
        setMessageText('');
        stopTyping();
        
        // Scroll to bottom
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      } else {
        throw new Error('Failed to send message');
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to send message');
    }
  };

  // Handle typing
  const handleTextChange = (text) => {
    setMessageText(text);
    
    if (text.length > 0 && user) {
      sendTyping(user.name);
    } else {
      stopTyping();
    }
  };

  // Render message item
  const renderMessage = ({ item }) => (
    <View style={[
      styles.messageContainer,
      item.senderId === user?.id ? styles.sentMessage : styles.receivedMessage
    ]}>
      <Text style={styles.senderName}>{item.senderName}</Text>
      <Text style={styles.messageContent}>{item.content}</Text>
      <Text style={styles.timestamp}>
        {new Date(item.createdAt).toLocaleTimeString()}
      </Text>
    </View>
  );

  // Render typing indicator
  const renderTypingIndicator = () => {
    if (typingUsers.length === 0) return null;

    const typingText = typingUsers.length === 1
      ? `${typingUsers[0].userName} is typing...`
      : `${typingUsers.length} people are typing...`;

    return (
      <View style={styles.typingContainer}>
        <Text style={styles.typingText}>{typingText}</Text>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{channelName}</Text>
        <View style={[
          styles.connectionStatus,
          { backgroundColor: isConnected ? '#4CAF50' : '#f44336' }
        ]}>
          <Text style={styles.connectionText}>
            {isConnected ? 'Connected' : 'Connecting...'}
          </Text>
        </View>
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Error: {error}</Text>
        </View>
      )}

      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        style={styles.messagesList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        onEndReached={() => {
          // Mark messages as read when scrolled to bottom
          if (messages.length > 0) {
            const latestMessage = messages[messages.length - 1];
            markAsRead(latestMessage.id);
          }
        }}
      />

      {renderTypingIndicator()}

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          value={messageText}
          onChangeText={handleTextChange}
          placeholder="Type a message..."
          multiline
          maxLength={1000}
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            { opacity: messageText.trim() && isConnected ? 1 : 0.5 }
          ]}
          onPress={sendMessage}
          disabled={!messageText.trim() || !isConnected}
        >
          <Text style={styles.sendButtonText}>Send</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  connectionStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  connectionText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  errorContainer: {
    backgroundColor: '#ffebee',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  errorText: {
    color: '#d32f2f',
    textAlign: 'center',
  },
  messagesList: {
    flex: 1,
    padding: 16,
  },
  messageContainer: {
    marginVertical: 4,
    padding: 12,
    borderRadius: 12,
    maxWidth: '80%',
  },
  sentMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#2196F3',
  },
  receivedMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  senderName: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#666',
  },
  messageContent: {
    fontSize: 16,
    lineHeight: 20,
  },
  timestamp: {
    fontSize: 10,
    marginTop: 4,
    color: '#999',
  },
  typingContainer: {
    padding: 8,
    backgroundColor: '#f0f0f0',
  },
  typingText: {
    fontSize: 12,
    fontStyle: 'italic',
    color: '#666',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 12,
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: '#2196F3',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    justifyContent: 'center',
  },
  sendButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default ChatScreen;
```

### 5. Helper Functions

Create utility functions for authentication and user data:

```javascript
// utils/auth.js
import AsyncStorage from '@react-native-async-storage/async-storage';

export const getAuthToken = async () => {
  return await AsyncStorage.getItem('authToken');
};

export const getUserData = async () => {
  const userDataString = await AsyncStorage.getItem('userData');
  return userDataString ? JSON.parse(userDataString) : null;
};

export const setAuthToken = async (token) => {
  await AsyncStorage.setItem('authToken', token);
};

export const setUserData = async (userData) => {
  await AsyncStorage.setItem('userData', JSON.stringify(userData));
};
```

### 6. Usage Example

```javascript
// In your navigation file
import ChatScreen from '../screens/ChatScreen';

// Navigate to chat
navigation.navigate('Chat', {
  channelId: 'your-channel-id',
  channelName: 'Channel Name'
});
```

## 🔧 Configuration Notes

### Server URL Configuration
Replace `http://your-server.com` with your actual server URL:
- **Development**: `http://localhost:3000` or `http://192.168.1.x:3000`
- **Production**: `https://yourdomain.com`

### Authentication
Make sure to:
1. Store JWT token in AsyncStorage after login
2. Pass token in socket auth when connecting
3. Include token in REST API calls for sending messages

### Network Configuration

For Android development, add to `android/app/src/main/AndroidManifest.xml`:
```xml
<application
  android:usesCleartextTraffic="true"
  android:networkSecurityConfig="@xml/network_security_config">
```

Create `android/app/src/main/res/xml/network_security_config.xml`:
```xml
<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <domain-config cleartextTrafficPermitted="true">
        <domain includeSubdomains="true">localhost</domain>
        <domain includeSubdomains="true">10.0.2.2</domain>
        <domain includeSubdomains="true">192.168.1.0/24</domain>
    </domain-config>
</network-security-config>
```

## 🚨 Important Notes

1. **Message Sending**: Messages are sent via REST API, not WebSocket (as per your backend design)
2. **Real-time Updates**: WebSocket only handles real-time events (new messages, typing, etc.)
3. **Connection Management**: Always handle connection failures gracefully
4. **Performance**: Consider implementing message pagination for large chat histories
5. **Background Handling**: Add proper app state handling for background/foreground transitions

This integration provides a complete chat experience with real-time messaging, typing indicators, read receipts, and user presence features matching your NestJS backend implementation.