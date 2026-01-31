/**
 * WebSocket Server Service
 * Real-time bi-directional communication server using Socket.IO
 */

import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { logger } from '../utils/logger';
import type {
  ClientConnection,
  WebSocketRoom,
  WebSocketMessage,
  MessageEvent,
  SubscribeRequest,
  SubscribeResponse,
  UnsubscribeRequest,
  WebSocketStats,
  WebSocketConfig,
  AuthenticateRequest,
  AuthenticateResponse,
  KPIUpdatePayload,
  BacklogUpdatePayload,
  AttendanceUpdatePayload,
  AlertUpdatePayload,
} from '../types/websocket';

class WebSocketService {
  private io: SocketIOServer | null = null;
  private connections: Map<string, ClientConnection> = new Map();
  private rooms: Map<string, WebSocketRoom> = new Map();
  private messageStats: Map<MessageEvent, number> = new Map();
  private startTime: Date = new Date();
  
  private config: WebSocketConfig = {
    path: '/ws',
    cors_origins: ['http://localhost:3000', 'http://localhost:5173'],
    max_connections_per_org: 100,
    max_connections_total: 1000,
    max_message_size_bytes: 1024 * 1024, // 1MB
    max_messages_per_second_per_client: 100,
    ping_interval_ms: 25000,
    ping_timeout_ms: 60000,
    connection_timeout_ms: 60000,
    reconnection_enabled: true,
    reconnection_attempts: 5,
    reconnection_delay_ms: 1000,
    max_room_size: 1000,
    room_cleanup_interval_ms: 300000, // 5 minutes
    require_authentication: false,
    auth_timeout_ms: 30000,
    enable_compression: true,
    compression_threshold_bytes: 1024,
    log_all_messages: false,
    log_connection_events: true,
  };

  /**
   * Initialize WebSocket server
   */
  initialize(httpServer: HTTPServer): void {
    if (this.io) {
      logger.warn('WebSocket server already initialized');
      return;
    }

    this.io = new SocketIOServer(httpServer, {
      path: this.config.path,
      cors: {
        origin: this.config.cors_origins,
        credentials: true,
      },
      pingInterval: this.config.ping_interval_ms,
      pingTimeout: this.config.ping_timeout_ms,
      maxHttpBufferSize: this.config.max_message_size_bytes,
      transports: ['websocket', 'polling'],
      allowUpgrades: true,
    });

    this.setupEventHandlers();
    this.startRoomCleanup();

    logger.info('WebSocket server initialized', {
      path: this.config.path,
      cors_origins: this.config.cors_origins,
    });
  }

  /**
   * Setup Socket.IO event handlers
   */
  private setupEventHandlers(): void {
    if (!this.io) return;

    this.io.on('connection', (socket: Socket) => {
      this.handleConnection(socket);

      // Client events
      socket.on('authenticate', (data: AuthenticateRequest, callback) => {
        this.handleAuthenticate(socket, data, callback);
      });

      socket.on('subscribe', (data: SubscribeRequest, callback) => {
        this.handleSubscribe(socket, data, callback);
      });

      socket.on('unsubscribe', (data: UnsubscribeRequest, callback) => {
        this.handleUnsubscribe(socket, data, callback);
      });

      socket.on('client:ping', (callback) => {
        this.handlePing(socket, callback);
      });

      socket.on('message', (message: WebSocketMessage, callback) => {
        this.handleMessage(socket, message, callback);
      });

      socket.on('disconnect', (reason) => {
        this.handleDisconnect(socket, reason);
      });

      socket.on('error', (error) => {
        this.handleError(socket, error);
      });
    });
  }

  /**
   * Handle new client connection
   */
  private handleConnection(socket: Socket): void {
    const connection: ClientConnection = {
      socket_id: socket.id,
      connected_at: new Date().toISOString(),
      last_activity_at: new Date().toISOString(),
      ip_address: socket.handshake.address,
      user_agent: socket.handshake.headers['user-agent'],
      subscriptions: [],
      status: 'connected',
    };

    this.connections.set(socket.id, connection);

    if (this.config.log_connection_events) {
      logger.info('Client connected', {
        socket_id: socket.id,
        ip_address: connection.ip_address,
        total_connections: this.connections.size,
      });
    }

    // Send connection confirmation
    socket.emit('connected', {
      socket_id: socket.id,
      server_time: new Date().toISOString(),
    });
  }

