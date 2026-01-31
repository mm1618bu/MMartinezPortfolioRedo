# WebSocket Server Implementation

## Overview

This is a comprehensive WebSocket implementation for the Intraday Console, providing real-time bi-directional communication between the server and clients. Built with Socket.IO, it enables live updates for KPIs, backlog, attendance, and alerts without polling.

## Architecture

### Components

1. **Types** (`api/types/websocket.ts`)
   - Complete type definitions for all WebSocket operations
   - 17 message event types
   - Connection, subscription, and room management types
   - Data payload types for KPI, backlog, attendance, and alerts

2. **Server Service** (`api/services/websocket.service.ts`)
   - Socket.IO server implementation
   - Connection management with authentication
   - Hierarchical subscription system
   - Broadcast methods for all data types
   - Room lifecycle management
   - Statistics and monitoring

3. **HTTP Routes** (`api/routes/websocket.ts`)
   - REST endpoints for server management
   - Statistics, connections, and rooms info
   - HTTP-triggered broadcasts
   - Health checks

4. **Client Service** (`src/services/websocketClient.ts`)
   - Socket.IO client wrapper
   - Connection lifecycle management
   - Authentication and subscription handling
   - Event handlers for all message types

5. **React Hooks** (`src/hooks/useWebSocket.ts`)
   - `useWebSocket` - Connection management
   - `useWebSocketSubscription` - Channel subscriptions
   - `useKPIUpdates` - Listen for KPI updates
   - `useBacklogUpdates` - Listen for backlog updates
   - `useAttendanceUpdates` - Listen for attendance updates
   - `useAlertNotifications` - Listen for alerts
   - `useWebSocketHealth` - Connection health monitoring

6. **Example Component** (`src/components/LiveDashboard.tsx`)
   - Full example of real-time dashboard
   - Shows connection status, KPIs, and backlog
   - Demonstrates hook usage

## Features

### Connection Management
- Automatic reconnection with exponential backoff
- Connection health monitoring with ping/pong
- Authentication with user and organization
- Connection limits (100 per org, 1000 total)
- Graceful shutdown

### Subscription System
- Channel-based subscriptions: `kpi`, `backlog`, `attendance`, `alerts`, `notifications`, `all`
- Hierarchical filtering by organization, department, and queue
- Room-based targeting for efficient broadcasts
- Dynamic subscribe/unsubscribe

### Message Handling
- 17 event types covering all data updates
- Priority levels: low, medium, high, urgent
- Optional message acknowledgments
- Message size limits (1MB default)
- Rate limiting (100 msg/sec per client)

### Broadcasting
- Targeted broadcasts by org/dept/queue
- Broadcast to specific socket IDs
- Broadcast to all connected clients
- Specialized methods for KPI, backlog, attendance, alerts

### Room Management
- Automatic room creation on subscription
- Hierarchical room structure: `channel:org:dept:queue`
- Periodic cleanup of empty rooms
- Room member tracking

### Performance
- Compression for messages > 1KB
- WebSocket + polling fallback transports
- Message stats and latency tracking
- Configurable limits and timeouts

## Usage

### Server Initialization

The WebSocket server is automatically initialized in `api/server.ts`:

```typescript
import { createServer } from 'http';
import { webSocketService } from './services/websocket.service';

const httpServer = createServer(app);
webSocketService.initialize(httpServer);
```

### Client Setup

#### Initialize and Connect

```typescript
import { websocketClient } from './services/websocketClient';

// Initialize
websocketClient.initialize({
  url: 'http://localhost:5000',
  path: '/ws',
  reconnection: true,
  reconnectionAttempts: 5,
  autoConnect: true,
});

// Authenticate
await websocketClient.authenticate(userId, organizationId);
```

#### Subscribe to Channels

```typescript
// Subscribe to KPI updates for specific queue
await websocketClient.subscribe(
  ['kpi'],
  {
    organization_id: 'org_123',
    department_id: 'dept_456',
    queue_name: 'support',
  }
);

// Subscribe to all alerts for organization
await websocketClient.subscribe(
  ['alerts'],
  { organization_id: 'org_123' }
);
```

