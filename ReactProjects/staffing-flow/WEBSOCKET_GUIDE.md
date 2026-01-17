# WebSocket Implementation Guide

## Client Implementation (TypeScript/React)

### 1. WebSocket Client Class

```typescript
import { WebSocketMessage, WS_EVENT_TYPES, WS_CHANNELS } from './websocket/types';

export class WebSocketClient {
  private ws: WebSocket | null = null;
  private url: string;
  private token: string;
  private reconnectDelay = 1000;
  private maxReconnectDelay = 30000;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private messageQueue: WebSocketMessage[] = [];
  private eventHandlers = new Map<string, Set<(payload: any) => void>>();
  private connected = false;

  constructor(url: string, token: string) {
    this.url = url;
    this.token = token;
  }

  connect(): void {
    try {
      this.ws = new WebSocket(`${this.url}?token=${this.token}`);

      this.ws.onopen = this.handleOpen.bind(this);
      this.ws.onmessage = this.handleMessage.bind(this);
      this.ws.onerror = this.handleError.bind(this);
      this.ws.onclose = this.handleClose.bind(this);
    } catch (error) {
      console.error('WebSocket connection error:', error);
      this.scheduleReconnect();
    }
  }

  disconnect(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.connected = false;
  }

  subscribe(channels: string[]): void {
    this.send({
      type: WS_EVENT_TYPES.SUBSCRIBE,
      payload: { channels },
      timestamp: new Date().toISOString(),
      id: this.generateId(),
    });
  }

  unsubscribe(channels: string[]): void {
    this.send({
      type: WS_EVENT_TYPES.UNSUBSCRIBE,
      payload: { channels },
      timestamp: new Date().toISOString(),
      id: this.generateId(),
    });
  }

  on(eventType: string, handler: (payload: any) => void): void {
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, new Set());
    }
    this.eventHandlers.get(eventType)!.add(handler);
  }

  off(eventType: string, handler: (payload: any) => void): void {
    const handlers = this.eventHandlers.get(eventType);
    if (handlers) {
      handlers.delete(handler);
    }
  }

  send(message: WebSocketMessage): void {
    if (this.connected && this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      this.messageQueue.push(message);
    }
  }

  private handleOpen(): void {
    console.log('WebSocket connected');
    this.connected = true;
    this.reconnectDelay = 1000;
    this.startHeartbeat();
    this.flushMessageQueue();
  }

  private handleMessage(event: MessageEvent): void {
    try {
      const message: WebSocketMessage = JSON.parse(event.data);
      this.emit(message.type, message.payload);
    } catch (error) {
      console.error('Failed to parse WebSocket message:', error);
    }
  }

  private handleError(error: Event): void {
    console.error('WebSocket error:', error);
  }

  private handleClose(): void {
    console.log('WebSocket disconnected');
    this.connected = false;
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    this.scheduleReconnect();
  }

  private scheduleReconnect(): void {
    setTimeout(() => {
      console.log('Attempting to reconnect...');
      this.connect();
      this.reconnectDelay = Math.min(this.reconnectDelay * 2, this.maxReconnectDelay);
    }, this.reconnectDelay);
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      if (this.connected) {
        this.send({
          type: WS_EVENT_TYPES.PING,
          payload: {},
          timestamp: new Date().toISOString(),
          id: this.generateId(),
        });
      }
    }, 30000); // 30 seconds
  }

  private flushMessageQueue(): void {
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift();
      if (message) {
        this.send(message);
      }
    }
  }

  private emit(eventType: string, payload: any): void {
    const handlers = this.eventHandlers.get(eventType);
    if (handlers) {
      handlers.forEach((handler) => handler(payload));
    }
  }

  private generateId(): string {
    return `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
```

### 2. React Hook

```typescript
import { useEffect, useRef, useState } from 'react';
import { WebSocketClient } from './WebSocketClient';

export function useWebSocket(url: string, token: string) {
  const [connected, setConnected] = useState(false);
  const clientRef = useRef<WebSocketClient | null>(null);

  useEffect(() => {
    const client = new WebSocketClient(url, token);
    clientRef.current = client;

    client.on('connection:established', () => {
      setConnected(true);
    });

    client.on('connection:error', () => {
      setConnected(false);
    });

    client.connect();

    return () => {
      client.disconnect();
    };
  }, [url, token]);

  const subscribe = (channels: string[]) => {
    clientRef.current?.subscribe(channels);
  };

  const unsubscribe = (channels: string[]) => {
    clientRef.current?.unsubscribe(channels);
  };

  const on = (eventType: string, handler: (payload: any) => void) => {
    clientRef.current?.on(eventType, handler);
  };

  const off = (eventType: string, handler: (payload: any) => void) => {
    clientRef.current?.off(eventType, handler);
  };

  const send = (message: any) => {
    clientRef.current?.send(message);
  };

  return { connected, subscribe, unsubscribe, on, off, send };
}
```

### 3. Example Usage in Component

```typescript
import { useWebSocket } from '../hooks/useWebSocket';
import { WS_EVENT_TYPES, WS_CHANNELS } from '../websocket/types';
import { useEffect, useState } from 'react';

