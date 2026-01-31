/**
 * WebSocket Client Service
 * Real-time bi-directional communication for Intraday Console
 */

import { io, Socket } from 'socket.io-client';
import type {
  WebSocketMessage,
  SubscriptionChannel,
  SubscribeRequest,
  SubscribeResponse,
  UnsubscribeRequest,
  AuthenticateRequest,
  AuthenticateResponse,
  KPIUpdatePayload,
  BacklogUpdatePayload,
  AttendanceUpdatePayload,
  AlertUpdatePayload,
  ConnectionStatus,
} from '../../api/types/websocket';

/**
 * Connection configuration
 */
export interface WebSocketClientConfig {
  url: string;
  path?: string;
  reconnection?: boolean;
  reconnectionAttempts?: number;
  reconnectionDelay?: number;
  timeout?: number;
  autoConnect?: boolean;
}

/**
 * Event handlers for WebSocket events
 */
export interface WebSocketEventHandlers {
  onConnect?: () => void;
  onDisconnect?: (reason: string) => void;
  onError?: (error: Error) => void;
  onReconnect?: (attemptNumber: number) => void;
  onReconnectAttempt?: (attemptNumber: number) => void;
  onReconnectFailed?: () => void;
  onMessage?: (message: WebSocketMessage) => void;
  onKPIUpdate?: (payload: KPIUpdatePayload) => void;
  onBacklogUpdate?: (payload: BacklogUpdatePayload) => void;
  onAttendanceUpdate?: (payload: AttendanceUpdatePayload) => void;
  onAlertTriggered?: (payload: AlertUpdatePayload) => void;
  onAlertAcknowledged?: (payload: AlertUpdatePayload) => void;
  onAlertResolved?: (payload: AlertUpdatePayload) => void;
}

/**
 * Subscription info
 */
interface SubscriptionInfo {
  subscription_id: string;
  channels: SubscriptionChannel[];
  organization_id?: string;
  department_id?: string;
  queue_name?: string;
}

/**
 * WebSocket Client Service
 */
class WebSocketClient {
  private socket: Socket | null = null;
  private eventHandlers: WebSocketEventHandlers = {};
  private subscriptions: Map<string, SubscriptionInfo> = new Map();
  private connectionStatus: ConnectionStatus = 'disconnected';
  private authenticated: boolean = false;
  private userId: string | null = null;
  private organizationId: string | null = null;
  private socketId: string | null = null;

  /**
   * Initialize the WebSocket client
   */
  initialize(config: WebSocketClientConfig): void {
    if (this.socket) {
      console.warn('WebSocket client already initialized');
      return;
    }

    // Create Socket.IO client
    this.socket = io(config.url, {
      path: config.path || '/ws',
      reconnection: config.reconnection !== false,
      reconnectionAttempts: config.reconnectionAttempts || 5,
      reconnectionDelay: config.reconnectionDelay || 1000,
      timeout: config.timeout || 20000,
      autoConnect: config.autoConnect !== false,
      transports: ['websocket', 'polling'],
    });

    // Set up event handlers
    this.setupEventHandlers();

    console.log('WebSocket client initialized', { url: config.url });
  }