#### Handle Events

```typescript
websocketClient.on({
  onConnect: () => console.log('Connected'),
  onDisconnect: (reason) => console.log('Disconnected:', reason),
  onKPIUpdate: (payload) => {
    console.log('KPI update:', payload);
    // Update UI with new KPIs
  },
  onAlertTriggered: (payload) => {
    console.log('Alert:', payload);
    // Show notification
  },
});
```

### React Integration

#### Connection Hook

```tsx
import { useWebSocket } from './hooks/useWebSocket';

function App() {
  const {
    isConnected,
    isAuthenticated,
    connectionStatus,
    authenticate,
  } = useWebSocket({
    url: 'http://localhost:5000',
    autoConnect: true,
    autoAuthenticate: true,
    userId: 'user_123',
    organizationId: 'org_123',
  });

  return (
    <div>
      Status: {connectionStatus}
      {isConnected && isAuthenticated && <Dashboard />}
    </div>
  );
}
```

#### KPI Updates Hook

```tsx
import { useKPIUpdates } from './hooks/useWebSocket';

function KPIWidget() {
  const { latestUpdate } = useKPIUpdates(
    (payload) => {
      console.log('New KPI data:', payload);
    },
    {
      organization_id: 'org_123',
      queue_name: 'support',
    }
  );

  if (!latestUpdate) return <div>Waiting for updates...</div>;

  return (
    <div>
      <h3>Live KPIs</h3>
      <div>Utilization: {latestUpdate.utilization.current_utilization}%</div>
      <div>Health: {latestUpdate.health_score}</div>
    </div>
  );
}
```

#### Alert Notifications Hook

```tsx
import { useAlertNotifications } from './hooks/useWebSocket';

function AlertBell() {
  const { latestAlert, alertCount, clearAlertCount } = useAlertNotifications(
    (alert) => {
      // Show toast notification
      showToast(`Alert: ${alert.rule_name}`, alert.severity);
    },
    { organization_id: 'org_123' }
  );

  return (
    <div className="alert-bell" onClick={clearAlertCount}>
      🔔 {alertCount > 0 && <span className="badge">{alertCount}</span>}
    </div>
  );
}
```

### Server-Side Broadcasting

#### From Services

```typescript
import { webSocketService } from './services/websocket.service';

// After computing KPIs
const kpis = await liveKpiService.computeLiveKPIs(params);
webSocketService.broadcastKPIUpdate({
  organization_id: params.organization_id,
  department_id: params.department_id,
  queue_name: params.queue_name,
  timestamp: new Date().toISOString(),
  utilization: kpis.utilization,
  headcount_gap: kpis.headcount_gap,
  sla_risk: kpis.sla_risk,
  health_score: kpis.health_score,
  changes: calculateChanges(kpis, previousKpis),
});
```

#### Via HTTP API

```bash
# Broadcast KPI update
curl -X POST http://localhost:5000/api/ws/broadcast/kpi \
  -H "Content-Type: application/json" \
  -d '{
    "organization_id": "org_123",
    "queue_name": "support",
    "timestamp": "2024-01-15T10:30:00Z",
    "utilization": {...},
    "health_score": 85
  }'

# Get server stats
curl http://localhost:5000/api/ws/stats

# Get active connections
curl http://localhost:5000/api/ws/connections?organization_id=org_123
```

## Message Events

### KPI Events
- `kpi:update` - Real-time KPI updates
- `kpi:computed` - KPI computation completed
- `kpi:alert` - KPI threshold breach

### Backlog Events
- `backlog:update` - Real-time backlog updates
- `backlog:snapshot` - Full backlog snapshot
- `backlog:alert` - Backlog threshold breach

### Attendance Events
- `attendance:update` - Real-time attendance updates
- `attendance:checkin` - Employee checked in
- `attendance:checkout` - Employee checked out
- `attendance:alert` - Attendance issue

