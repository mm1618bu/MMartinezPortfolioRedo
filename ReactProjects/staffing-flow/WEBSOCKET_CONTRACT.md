# WebSocket Event Contract

## Overview

The Staffing Flow WebSocket API provides real-time bidirectional communication for instant updates on schedules, time off requests, notifications, and more.

## Connection

### Endpoint

```
ws://localhost:8000/ws
wss://api.staffingflow.com/ws
```

### Authentication

WebSocket connections require JWT authentication via query parameter or initial message:

**Option 1: Query Parameter (Recommended)**

```javascript
const ws = new WebSocket('ws://localhost:8000/ws?token=<jwt_token>');
```

**Option 2: Initial Auth Message**

```javascript
const ws = new WebSocket('ws://localhost:8000/ws');
ws.onopen = () => {
  ws.send(
    JSON.stringify({
      type: 'auth',
      payload: { token: '<jwt_token>' },
    })
  );
};
```

### Connection Lifecycle

1. **Connect** - Establish WebSocket connection with authentication
2. **Subscribe** - Subscribe to specific channels/rooms
3. **Receive** - Listen for events
4. **Send** - Send events/actions
5. **Disconnect** - Clean disconnect with optional reconnection

## Message Format

All messages follow a consistent JSON structure:

```typescript
{
  "type": string,           // Event type
  "payload": object,        // Event data
  "timestamp": string,      // ISO 8601 timestamp
  "id": string,            // Unique message ID
  "userId"?: string,       // Sender user ID (server-added)
  "organizationId"?: string // Organization context (server-added)
}
```

## Event Categories

### 1. Connection Events

#### `connection:established`

Sent by server after successful connection.

**Direction**: Server → Client

```json
{
  "type": "connection:established",
  "payload": {
    "connectionId": "conn-123",
    "userId": "user-456",
    "serverTime": "2026-01-17T10:30:00Z"
  },
  "timestamp": "2026-01-17T10:30:00Z",
  "id": "msg-001"
}
```

#### `connection:authenticated`

Sent by server after successful authentication.

**Direction**: Server → Client

```json
{
  "type": "connection:authenticated",
  "payload": {
    "userId": "user-456",
    "role": "admin",
    "organizationId": "org-789"
  },
  "timestamp": "2026-01-17T10:30:01Z",
  "id": "msg-002"
}
```

#### `connection:error`

Sent by server on connection or authentication error.

**Direction**: Server → Client

```json
{
  "type": "connection:error",
  "payload": {
    "code": "AUTH_FAILED",
    "message": "Invalid or expired token",
    "reconnect": false
  },
  "timestamp": "2026-01-17T10:30:02Z",
  "id": "msg-003"
}
```

#### `ping` / `pong`

Heartbeat messages to keep connection alive.

**Direction**: Bidirectional

```json
{
  "type": "ping",
  "payload": {},
  "timestamp": "2026-01-17T10:30:30Z",
  "id": "msg-004"
}
```

### 2. Subscription Events

#### `subscribe`

Subscribe to specific channels.

**Direction**: Client → Server

**Channels:**

- `schedules` - All schedule events (filtered by RBAC)
- `schedules:{id}` - Specific schedule
- `staff` - All staff events
- `staff:{id}` - Specific staff member
- `timeoff` - All time off events
- `timeoff:{id}` - Specific time off request
- `department:{id}` - Department-specific events
- `user:{id}` - User-specific notifications
- `organization:{id}` - Organization-wide announcements

```json
{
  "type": "subscribe",
  "payload": {
    "channels": ["schedules", "timeoff", "user:user-456"]
  },
  "timestamp": "2026-01-17T10:30:05Z",
  "id": "msg-005"
}
```

#### `subscribed`

Confirmation of successful subscription.

**Direction**: Server → Client

```json
{
  "type": "subscribed",
  "payload": {
    "channels": ["schedules", "timeoff", "user:user-456"],
    "total": 3
  },
  "timestamp": "2026-01-17T10:30:06Z",
  "id": "msg-006"
}
```

#### `unsubscribe`

Unsubscribe from channels.

**Direction**: Client → Server

```json
{
  "type": "unsubscribe",
  "payload": {
    "channels": ["schedules"]
  },
  "timestamp": "2026-01-17T10:35:00Z",
  "id": "msg-007"
}
```

### 3. Schedule Events

#### `schedule:created`

New schedule created.

**Direction**: Server → Client

**Channel**: `schedules`, `staff:{staffId}`

**Permissions**: Respects RBAC (schedule.read scope)