export function ScheduleDashboard() {
  const token = localStorage.getItem('access_token') || '';
  const { connected, subscribe, on, off } = useWebSocket('ws://localhost:8000/ws', token);
  const [schedules, setSchedules] = useState([]);

  useEffect(() => {
    if (connected) {
      // Subscribe to schedule events
      subscribe([WS_CHANNELS.SCHEDULES]);

      // Handle schedule created
      const handleScheduleCreated = (payload: any) => {
        console.log('New schedule created:', payload.schedule);
        setSchedules((prev) => [...prev, payload.schedule]);
      };

      // Handle schedule updated
      const handleScheduleUpdated = (payload: any) => {
        console.log('Schedule updated:', payload.schedule);
        setSchedules((prev) =>
          prev.map((s) => (s.id === payload.scheduleId ? payload.schedule : s))
        );
      };

      // Register handlers
      on(WS_EVENT_TYPES.SCHEDULE_CREATED, handleScheduleCreated);
      on(WS_EVENT_TYPES.SCHEDULE_UPDATED, handleScheduleUpdated);

      // Cleanup
      return () => {
        off(WS_EVENT_TYPES.SCHEDULE_CREATED, handleScheduleCreated);
        off(WS_EVENT_TYPES.SCHEDULE_UPDATED, handleScheduleUpdated);
      };
    }
  }, [connected]);

  return (
    <div>
      <h1>Schedule Dashboard</h1>
      <div>Status: {connected ? 'Connected' : 'Disconnected'}</div>
      {/* Render schedules */}
    </div>
  );
}
```

## Server Implementation (Python/FastAPI)

### 1. WebSocket Manager

```python
from typing import Dict, Set
from fastapi import WebSocket
import json
import uuid
from python.websocket.types import WSEventType, create_ws_message

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}
        self.user_connections: Dict[str, str] = {}  # user_id -> connection_id
        self.subscriptions: Dict[str, Set[str]] = {}  # connection_id -> channels

    async def connect(self, websocket: WebSocket, user_id: str) -> str:
        await websocket.accept()
        connection_id = str(uuid.uuid4())
        self.active_connections[connection_id] = websocket
        self.user_connections[user_id] = connection_id
        self.subscriptions[connection_id] = set()
        
        # Send connection established message
        await self.send_to_connection(
            connection_id,
            create_ws_message(
                WSEventType.CONNECTION_ESTABLISHED,
                {"connection_id": connection_id, "user_id": user_id},
                str(uuid.uuid4())
            )
        )
        
        return connection_id

    def disconnect(self, connection_id: str):
        if connection_id in self.active_connections:
            del self.active_connections[connection_id]
        if connection_id in self.subscriptions:
            del self.subscriptions[connection_id]
        
        # Remove from user_connections
        for user_id, conn_id in list(self.user_connections.items()):
            if conn_id == connection_id:
                del self.user_connections[user_id]

    async def subscribe(self, connection_id: str, channels: list[str]):
        if connection_id in self.subscriptions:
            self.subscriptions[connection_id].update(channels)

    async def unsubscribe(self, connection_id: str, channels: list[str]):
        if connection_id in self.subscriptions:
            self.subscriptions[connection_id].difference_update(channels)

    async def send_to_connection(self, connection_id: str, message: dict):
        if connection_id in self.active_connections:
            websocket = self.active_connections[connection_id]
            await websocket.send_json(message)

    async def send_to_user(self, user_id: str, message: dict):
        connection_id = self.user_connections.get(user_id)
        if connection_id:
            await self.send_to_connection(connection_id, message)

    async def broadcast_to_channel(self, channel: str, message: dict):
        for connection_id, channels in self.subscriptions.items():
            if channel in channels:
                await self.send_to_connection(connection_id, message)

manager = ConnectionManager()
```

### 2. WebSocket Endpoint

```python
from fastapi import WebSocket, WebSocketDisconnect, Depends
from python.websocket.types import WSEventType, create_ws_message

@app.websocket("/ws")
async def websocket_endpoint(
    websocket: WebSocket,
    token: str = Query(...),
    current_user = Depends(get_current_user_from_token)
):
    connection_id = await manager.connect(websocket, current_user.id)
    
    try:
        while True:
            # Receive message from client
            data = await websocket.receive_text()
            message = json.loads(data)
            
            # Handle different message types
            if message["type"] == WSEventType.SUBSCRIBE.value:
                channels = message["payload"]["channels"]
                await manager.subscribe(connection_id, channels)
                await manager.send_to_connection(
                    connection_id,
                    create_ws_message(
                        WSEventType.SUBSCRIBED,
                        {"channels": channels, "total": len(channels)},
                        str(uuid.uuid4())
                    )
                )
            
            elif message["type"] == WSEventType.UNSUBSCRIBE.value:
                channels = message["payload"]["channels"]
                await manager.unsubscribe(connection_id, channels)
            
            elif message["type"] == WSEventType.PING.value:
                await manager.send_to_connection(
                    connection_id,
                    {"type": WSEventType.PONG.value, "payload": {}}
                )
    
    except WebSocketDisconnect:
        manager.disconnect(connection_id)
```

### 3. Broadcasting Events

```python
from python.websocket.types import WSEventType, ScheduleCreatedPayload, create_ws_message

async def notify_schedule_created(schedule: Schedule):
    """Broadcast schedule created event"""
    message = create_ws_message(
        WSEventType.SCHEDULE_CREATED,
        ScheduleCreatedPayload(schedule=schedule),
        str(uuid.uuid4())
    )
    
    # Broadcast to schedules channel
    await manager.broadcast_to_channel("schedules", message)
    
    # Send to specific staff member
    await manager.send_to_user(schedule.staff_id, message)
```

## Testing

### WebSocket Testing Script

```typescript
// test-websocket.ts
const ws = new WebSocket('ws://localhost:8000/ws?token=<your_token>');

ws.onopen = () => {
  console.log('Connected');
  
  // Subscribe to channels
  ws.send(JSON.stringify({
    type: 'subscribe',
    payload: { channels: ['schedules', 'timeoff'] },
    timestamp: new Date().toISOString(),
    id: 'test-1'
  }));
};

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  console.log('Received:', message);
};

ws.onerror = (error) => {
  console.error('Error:', error);
};

ws.onclose = () => {
  console.log('Disconnected');
};
```

Run with: `ts-node test-websocket.ts`