  /**
   * Handle authentication
   */
  private handleAuthenticate(
    socket: Socket,
    data: AuthenticateRequest,
    callback?: (response: AuthenticateResponse) => void
  ): void {
    const connection = this.connections.get(socket.id);
    if (!connection) {
      const response: AuthenticateResponse = {
        success: false,
        socket_id: socket.id,
        message: 'Connection not found',
      };
      callback?.(response);
      return;
    }

    // Update connection with auth data
    connection.user_id = data.user_id;
    connection.organization_id = data.organization_id;
    this.connections.set(socket.id, connection);

    // Join organization room
    if (data.organization_id) {
      const roomId = `org:${data.organization_id}`;
      socket.join(roomId);
      this.ensureRoom(roomId, 'organization', data.organization_id);
    }

    const response: AuthenticateResponse = {
      success: true,
      socket_id: socket.id,
      user_id: data.user_id,
      organization_id: data.organization_id,
    };

    logger.info('Client authenticated', {
      socket_id: socket.id,
      user_id: data.user_id,
      organization_id: data.organization_id,
    });

    callback?.(response);
  }

  /**
   * Handle subscription request
   */
  private handleSubscribe(
    socket: Socket,
    data: SubscribeRequest,
    callback?: (response: SubscribeResponse) => void
  ): void {
    const connection = this.connections.get(socket.id);
    if (!connection) {
      callback?.({
        success: false,
        subscribed_channels: [],
        subscription_id: '',
        message: 'Connection not found',
      });
      return;
    }

    const subscriptionId = this.generateSubscriptionId();
    const rooms: string[] = [];

    // Create room IDs based on channels and filters
    data.channels.forEach(channel => {
      let roomId: string = channel;
      
      if (data.organization_id) {
        roomId = `${channel}:org:${data.organization_id}`;
      }
      if (data.department_id) {
        roomId = `${roomId}:dept:${data.department_id}`;
      }
      if (data.queue_name) {
        roomId = `${roomId}:queue:${data.queue_name}`;
      }

      rooms.push(roomId);
      socket.join(roomId);
      this.ensureRoom(roomId, 'custom', data.organization_id);
    });

    // Update connection subscriptions
    connection.subscriptions.push(...rooms);
    this.connections.set(socket.id, connection);

    const response: SubscribeResponse = {
      success: true,
      subscribed_channels: data.channels,
      subscription_id: subscriptionId,
    };

    logger.info('Client subscribed', {
      socket_id: socket.id,
      channels: data.channels,
      rooms: rooms,
    });

    callback?.(response);
  }

  /**
   * Handle unsubscribe request
   */
  private handleUnsubscribe(
    socket: Socket,
    data: UnsubscribeRequest,
    callback?: (response: any) => void
  ): void {
    const connection = this.connections.get(socket.id);
    if (!connection) {
      callback?.({ success: false, message: 'Connection not found' });
      return;
    }

    if (data.channels) {
      // Unsubscribe from specific channels
      data.channels.forEach(channel => {
        const roomsToLeave = connection.subscriptions.filter(sub => sub.startsWith(channel));
        roomsToLeave.forEach(room => {
          socket.leave(room);
          connection.subscriptions = connection.subscriptions.filter(sub => sub !== room);
        });
      });
    } else {
      // Unsubscribe from all
      connection.subscriptions.forEach(room => socket.leave(room));
      connection.subscriptions = [];
    }

    this.connections.set(socket.id, connection);

    logger.info('Client unsubscribed', {
      socket_id: socket.id,
      channels: data.channels || 'all',
    });

    callback?.({ success: true });
  }

  /**
   * Handle ping
   */
  private handlePing(socket: Socket, callback?: (response: any) => void): void {
    const connection = this.connections.get(socket.id);
    if (connection) {
      connection.last_activity_at = new Date().toISOString();
      this.connections.set(socket.id, connection);
    }

    callback?.({
      pong: true,
      server_time: new Date().toISOString(),
    });
  }

