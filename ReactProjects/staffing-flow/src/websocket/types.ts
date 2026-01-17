/**
 * WebSocket Event Types and Payloads
 * Type definitions for all WebSocket events
 */

// Base message structure
export interface WebSocketMessage<T = any> {
  type: string;
  payload: T;
  timestamp: string;
  id: string;
  userId?: string;
  organizationId?: string;
}

// Connection Events
export type ConnectionEstablishedPayload = {
  connectionId: string;
  userId: string;
  serverTime: string;
};

export type ConnectionAuthenticatedPayload = {
  userId: string;
  role: string;
  organizationId: string;
};

export type ConnectionErrorPayload = {
  code: string;
  message: string;
  reconnect: boolean;
};

// Subscription Events
export type SubscribePayload = {
  channels: string[];
};

export type SubscribedPayload = {
  channels: string[];
  total: number;
};

export type UnsubscribePayload = {
  channels: string[];
};

// Schedule Events
export interface Schedule {
  id: string;
  staffId: string;
  startTime: string;
  endTime: string;
  position: string;
  status: 'draft' | 'published' | 'archived';
  notes?: string;
  createdBy: string;
}

export type ScheduleCreatedPayload = {
  schedule: Schedule;
};

export type ScheduleUpdatedPayload = {
  scheduleId: string;
  changes: Record<string, { old: any; new: any }>;
  schedule: Schedule;
  updatedBy: string;
};

export type ScheduleDeletedPayload = {
  scheduleId: string;
  deletedBy: string;
  reason?: string;
};

export type SchedulePublishedPayload = {
  scheduleId: string;
  staffId: string;
  publishedBy: string;
  notificationSent: boolean;
};

// Time Off Events
export interface TimeOff {
  id: string;
  staffId: string;
  type: 'vacation' | 'sick' | 'personal' | 'unpaid' | 'bereavement' | 'jury_duty';
  startDate: string;
  endDate: string;
  totalDays: number;
  status: 'pending' | 'approved' | 'denied' | 'cancelled';
  reason?: string;
}

export type TimeOffCreatedPayload = {
  timeOff: TimeOff;
};

export type TimeOffApprovedPayload = {
  timeOffId: string;
  staffId: string;
  approvedBy: string;
  approverName: string;
  notes?: string;
  timeOff: TimeOff;
};

export type TimeOffDeniedPayload = {
  timeOffId: string;
  staffId: string;
  deniedBy: string;
  denierName: string;
  reason: string;
  timeOff: TimeOff;
};

export type TimeOffCancelledPayload = {
  timeOffId: string;
  staffId: string;
  cancelledBy: string;
  reason?: string;
};

// Staff Events
export interface Staff {
  id: string;
  firstName: string;
  lastName: string;
  departmentId: string;
  position: string;
  status: 'active' | 'inactive' | 'on_leave' | 'terminated';
}

export type StaffCreatedPayload = {
  staff: Staff;
};

export type StaffUpdatedPayload = {
  staffId: string;
  changes: Record<string, { old: any; new: any }>;
  staff: Staff;
};

export type StaffStatusChangedPayload = {
  staffId: string;
  oldStatus: string;
  newStatus: string;
  reason?: string;
  effectiveDate?: string;
};

// Notification Events
export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'schedule' | 'timeoff' | 'announcement';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  actionUrl?: string;
  read: boolean;
  expiresAt?: string;
}

export type NotificationNewPayload = {
  notification: Notification;
};

export type NotificationReadPayload = {
  notificationId: string;
};

// Presence Events
export type PresenceUpdatePayload = {
  status: 'online' | 'away' | 'busy' | 'offline';
  activity?: string;
};

export type PresenceChangedPayload = {
  userId: string;
  userName: string;
  status: 'online' | 'away' | 'busy' | 'offline';
  lastSeen: string;
};

// Messaging Events
export type MessageSendPayload = {
  recipientId: string;
  message: string;
  attachments?: string[];
};

export type MessageReceivedPayload = {
  messageId: string;
  senderId: string;
  senderName: string;
  message: string;
  timestamp: string;
  read: boolean;
};

// System Events
export type SystemAnnouncementPayload = {
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'critical';
  expiresAt?: string;
};