```json
{
  "type": "schedule:created",
  "payload": {
    "schedule": {
      "id": "sched-123",
      "staffId": "staff-456",
      "startTime": "2026-01-20T09:00:00Z",
      "endTime": "2026-01-20T17:00:00Z",
      "position": "Front Desk",
      "status": "draft",
      "createdBy": "user-789"
    }
  },
  "timestamp": "2026-01-17T10:40:00Z",
  "id": "msg-008",
  "userId": "user-789"
}
```

#### `schedule:updated`

Schedule modified.

**Direction**: Server → Client

**Channel**: `schedules`, `schedules:{id}`, `staff:{staffId}`

```json
{
  "type": "schedule:updated",
  "payload": {
    "scheduleId": "sched-123",
    "changes": {
      "startTime": {
        "old": "2026-01-20T09:00:00Z",
        "new": "2026-01-20T10:00:00Z"
      }
    },
    "schedule": {
      /* full schedule object */
    },
    "updatedBy": "user-789"
  },
  "timestamp": "2026-01-17T10:45:00Z",
  "id": "msg-009"
}
```

#### `schedule:deleted`

Schedule removed.

**Direction**: Server → Client

**Channel**: `schedules`, `schedules:{id}`

```json
{
  "type": "schedule:deleted",
  "payload": {
    "scheduleId": "sched-123",
    "deletedBy": "user-789",
    "reason": "Staff requested change"
  },
  "timestamp": "2026-01-17T10:50:00Z",
  "id": "msg-010"
}
```

#### `schedule:published`

Schedule published to staff.

**Direction**: Server → Client

**Channel**: `schedules`, `schedules:{id}`, `staff:{staffId}`

```json
{
  "type": "schedule:published",
  "payload": {
    "scheduleId": "sched-123",
    "staffId": "staff-456",
    "publishedBy": "user-789",
    "notificationSent": true
  },
  "timestamp": "2026-01-17T11:00:00Z",
  "id": "msg-011"
}
```

### 4. Time Off Events

#### `timeoff:created`

New time off request submitted.

**Direction**: Server → Client

**Channel**: `timeoff`, `user:{userId}`, `staff:{staffId}`

```json
{
  "type": "timeoff:created",
  "payload": {
    "timeOff": {
      "id": "to-123",
      "staffId": "staff-456",
      "type": "vacation",
      "startDate": "2026-02-10",
      "endDate": "2026-02-14",
      "totalDays": 5,
      "status": "pending",
      "reason": "Family vacation"
    }
  },
  "timestamp": "2026-01-17T11:10:00Z",
  "id": "msg-012"
}
```

#### `timeoff:approved`

Time off request approved.

**Direction**: Server → Client

**Channel**: `timeoff`, `timeoff:{id}`, `user:{userId}`, `staff:{staffId}`

```json
{
  "type": "timeoff:approved",
  "payload": {
    "timeOffId": "to-123",
    "staffId": "staff-456",
    "approvedBy": "user-789",
    "approverName": "John Manager",
    "notes": "Approved - enjoy your vacation!",
    "timeOff": {
      /* full time off object */
    }
  },
  "timestamp": "2026-01-17T11:15:00Z",
  "id": "msg-013"
}
```

#### `timeoff:denied`

Time off request denied.

**Direction**: Server → Client

**Channel**: `timeoff`, `timeoff:{id}`, `user:{userId}`, `staff:{staffId}`

```json
{
  "type": "timeoff:denied",
  "payload": {
    "timeOffId": "to-123",
    "staffId": "staff-456",
    "deniedBy": "user-789",
    "denierName": "John Manager",
    "reason": "Insufficient coverage during that period",
    "timeOff": {
      /* full time off object */
    }
  },
  "timestamp": "2026-01-17T11:20:00Z",
  "id": "msg-014"
}
```

#### `timeoff:cancelled`

Time off request cancelled.

**Direction**: Server → Client

**Channel**: `timeoff`, `timeoff:{id}`, `user:{userId}`

```json
{
  "type": "timeoff:cancelled",
  "payload": {
    "timeOffId": "to-123",
    "staffId": "staff-456",
    "cancelledBy": "user-456",
    "reason": "Plans changed"
  },
  "timestamp": "2026-01-17T11:25:00Z",
  "id": "msg-015"
}
```

### 5. Staff Events

#### `staff:created`

New staff member added.

**Direction**: Server → Client

**Channel**: `staff`, `department:{departmentId}`

```json
{
  "type": "staff:created",
  "payload": {
    "staff": {
      "id": "staff-789",
      "firstName": "Jane",
      "lastName": "Smith",
      "departmentId": "dept-123",
      "position": "Software Engineer",
      "status": "active"
    }
  },
  "timestamp": "2026-01-17T11:30:00Z",
  "id": "msg-016"
}
```