  /**
   * Set up Socket.IO event handlers
   */
  private setupEventHandlers(): void {
    if (!this.socket) return;

    // Connection events
    this.socket.on('connect', () => {
      console.log('WebSocket connected', { socketId: this.socket?.id });
      this.connectionStatus = 'connected';
      this.socketId = this.socket?.id || null;
      this.eventHandlers.onConnect?.();
    });

    this.socket.on('disconnect', (reason: string) => {
      console.log('WebSocket disconnected', { reason });
      this.connectionStatus = 'disconnected';
      this.authenticated = false;
      this.subscriptions.clear();
      this.eventHandlers.onDisconnect?.(reason);
    });

    this.socket.on('connect_error', (error: Error) => {
      console.error('WebSocket connection error:', error);
      this.connectionStatus = 'error';
      this.eventHandlers.onError?.(error);
    });

    // Reconnection events
    this.socket.on('reconnect', (attemptNumber: number) => {
      console.log('WebSocket reconnected', { attemptNumber });
      this.connectionStatus = 'connected';
      this.eventHandlers.onReconnect?.(attemptNumber);

      // Re-authenticate and re-subscribe after reconnection
      if (this.userId && this.organizationId) {
        this.authenticate(this.userId, this.organizationId).catch(console.error);
      }
    });

    this.socket.on('reconnect_attempt', (attemptNumber: number) => {
      console.log('WebSocket reconnecting...', { attemptNumber });
      this.connectionStatus = 'reconnecting';
      this.eventHandlers.onReconnectAttempt?.(attemptNumber);
    });

    this.socket.on('reconnect_failed', () => {
      console.error('WebSocket reconnection failed');
      this.connectionStatus = 'error';
      this.eventHandlers.onReconnectFailed?.();
    });

    // Message handler
    this.socket.on('message', (message: WebSocketMessage) => {
      this.handleMessage(message);
    });

    // Connected event (server confirmation)
    this.socket.on('connected', (data: { socket_id: string; server_time: string }) => {
      console.log('Server confirmed connection', data);
      this.socketId = data.socket_id;
    });

    // Authenticated event
    this.socket.on('authenticated', (data: { success: boolean; message?: string }) => {
      console.log('Authentication result', data);
    });
  }

  /**
   * Handle incoming WebSocket message
   */
  private handleMessage(message: WebSocketMessage): void {
    console.log('WebSocket message received', {
      event: message.event,
      priority: message.priority,
      timestamp: message.timestamp,
    });

    // Call generic message handler
    this.eventHandlers.onMessage?.(message);

    // Call specific handlers based on event type
    switch (message.event) {
      case 'kpi:update':
        this.eventHandlers.onKPIUpdate?.(message.data as KPIUpdatePayload);
        break;
      case 'backlog:update':
        this.eventHandlers.onBacklogUpdate?.(message.data as BacklogUpdatePayload);
        break;
      case 'attendance:update':
        this.eventHandlers.onAttendanceUpdate?.(message.data as AttendanceUpdatePayload);
        break;
      case 'alert:triggered':
        this.eventHandlers.onAlertTriggered?.(message.data as AlertUpdatePayload);
        break;
      case 'alert:acknowledged':
        this.eventHandlers.onAlertAcknowledged?.(message.data as AlertUpdatePayload);
        break;
      case 'alert:resolved':
        this.eventHandlers.onAlertResolved?.(message.data as AlertUpdatePayload);
        break;
      default:
        console.log('Unhandled message event', { event: message.event });
    }

    // Send acknowledgment if required
    if (message.requires_ack) {
      this.sendAcknowledgment(message.message_id);
    }
  }

  /**
   * Send acknowledgment for a message
   */
  private sendAcknowledgment(messageId: string): void {
    if (!this.socket) return;

    this.socket.emit('ack', {
      message_id: messageId,
      received_at: new Date().toISOString(),
    });
  }

  /**
   * Authenticate the connection
   */
  async authenticate(userId: string, organizationId: string): Promise<AuthenticateResponse> {
    if (!this.socket) {
      throw new Error('WebSocket not initialized');
    }

    if (!this.socket.connected) {
      throw new Error('WebSocket not connected');
    }

    return new Promise((resolve, reject) => {
      const request: AuthenticateRequest = {
        user_id: userId,
        organization_id: organizationId,
      };

      this.socket!.emit('authenticate', request, (response: AuthenticateResponse) => {
        if (response.success) {
          this.authenticated = true;
          this.userId = userId;
          this.organizationId = organizationId;
          this.socketId = response.socket_id;
          console.log('Authenticated successfully', {
            userId: response.user_id,
            organizationId: response.organization_id,
          });
          resolve(response);
        } else {
          this.authenticated = false;
          console.error('Authentication failed:', response.message);
          reject(new Error(response.message || 'Authentication failed'));
        }
      });
    });
  }

