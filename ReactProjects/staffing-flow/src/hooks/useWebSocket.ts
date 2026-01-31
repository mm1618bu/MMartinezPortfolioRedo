/**
 * React Hooks for WebSocket Client
 * Provides easy-to-use hooks for WebSocket integration in React components
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { websocketClient } from '../services/websocketClient';
import type {
  WebSocketMessage,
  SubscriptionChannel,
  KPIUpdatePayload,
  BacklogUpdatePayload,
  AttendanceUpdatePayload,
  AlertUpdatePayload,
  ConnectionStatus,
} from '../../api/types/websocket';
import type { WebSocketEventHandlers } from '../services/websocketClient';

/**
 * Hook to manage WebSocket connection
 */
export function useWebSocket(config?: {
  url?: string;
  autoConnect?: boolean;
  autoAuthenticate?: boolean;
  userId?: string;
  organizationId?: string;
}) {
  const [isConnected, setIsConnected] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [error, setError] = useState<Error | null>(null);
  const initializedRef = useRef(false);

  useEffect(() => {
    // Initialize WebSocket client (only once)
    if (!initializedRef.current) {
      const url = config?.url || process.env.REACT_APP_WS_URL || 'http://localhost:5000';
      
      websocketClient.initialize({
        url,
        autoConnect: config?.autoConnect !== false,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        timeout: 20000,
      });

      initializedRef.current = true;
    }

    // Set up event handlers
    const handlers: WebSocketEventHandlers = {
      onConnect: () => {
        setIsConnected(true);
        setConnectionStatus('connected');
        setError(null);

        // Auto-authenticate if credentials provided
        if (config?.autoAuthenticate && config.userId && config.organizationId) {
          websocketClient
            .authenticate(config.userId, config.organizationId)
            .then(() => {
              setIsAuthenticated(true);
            })
            .catch(err => {
              setError(err);
              console.error('Auto-authentication failed:', err);
            });
        }
      },
      onDisconnect: (reason: string) => {
        setIsConnected(false);
        setIsAuthenticated(false);
        setConnectionStatus('disconnected');
        console.log('Disconnected:', reason);
      },
      onError: (err: Error) => {
        setError(err);
        setConnectionStatus('error');
      },
      onReconnect: (attemptNumber: number) => {
        setIsConnected(true);
        setConnectionStatus('connected');
        setError(null);
        console.log('Reconnected after', attemptNumber, 'attempts');
      },
      onReconnectAttempt: (attemptNumber: number) => {
        setConnectionStatus('reconnecting');
        console.log('Reconnecting... attempt', attemptNumber);
      },
      onReconnectFailed: () => {
        setConnectionStatus('error');
        setError(new Error('Reconnection failed'));
      },
    };

    websocketClient.on(handlers);

    // Update initial state
    setIsConnected(websocketClient.isConnected());
    setIsAuthenticated(websocketClient.isAuthenticated());
    setConnectionStatus(websocketClient.getStatus());

    // Cleanup
    return () => {
      // Note: We don't disconnect here as other components might be using the socket
      websocketClient.off(Object.keys(handlers) as (keyof WebSocketEventHandlers)[]);
    };
  }, [config?.url, config?.autoConnect, config?.autoAuthenticate, config?.userId, config?.organizationId]);

  const connect = useCallback(() => {
    websocketClient.connect();
  }, []);

  const disconnect = useCallback(() => {
    websocketClient.disconnect();
  }, []);

  const authenticate = useCallback(async (userId: string, organizationId: string) => {
    try {
      await websocketClient.authenticate(userId, organizationId);
      setIsAuthenticated(true);
      setError(null);
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  }, []);

  const ping = useCallback(async (): Promise<number> => {
    return websocketClient.ping();
  }, []);

  return {
    isConnected,
    isAuthenticated,
    connectionStatus,
    error,
    connect,
    disconnect,
    authenticate,
    ping,
    socketId: websocketClient.getSocketId(),
  };
}

/**
 * Hook to subscribe to WebSocket channels
 */
export function useWebSocketSubscription(
  channels: SubscriptionChannel[],
  filters?: {
    organization_id?: string;
    department_id?: string;
    queue_name?: string;
  },
  enabled: boolean = true
) {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!enabled || channels.length === 0) return;

    let mounted = true;

    const subscribe = async () => {
      try {
        await websocketClient.subscribe(channels, filters);
        if (mounted) {
          setIsSubscribed(true);
          setError(null);
        }
      } catch (err) {
        if (mounted) {
          setError(err as Error);
          console.error('Subscription failed:', err);
        }
      }
    };

    subscribe();

    return () => {
      mounted = false;
      if (isSubscribed) {
        websocketClient.unsubscribe(channels).catch(console.error);
        setIsSubscribed(false);
      }
    };
  }, [JSON.stringify(channels), JSON.stringify(filters), enabled]);

  return { isSubscribed, error };
}

/**
 * Hook to listen for KPI updates
 */