export type SystemMaintenancePayload = {
  startsAt: string;
  duration: string;
  reason: string;
  disconnectIn: number;
};

// Error Events
export type ErrorPayload = {
  code: string;
  message: string;
  details?: Record<string, any>;
};

// Event Type Discriminated Union
export type WebSocketEvent =
  | WebSocketMessage<ConnectionEstablishedPayload>
  | WebSocketMessage<ConnectionAuthenticatedPayload>
  | WebSocketMessage<ConnectionErrorPayload>
  | WebSocketMessage<SubscribePayload>
  | WebSocketMessage<SubscribedPayload>
  | WebSocketMessage<UnsubscribePayload>
  | WebSocketMessage<ScheduleCreatedPayload>
  | WebSocketMessage<ScheduleUpdatedPayload>
  | WebSocketMessage<ScheduleDeletedPayload>
  | WebSocketMessage<SchedulePublishedPayload>
  | WebSocketMessage<TimeOffCreatedPayload>
  | WebSocketMessage<TimeOffApprovedPayload>
  | WebSocketMessage<TimeOffDeniedPayload>
  | WebSocketMessage<TimeOffCancelledPayload>
  | WebSocketMessage<StaffCreatedPayload>
  | WebSocketMessage<StaffUpdatedPayload>
  | WebSocketMessage<StaffStatusChangedPayload>
  | WebSocketMessage<NotificationNewPayload>
  | WebSocketMessage<NotificationReadPayload>
  | WebSocketMessage<PresenceUpdatePayload>
  | WebSocketMessage<PresenceChangedPayload>
  | WebSocketMessage<MessageSendPayload>
  | WebSocketMessage<MessageReceivedPayload>
  | WebSocketMessage<SystemAnnouncementPayload>
  | WebSocketMessage<SystemMaintenancePayload>
  | WebSocketMessage<ErrorPayload>;

// Event type constants
export const WS_EVENT_TYPES = {
  // Connection
  CONNECTION_ESTABLISHED: 'connection:established',
  CONNECTION_AUTHENTICATED: 'connection:authenticated',
  CONNECTION_ERROR: 'connection:error',
  PING: 'ping',
  PONG: 'pong',

  // Subscription
  SUBSCRIBE: 'subscribe',
  SUBSCRIBED: 'subscribed',
  UNSUBSCRIBE: 'unsubscribe',

  // Schedule
  SCHEDULE_CREATED: 'schedule:created',
  SCHEDULE_UPDATED: 'schedule:updated',
  SCHEDULE_DELETED: 'schedule:deleted',
  SCHEDULE_PUBLISHED: 'schedule:published',

  // Time Off
  TIMEOFF_CREATED: 'timeoff:created',
  TIMEOFF_APPROVED: 'timeoff:approved',
  TIMEOFF_DENIED: 'timeoff:denied',
  TIMEOFF_CANCELLED: 'timeoff:cancelled',

  // Staff
  STAFF_CREATED: 'staff:created',
  STAFF_UPDATED: 'staff:updated',
  STAFF_STATUS_CHANGED: 'staff:status_changed',

  // Notifications
  NOTIFICATION_NEW: 'notification:new',
  NOTIFICATION_READ: 'notification:read',

  // Presence
  PRESENCE_UPDATE: 'presence:update',
  PRESENCE_CHANGED: 'presence:changed',

  // Messaging
  MESSAGE_SEND: 'message:send',
  MESSAGE_RECEIVED: 'message:received',

  // System
  SYSTEM_ANNOUNCEMENT: 'system:announcement',
  SYSTEM_MAINTENANCE: 'system:maintenance',

  // Error
  ERROR: 'error',
} as const;

// Channel patterns
export const WS_CHANNELS = {
  SCHEDULES: 'schedules',
  SCHEDULES_ID: (id: string) => `schedules:${id}`,
  STAFF: 'staff',
  STAFF_ID: (id: string) => `staff:${id}`,
  TIMEOFF: 'timeoff',
  TIMEOFF_ID: (id: string) => `timeoff:${id}`,
  DEPARTMENT_ID: (id: string) => `department:${id}`,
  USER_ID: (id: string) => `user:${id}`,
  ORGANIZATION_ID: (id: string) => `organization:${id}`,
} as const;