### Alert Events
- `alert:triggered` - New alert triggered
- `alert:acknowledged` - Alert acknowledged
- `alert:resolved` - Alert resolved
- `alert:escalated` - Alert escalated

### System Events
- `system:notification` - System-wide notification
- `system:broadcast` - General broadcast
- `system:maintenance` - Maintenance notification

### Client Events
- `client:subscribe` - Client subscribed
- `client:unsubscribe` - Client unsubscribed
- `client:ping` - Ping request
- `client:pong` - Pong response

## Configuration

### Server Config

Located in `api/services/websocket.service.ts`:

```typescript
const config = {
  port: 5000,
  path: '/ws',
  cors_origins: ['http://localhost:3000'],
  max_connections_per_org: 100,
  max_connections_total: 1000,
  max_message_size_bytes: 1048576, // 1MB
  rate_limit_messages_per_second: 100,
  ping_interval_ms: 25000,
  ping_timeout_ms: 60000,
  reconnection_enabled: true,
  reconnection_attempts: 5,
  reconnection_delay_ms: 1000,
  room_max_size: 1000,
  room_cleanup_interval_ms: 300000, // 5 min
  auth_required: true,
  auth_timeout_ms: 10000,
  compression_enabled: true,
  compression_threshold_bytes: 1024,
  enable_logging: true,
  log_all_messages: false,
  log_connection_events: true,
  log_subscription_events: true,
  log_broadcast_events: false,
};
```

### Client Config

```typescript
websocketClient.initialize({
  url: 'http://localhost:5000',
  path: '/ws',
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  timeout: 20000,
  autoConnect: true,
});
```

## API Endpoints

### GET /api/ws/stats
Get WebSocket server statistics including connections, rooms, messages, and performance metrics.

**Response:**
```json
{
  "success": true,
  "stats": {
    "active_connections": 45,
    "connections_by_org": {"org_123": 12, "org_456": 8},
    "active_rooms": 23,
    "rooms_by_type": {"org": 5, "dept": 8, "queue": 10},
    "total_messages": 15420,
    "messages_per_second": 12.5,
    "messages_by_event": {"kpi:update": 1200, "alert:triggered": 45},
    "average_latency_ms": 15,
    "max_latency_ms": 120,
    "error_count": 2,
    "uptime_seconds": 86400
  }
}
```

### GET /api/ws/connections
Get list of active connections, optionally filtered by organization.

**Query Params:**
- `organization_id` (optional) - Filter by organization

**Response:**
```json
{
  "success": true,
  "connections": [
    {
      "socket_id": "abc123",
      "user_id": "user_123",
      "organization_id": "org_123",
      "status": "connected",
      "subscriptions": ["kpi:org:123", "alerts:org:123"],
      "connected_at": "2024-01-15T10:00:00Z",
      "last_activity_at": "2024-01-15T10:30:00Z"
    }
  ],
  "total_count": 45
}
```

### GET /api/ws/connections/:socketId
Get specific connection details.

### GET /api/ws/rooms
Get list of active rooms with member counts.

### POST /api/ws/broadcast
Broadcast a custom message to connected clients.

**Request:**
```json
{
  "event": "system:notification",
  "data": {
    "message": "System maintenance in 10 minutes"
  },
  "target": {
    "organization_id": "org_123"
  },
  "priority": "urgent",
  "requires_ack": true
}
```

### POST /api/ws/broadcast/kpi
Broadcast KPI update (shortcut).

### POST /api/ws/broadcast/backlog
Broadcast backlog update (shortcut).

### POST /api/ws/broadcast/attendance
Broadcast attendance update (shortcut).

### POST /api/ws/broadcast/alert
Broadcast alert (shortcut).

### GET /api/ws/health
WebSocket server health check.

## Room Structure

Rooms follow a hierarchical naming convention:

```
channel:org:{org_id}:dept:{dept_id}:queue:{queue_name}
```

Examples:
- `org:org_123` - All messages for organization
- `kpi:org:org_123` - KPI updates for organization
- `kpi:org:org_123:dept:dept_456` - KPI updates for department
- `kpi:org:org_123:dept:dept_456:queue:support` - KPI updates for specific queue
- `alerts:org:org_123` - All alerts for organization