#### `staff:updated`

Staff information modified.

**Direction**: Server → Client

**Channel**: `staff`, `staff:{id}`, `department:{departmentId}`

```json
{
  "type": "staff:updated",
  "payload": {
    "staffId": "staff-789",
    "changes": {
      "position": {
        "old": "Junior Engineer",
        "new": "Software Engineer"
      }
    },
    "staff": {
      /* full staff object */
    }
  },
  "timestamp": "2026-01-17T11:35:00Z",
  "id": "msg-017"
}
```

#### `staff:status_changed`

Staff status changed (active, inactive, on_leave, terminated).

**Direction**: Server → Client

**Channel**: `staff`, `staff:{id}`

```json
{
  "type": "staff:status_changed",
  "payload": {
    "staffId": "staff-789",
    "oldStatus": "active",
    "newStatus": "on_leave",
    "reason": "Medical leave",
    "effectiveDate": "2026-01-20"
  },
  "timestamp": "2026-01-17T11:40:00Z",
  "id": "msg-018"
}
```

### 6. Notification Events

#### `notification:new`

New notification for user.

**Direction**: Server → Client

**Channel**: `user:{userId}`

**Notification Types**: `info`, `success`, `warning`, `error`, `schedule`, `timeoff`, `announcement`

```json
{
  "type": "notification:new",
  "payload": {
    "notification": {
      "id": "notif-123",
      "title": "Schedule Published",
      "message": "Your schedule for next week has been published",
      "type": "schedule",
      "priority": "normal",
      "actionUrl": "/schedules/sched-123",
      "read": false,
      "expiresAt": "2026-01-24T11:45:00Z"
    }
  },
  "timestamp": "2026-01-17T11:45:00Z",
  "id": "msg-019"
}
```

#### `notification:read`

Mark notification as read.

**Direction**: Client → Server

```json
{
  "type": "notification:read",
  "payload": {
    "notificationId": "notif-123"
  },
  "timestamp": "2026-01-17T11:50:00Z",
  "id": "msg-020"
}
```

### 7. User Presence Events

#### `presence:update`

Update user's online status.

**Direction**: Client → Server

```json
{
  "type": "presence:update",
  "payload": {
    "status": "online",
    "activity": "Viewing schedules"
  },
  "timestamp": "2026-01-17T12:00:00Z",
  "id": "msg-021"
}
```

#### `presence:changed`

User presence changed.

**Direction**: Server → Client

**Channel**: `organization:{id}`, `department:{id}`

```json
{
  "type": "presence:changed",
  "payload": {
    "userId": "user-456",
    "userName": "John Doe",
    "status": "online",
    "lastSeen": "2026-01-17T12:00:00Z"
  },
  "timestamp": "2026-01-17T12:00:00Z",
  "id": "msg-022"
}
```

### 8. Chat/Messaging Events (Optional)

#### `message:send`

Send a message.

**Direction**: Client → Server

```json
{
  "type": "message:send",
  "payload": {
    "recipientId": "user-789",
    "message": "Can you cover my shift tomorrow?",
    "attachments": []
  },
  "timestamp": "2026-01-17T12:10:00Z",
  "id": "msg-023"
}
```

#### `message:received`

New message received.

**Direction**: Server → Client

**Channel**: `user:{userId}`

```json
{
  "type": "message:received",
  "payload": {
    "messageId": "msg-456",
    "senderId": "user-456",
    "senderName": "John Doe",
    "message": "Can you cover my shift tomorrow?",
    "timestamp": "2026-01-17T12:10:00Z",
    "read": false
  },
  "timestamp": "2026-01-17T12:10:00Z",
  "id": "msg-024"
}
```

### 9. System Events

#### `system:announcement`

Organization-wide announcement.

**Direction**: Server → Client

**Channel**: `organization:{id}`

```json
{
  "type": "system:announcement",
  "payload": {
    "title": "System Maintenance",
    "message": "Scheduled maintenance on Saturday 2AM-4AM",
    "severity": "info",
    "expiresAt": "2026-01-25T02:00:00Z"
  },
  "timestamp": "2026-01-17T12:20:00Z",
  "id": "msg-025"
}
```

#### `system:maintenance`

System going into maintenance mode.

**Direction**: Server → Client

**Channel**: All connections