  /**
   * Handle incoming message
   */
  private handleMessage(
    socket: Socket,
    message: WebSocketMessage,
    callback?: (response: any) => void
  ): void {
    if (this.config.log_all_messages) {
      logger.debug('Message received', {
        socket_id: socket.id,
        event: message.event,
        message_id: message.message_id,
      });
    }

    // Update message stats
    const currentCount = this.messageStats.get(message.event) || 0;
    this.messageStats.set(message.event, currentCount + 1);

    // Process message based on event type
    // (Custom message handling logic would go here)

    if (message.requires_ack) {
      callback?.({
        message_id: message.message_id,
        status: 'received',
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Handle disconnect
   */
  private handleDisconnect(socket: Socket, reason: string): void {
    const connection = this.connections.get(socket.id);
    
    if (this.config.log_connection_events) {
      logger.info('Client disconnected', {
        socket_id: socket.id,
        reason,
        user_id: connection?.user_id,
        total_connections: this.connections.size - 1,
      });
    }

    this.connections.delete(socket.id);
  }

  /**
   * Handle error
   */
  private handleError(socket: Socket, error: Error): void {
    logger.error('WebSocket error', {
      socket_id: socket.id,
      error: error.message,
    });
  }

  // ==============================================
  // BROADCAST METHODS
  // ==============================================

  /**
   * Broadcast KPI update
   */
  broadcastKPIUpdate(payload: KPIUpdatePayload): void {
    const message: WebSocketMessage<KPIUpdatePayload> = {
      message_id: this.generateMessageId(),
      event: 'kpi:update',
      data: payload,
      timestamp: new Date().toISOString(),
      organization_id: payload.organization_id,
      department_id: payload.department_id,
      queue_name: payload.queue_name,
      priority: payload.sla_risk.risk_level === 'critical' ? 'urgent' : 'medium',
    };

    this.broadcast(message, {
      organization_id: payload.organization_id,
      department_id: payload.department_id,
      queue_name: payload.queue_name,
    });
  }

  /**
   * Broadcast backlog update
   */
  broadcastBacklogUpdate(payload: BacklogUpdatePayload): void {
    const message: WebSocketMessage<BacklogUpdatePayload> = {
      message_id: this.generateMessageId(),
      event: 'backlog:update',
      data: payload,
      timestamp: new Date().toISOString(),
      organization_id: payload.organization_id,
      department_id: payload.department_id,
      queue_name: payload.queue_name,
      priority: payload.backlog_trend === 'growing' ? 'high' : 'medium',
    };

    this.broadcast(message, {
      organization_id: payload.organization_id,
      department_id: payload.department_id,
      queue_name: payload.queue_name,
    });
  }

  /**
   * Broadcast attendance update
   */
  broadcastAttendanceUpdate(payload: AttendanceUpdatePayload): void {
    const message: WebSocketMessage<AttendanceUpdatePayload> = {
      message_id: this.generateMessageId(),
      event: 'attendance:update',
      data: payload,
      timestamp: new Date().toISOString(),
      organization_id: payload.organization_id,
      department_id: payload.department_id,
      priority: payload.attendance_rate < 0.85 ? 'high' : 'medium',
    };

    this.broadcast(message, {
      organization_id: payload.organization_id,
      department_id: payload.department_id,
    });
  }

  /**
   * Broadcast alert
   */
  broadcastAlert(payload: AlertUpdatePayload): void {
    const message: WebSocketMessage<AlertUpdatePayload> = {
      message_id: this.generateMessageId(),
      event: 'alert:triggered',
      data: payload,
      timestamp: new Date().toISOString(),
      organization_id: payload.organization_id,
      department_id: payload.department_id,
      queue_name: payload.queue_name,
      priority: payload.severity === 'critical' ? 'urgent' : payload.severity === 'error' ? 'high' : 'medium',
    };

    this.broadcast(message, {
      organization_id: payload.organization_id,
      department_id: payload.department_id,
      queue_name: payload.queue_name,
    });
  }

  /**
   * Generic broadcast method
   */
  private broadcast(
    message: WebSocketMessage,
    target?: {
      organization_id?: string;
      department_id?: string;
      queue_name?: string;
      socket_ids?: string[];
    }
  ): void {
    if (!this.io) return;

    if (target?.socket_ids) {
      // Send to specific sockets
      target.socket_ids.forEach(socketId => {
        this.io?.to(socketId).emit('message', message);
      });
      return;
    }

    // Build room targeting
    const channelPrefix = message.event.split(':')[0] || 'general'; // e.g., 'kpi', 'backlog', 'alert'
    
    let roomId: string = channelPrefix;
    if (target?.organization_id) {
      roomId = `${roomId}:org:${target.organization_id}`;
    }
    if (target?.department_id) {
      roomId = `${roomId}:dept:${target.department_id}`;
    }
    if (target?.queue_name) {
      roomId = `${roomId}:queue:${target.queue_name}`;
    }

    this.io.to(roomId).emit('message', message);

    if (this.config.log_all_messages) {
      logger.debug('Message broadcasted', {
        message_id: message.message_id,
        event: message.event,
        room: roomId,
      });
    }
  }

  /**
   * Broadcast to all connections
   */
  broadcastToAll(message: WebSocketMessage): void {
    if (!this.io) return;
    this.io.emit('message', message);
  }

  /**
   * Send message to specific socket
   */
  sendToSocket(socketId: string, message: WebSocketMessage): void {
    if (!this.io) return;
    this.io.to(socketId).emit('message', message);
  }

  // ==============================================
  // ROOM MANAGEMENT
  // ==============================================

  /**
   * Ensure room exists
   */
  private ensureRoom(
    roomId: string,
    roomType: WebSocketRoom['room_type'],
    organizationId?: string
  ): void {
    if (!this.rooms.has(roomId)) {
      const room: WebSocketRoom = {
        room_id: roomId,
        room_type: roomType,
        organization_id: organizationId,
        member_count: 0,
        member_socket_ids: [],
        created_at: new Date().toISOString(),
      };
      this.rooms.set(roomId, room);
    }
  }

  /**
   * Start periodic room cleanup
   */
  private startRoomCleanup(): void {
    setInterval(() => {
      this.cleanupEmptyRooms();
    }, this.config.room_cleanup_interval_ms);
  }

  /**
   * Clean up empty rooms
   */
  private cleanupEmptyRooms(): void {
    if (!this.io) return;

    const roomsToDelete: string[] = [];

    this.rooms.forEach((_room, roomId) => {
      const sockets = this.io?.sockets.adapter.rooms.get(roomId);
      if (!sockets || sockets.size === 0) {
        roomsToDelete.push(roomId);
      }
    });

    roomsToDelete.forEach(roomId => {
      this.rooms.delete(roomId);
    });

    if (roomsToDelete.length > 0) {
      logger.debug('Cleaned up empty rooms', { count: roomsToDelete.length });
    }
  }

  // ==============================================
  // STATISTICS
  // ==============================================

  /**
   * Get server statistics
   */
  getStats(): WebSocketStats {
    const now = Date.now();
    const uptimeSeconds = Math.floor((now - this.startTime.getTime()) / 1000);

    const connectionsByOrg: Record<string, number> = {};
    this.connections.forEach(conn => {
      if (conn.organization_id) {
        connectionsByOrg[conn.organization_id] = (connectionsByOrg[conn.organization_id] || 0) + 1;
      }
    });

    const roomsByType: Record<string, number> = {};
    this.rooms.forEach(room => {
      roomsByType[room.room_type] = (roomsByType[room.room_type] || 0) + 1;
    });

    const messagesByEvent: Record<MessageEvent, number> = {} as any;
    this.messageStats.forEach((count, event) => {
      messagesByEvent[event] = count;
    });

    const totalMessages = Array.from(this.messageStats.values()).reduce((sum, count) => sum + count, 0);
    const messagesPerSecond = uptimeSeconds > 0 ? totalMessages / uptimeSeconds : 0;

    return {
      total_connections: this.connections.size,
      active_connections: this.connections.size,
      connections_by_org: connectionsByOrg,
      total_rooms: this.rooms.size,
      rooms_by_type: roomsByType,
      messages_sent_total: totalMessages,
      messages_sent_per_second: Math.round(messagesPerSecond * 100) / 100,
      messages_by_event: messagesByEvent,
      avg_latency_ms: 0, // Would need to track actual latencies
      max_latency_ms: 0,
      error_count: 0,
      uptime_seconds: uptimeSeconds,
      server_start_time: this.startTime.toISOString(),
    };
  }

  /**
   * Get connection list
   */
  getConnections(): ClientConnection[] {
    return Array.from(this.connections.values());
  }

  /**
   * Get connection by socket ID
   */
  getConnection(socketId: string): ClientConnection | undefined {
    return this.connections.get(socketId);
  }

  /**
   * Get active room list
   */
  getRooms(): WebSocketRoom[] {
    return Array.from(this.rooms.values());
  }

  // ==============================================
  // UTILITIES
  // ==============================================

  /**
   * Check if server is initialized
   */
  isInitialized(): boolean {
    return this.io !== null;
  }

  /**
   * Shutdown server
   */
  async shutdown(): Promise<void> {
    if (!this.io) return;

    logger.info('Shutting down WebSocket server');

    // Notify all clients
    this.broadcastToAll({
      message_id: this.generateMessageId(),
      event: 'system:maintenance',
      data: { message: 'Server shutting down' },
      timestamp: new Date().toISOString(),
    });

    // Close all connections
    this.io.close();
    this.io = null;
    this.connections.clear();
    this.rooms.clear();

    logger.info('WebSocket server shut down');
  }

  /**
   * Generate message ID
   */
  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate subscription ID
   */
  private generateSubscriptionId(): string {
    return `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export const webSocketService = new WebSocketService();