This allows efficient targeting of broadcasts to relevant subscribers.

## Error Handling

### Error Codes

- `AUTH_FAILED` - Authentication failed
- `UNAUTHORIZED` - Not authorized for action
- `INVALID_MESSAGE` - Invalid message format
- `MESSAGE_TOO_LARGE` - Message exceeds size limit
- `RATE_LIMIT_EXCEEDED` - Too many messages
- `SUBSCRIPTION_FAILED` - Failed to subscribe
- `ROOM_NOT_FOUND` - Room doesn't exist
- `ROOM_FULL` - Room at capacity
- `CONNECTION_LIMIT` - Connection limit reached
- `INTERNAL_ERROR` - Server error

### Client Reconnection

The client automatically reconnects on disconnect with exponential backoff:

1. Attempt 1: Immediate
2. Attempt 2: 1s delay
3. Attempt 3: 2s delay
4. Attempt 4: 4s delay
5. Attempt 5: 8s delay

After reconnection, the client:
1. Re-authenticates automatically
2. Re-subscribes to previous channels
3. Fires `onReconnect` callback

## Performance Considerations

### Scalability
- Single server supports 1000 concurrent connections
- For > 1000 connections, use Socket.IO Redis adapter for clustering
- Room-based broadcasting reduces message fanout

### Optimization
- Messages > 1KB are compressed automatically
- Heartbeat interval balances keep-alive and overhead
- Empty rooms cleaned up every 5 minutes
- Rate limiting prevents client abuse

### Monitoring
- Track message counts and rates
- Monitor latency (avg/max)
- Watch connection counts per org
- Alert on error rates

## Testing

### Manual Testing

```bash
# Start server
npm run dev:api

# Connect with wscat
npx wscat -c ws://localhost:5000/ws

# Authenticate
{"event":"authenticate","data":{"user_id":"user_123","organization_id":"org_123"}}

# Subscribe
{"event":"subscribe","data":{"channels":["kpi"],"organization_id":"org_123"}}

# Ping
{"event":"client:ping"}
```

### Integration Testing

See `src/components/LiveDashboard.tsx` for a complete example component that demonstrates all features.

## Security

### Authentication Required
All connections must authenticate with valid user_id and organization_id before subscribing to channels.

### Authorization
Clients can only subscribe to channels for their authenticated organization.

### Rate Limiting
- 100 messages per second per client
- Connection limits per organization

### Message Validation
- Size limits (1MB default)
- Format validation
- Event type whitelist

## Troubleshooting

### Connection Issues

**Problem:** Client can't connect
- Check WebSocket URL and path
- Verify CORS settings
- Check firewall/proxy WebSocket support

**Problem:** Frequent disconnections
- Check network stability
- Adjust ping timeout
- Monitor server resources

### Subscription Issues

**Problem:** Not receiving updates
- Verify authentication succeeded
- Check subscription filters match broadcast target
- Confirm server is broadcasting (check stats)

**Problem:** Duplicate messages
- Check for multiple subscriptions
- Verify client doesn't have multiple instances

### Performance Issues

**Problem:** High latency
- Check network conditions
- Monitor server CPU/memory
- Consider enabling compression
- Review message size

**Problem:** Connection limits hit
- Increase per-org or total limits
- Implement connection pooling
- Consider clustering with Redis

## Future Enhancements

- [ ] Redis adapter for multi-server clustering
- [ ] Persistent message queue for offline clients
- [ ] Message replay on reconnect
- [ ] Enhanced security with JWT tokens
- [ ] Metrics dashboard
- [ ] Load testing suite
- [ ] Admin UI for connection management

## Dependencies

- `socket.io` - WebSocket server library
- `socket.io-client` - WebSocket client library
- `winston` - Logging
- `express` - HTTP server

## References

- [Socket.IO Documentation](https://socket.io/docs/)
- [WebSocket API](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)
- [Socket.IO Client API](https://socket.io/docs/v4/client-api/)