```json
{
  "type": "system:maintenance",
  "payload": {
    "startsAt": "2026-01-25T02:00:00Z",
    "duration": "2 hours",
    "reason": "Database upgrade",
    "disconnectIn": 300
  },
  "timestamp": "2026-01-17T12:25:00Z",
  "id": "msg-026"
}
```

## Error Handling

### Error Message Format

```json
{
  "type": "error",
  "payload": {
    "code": "PERMISSION_DENIED",
    "message": "You don't have permission to subscribe to this channel",
    "details": {
      "channel": "staff",
      "requiredPermission": "staff.read"
    }
  },
  "timestamp": "2026-01-17T12:30:00Z",
  "id": "msg-027"
}
```

### Error Codes

- `AUTH_REQUIRED` - Authentication required
- `AUTH_FAILED` - Authentication failed
- `TOKEN_EXPIRED` - JWT token expired
- `PERMISSION_DENIED` - Insufficient permissions
- `INVALID_MESSAGE` - Malformed message
- `CHANNEL_NOT_FOUND` - Channel doesn't exist
- `RATE_LIMIT_EXCEEDED` - Too many messages
- `SERVER_ERROR` - Internal server error

## Security & Permissions

### RBAC Integration

All events respect RBAC permissions:

- Users only receive events they have permission to see
- Subscriptions are validated against user permissions
- Events are filtered by organization/team scope
- Sensitive data is redacted based on role

### Channel Access Control

| Channel             | Required Permission                    |
| ------------------- | -------------------------------------- |
| `schedules`         | `schedule.read`                        |
| `schedules:{id}`    | `schedule.read` or `schedule.read.own` |
| `staff`             | `staff.read`                           |
| `staff:{id}`        | `staff.read` or `staff.read.own`       |
| `timeoff`           | `timeoff.read`                         |
| `timeoff:{id}`      | `timeoff.read` or `timeoff.read.own`   |
| `department:{id}`   | `department.read` + team membership    |
| `user:{id}`         | Own user ID only                       |
| `organization:{id}` | Organization membership                |

## Best Practices

### Reconnection Strategy

Implement exponential backoff for reconnections:

```javascript
let reconnectDelay = 1000; // Start with 1 second
const maxDelay = 30000; // Max 30 seconds

function reconnect() {
  setTimeout(() => {
    connect();
    reconnectDelay = Math.min(reconnectDelay * 2, maxDelay);
  }, reconnectDelay);
}
```

### Message Queueing

Queue messages when disconnected:

```javascript
const messageQueue = [];
let connected = false;

function sendMessage(message) {
  if (connected) {
    ws.send(JSON.stringify(message));
  } else {
    messageQueue.push(message);
  }
}

ws.onopen = () => {
  connected = true;
  // Send queued messages
  while (messageQueue.length > 0) {
    ws.send(JSON.stringify(messageQueue.shift()));
  }
};
```

### Heartbeat

Implement heartbeat to detect connection issues:

```javascript
let heartbeatInterval;

function startHeartbeat() {
  heartbeatInterval = setInterval(() => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'ping', payload: {} }));
    }
  }, 30000); // Every 30 seconds
}

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  if (message.type === 'pong') {
    // Connection is alive
  }
};
```

## Rate Limiting

- **Connection rate**: 5 connections per minute per user
- **Message rate**: 60 messages per minute per connection
- **Subscription rate**: 10 subscriptions per minute

Exceeding limits results in `RATE_LIMIT_EXCEEDED` error and temporary connection throttling.

## Testing

### WebSocket Testing Tools

- **wscat**: Command-line WebSocket client
- **Postman**: WebSocket support in recent versions
- **Browser DevTools**: Network tab WebSocket frames

### Example with wscat

```bash
# Install wscat
npm install -g wscat

# Connect with auth token
wscat -c "ws://localhost:8000/ws?token=<jwt_token>"

# Send subscribe message
> {"type":"subscribe","payload":{"channels":["schedules"]},"timestamp":"2026-01-17T12:00:00Z","id":"test-1"}

# Receive events
< {"type":"schedule:created","payload":{...}}
```

## Implementation Examples

See [WEBSOCKET_GUIDE.md](WEBSOCKET_GUIDE.md) for detailed implementation examples in TypeScript and Python.

## Version History

- **v1.0.0** (2026-01-17): Initial WebSocket contract
  - Connection and subscription events
  - Schedule, time off, staff events
  - Notification system
  - Presence tracking
  - Basic messaging

## Future Enhancements

- [ ] Bulk event batching
- [ ] Event replay for missed messages
- [ ] Compressed message encoding
- [ ] Binary message support
- [ ] Video/audio signaling for calls
- [ ] File transfer protocol
- [ ] GraphQL subscription integration