  /**
   * Subscribe to channels
   */
  async subscribe(
    channels: SubscriptionChannel[],
    filters?: {
      organization_id?: string;
      department_id?: string;
      queue_name?: string;
    }
  ): Promise<SubscribeResponse> {
    if (!this.socket) {
      throw new Error('WebSocket not initialized');
    }

    if (!this.authenticated) {
      throw new Error('Must authenticate before subscribing');
    }

    return new Promise((resolve, reject) => {
      const request: SubscribeRequest = {
        channels,
        organization_id: filters?.organization_id,
        department_id: filters?.department_id,
        queue_name: filters?.queue_name,
      };

      this.socket!.emit('subscribe', request, (response: SubscribeResponse) => {
        if (response.success) {
          // Store subscription info
          this.subscriptions.set(response.subscription_id, {
            subscription_id: response.subscription_id,
            channels,
            organization_id: filters?.organization_id,
            department_id: filters?.department_id,
            queue_name: filters?.queue_name,
          });

          console.log('Subscribed successfully', {
            subscription_id: response.subscription_id,
            channels,
          });
          resolve(response);
        } else {
          console.error('Subscription failed:', response.message);
          reject(new Error(response.message || 'Subscription failed'));
        }
      });
    });
  }

  /**
   * Unsubscribe from channels
   */
  async unsubscribe(channels: SubscriptionChannel[]): Promise<void> {
    if (!this.socket) {
      throw new Error('WebSocket not initialized');
    }

    return new Promise((resolve, reject) => {
      const request: UnsubscribeRequest = {
        channels,
      };

      this.socket!.emit('unsubscribe', request, (response: { success: boolean; message?: string }) => {
        if (response.success) {
          // Remove subscriptions
          this.subscriptions.forEach((sub, id) => {
            const remainingChannels = sub.channels.filter(c => !channels.includes(c));
            if (remainingChannels.length === 0) {
              this.subscriptions.delete(id);
            } else {
              sub.channels = remainingChannels;
            }
          });

          console.log('Unsubscribed successfully', { channels });
          resolve();
        } else {
          console.error('Unsubscribe failed:', response.message);
          reject(new Error(response.message || 'Unsubscribe failed'));
        }
      });
    });
  }

  /**
   * Send a ping to the server
   */
  async ping(): Promise<number> {
    if (!this.socket) {
      throw new Error('WebSocket not initialized');
    }

    return new Promise((resolve, reject) => {
      const sentAt = Date.now();

      this.socket!.emit('client:ping', {}, (response: { pong: boolean; server_time: string }) => {
        if (response.pong) {
          const latency = Date.now() - sentAt;
          console.log('Ping successful', { latency });
          resolve(latency);
        } else {
          reject(new Error('Ping failed'));
        }
      });
    });
  }

  /**
   * Register event handlers
   */
  on(handlers: WebSocketEventHandlers): void {
    this.eventHandlers = { ...this.eventHandlers, ...handlers };
  }

  /**
   * Unregister event handlers
   */
  off(events?: (keyof WebSocketEventHandlers)[]): void {
    if (events) {
      events.forEach(event => {
        delete this.eventHandlers[event];
      });
    } else {
      this.eventHandlers = {};
    }
  }

  /**
   * Connect to the WebSocket server
   */
  connect(): void {
    if (!this.socket) {
      throw new Error('WebSocket not initialized. Call initialize() first.');
    }

    this.socket.connect();
  }

  /**
   * Disconnect from the WebSocket server
   */
  disconnect(): void {
    if (!this.socket) return;

    this.socket.disconnect();
    this.connectionStatus = 'disconnected';
    this.authenticated = false;
    this.subscriptions.clear();
  }

  /**
   * Get connection status
   */
  getStatus(): ConnectionStatus {
    return this.connectionStatus;
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  /**
   * Check if authenticated
   */
  isAuthenticated(): boolean {
    return this.authenticated;
  }

  /**
   * Get socket ID
   */
  getSocketId(): string | null {
    return this.socketId;
  }

  /**
   * Get current subscriptions
   */
  getSubscriptions(): SubscriptionInfo[] {
    return Array.from(this.subscriptions.values());
  }

  /**
   * Cleanup and destroy the client
   */
  destroy(): void {
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }

    this.subscriptions.clear();
    this.eventHandlers = {};
    this.authenticated = false;
    this.connectionStatus = 'disconnected';
  }
}

// Export singleton instance
export const websocketClient = new WebSocketClient();

// Export class for testing
export { WebSocketClient };