export function useKPIUpdates(
  onUpdate: (payload: KPIUpdatePayload) => void,
  filters?: {
    organization_id?: string;
    department_id?: string;
    queue_name?: string;
  }
) {
  const [latestUpdate, setLatestUpdate] = useState<KPIUpdatePayload | null>(null);

  useWebSocketSubscription(['kpi'], filters);

  useEffect(() => {
    const handler = (payload: KPIUpdatePayload) => {
      setLatestUpdate(payload);
      onUpdate(payload);
    };

    websocketClient.on({ onKPIUpdate: handler });

    return () => {
      websocketClient.off(['onKPIUpdate']);
    };
  }, [onUpdate]);

  return { latestUpdate };
}

/**
 * Hook to listen for backlog updates
 */
export function useBacklogUpdates(
  onUpdate: (payload: BacklogUpdatePayload) => void,
  filters?: {
    organization_id?: string;
    department_id?: string;
    queue_name?: string;
  }
) {
  const [latestUpdate, setLatestUpdate] = useState<BacklogUpdatePayload | null>(null);

  useWebSocketSubscription(['backlog'], filters);

  useEffect(() => {
    const handler = (payload: BacklogUpdatePayload) => {
      setLatestUpdate(payload);
      onUpdate(payload);
    };

    websocketClient.on({ onBacklogUpdate: handler });

    return () => {
      websocketClient.off(['onBacklogUpdate']);
    };
  }, [onUpdate]);

  return { latestUpdate };
}

/**
 * Hook to listen for attendance updates
 */
export function useAttendanceUpdates(
  onUpdate: (payload: AttendanceUpdatePayload) => void,
  filters?: {
    organization_id?: string;
    department_id?: string;
    queue_name?: string;
  }
) {
  const [latestUpdate, setLatestUpdate] = useState<AttendanceUpdatePayload | null>(null);

  useWebSocketSubscription(['attendance'], filters);

  useEffect(() => {
    const handler = (payload: AttendanceUpdatePayload) => {
      setLatestUpdate(payload);
      onUpdate(payload);
    };

    websocketClient.on({ onAttendanceUpdate: handler });

    return () => {
      websocketClient.off(['onAttendanceUpdate']);
    };
  }, [onUpdate]);

  return { latestUpdate };
}

/**
 * Hook to listen for alert notifications
 */
export function useAlertNotifications(
  onAlert: (payload: AlertUpdatePayload) => void,
  filters?: {
    organization_id?: string;
    department_id?: string;
    queue_name?: string;
  }
) {
  const [latestAlert, setLatestAlert] = useState<AlertUpdatePayload | null>(null);
  const [alertCount, setAlertCount] = useState(0);

  useWebSocketSubscription(['alerts'], filters);

  useEffect(() => {
    const handleTriggered = (payload: AlertUpdatePayload) => {
      setLatestAlert(payload);
      setAlertCount(prev => prev + 1);
      onAlert(payload);
    };

    const handleAcknowledged = (payload: AlertUpdatePayload) => {
      console.log('Alert acknowledged:', payload.alert_id);
    };

    const handleResolved = (payload: AlertUpdatePayload) => {
      console.log('Alert resolved:', payload.alert_id);
    };

    websocketClient.on({
      onAlertTriggered: handleTriggered,
      onAlertAcknowledged: handleAcknowledged,
      onAlertResolved: handleResolved,
    });

    return () => {
      websocketClient.off(['onAlertTriggered', 'onAlertAcknowledged', 'onAlertResolved']);
    };
  }, [onAlert]);

  const clearAlertCount = useCallback(() => {
    setAlertCount(0);
  }, []);

  return { latestAlert, alertCount, clearAlertCount };
}

/**
 * Hook to listen for all WebSocket messages
 */
export function useWebSocketMessages(onMessage: (message: WebSocketMessage) => void) {
  const [messageCount, setMessageCount] = useState(0);
  const [latestMessage, setLatestMessage] = useState<WebSocketMessage | null>(null);

  useEffect(() => {
    const handler = (message: WebSocketMessage) => {
      setLatestMessage(message);
      setMessageCount(prev => prev + 1);
      onMessage(message);
    };

    websocketClient.on({ onMessage: handler });

    return () => {
      websocketClient.off(['onMessage']);
    };
  }, [onMessage]);

  return { latestMessage, messageCount };
}

/**
 * Hook to monitor WebSocket connection health
 */
export function useWebSocketHealth(pingInterval: number = 30000) {
  const [latency, setLatency] = useState<number | null>(null);
  const [lastPingTime, setLastPingTime] = useState<Date | null>(null);
  const [pingError, setPingError] = useState<Error | null>(null);

  useEffect(() => {
    if (!websocketClient.isConnected()) return;

    const doPing = async () => {
      try {
        const lat = await websocketClient.ping();
        setLatency(lat);
        setLastPingTime(new Date());
        setPingError(null);
      } catch (err) {
        setPingError(err as Error);
        console.error('Ping failed:', err);
      }
    };

    // Initial ping
    doPing();

    // Set up interval
    const interval = setInterval(doPing, pingInterval);

    return () => {
      clearInterval(interval);
    };
  }, [pingInterval]);

  return { latency, lastPingTime, pingError };
}
