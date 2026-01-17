"""WebSocket Event Types and Payloads for Python Backend"""

from enum import Enum
from typing import Any, Dict, List, Optional, Union
from datetime import datetime
from pydantic import BaseModel, Field


class WSEventType(str, Enum):
    """WebSocket event types"""

    # Connection
    CONNECTION_ESTABLISHED = "connection:established"
    CONNECTION_AUTHENTICATED = "connection:authenticated"
    CONNECTION_ERROR = "connection:error"
    PING = "ping"
    PONG = "pong"

    # Subscription
    SUBSCRIBE = "subscribe"
    SUBSCRIBED = "subscribed"
    UNSUBSCRIBE = "unsubscribe"

    # Schedule
    SCHEDULE_CREATED = "schedule:created"
    SCHEDULE_UPDATED = "schedule:updated"
    SCHEDULE_DELETED = "schedule:deleted"
    SCHEDULE_PUBLISHED = "schedule:published"

    # Time Off
    TIMEOFF_CREATED = "timeoff:created"
    TIMEOFF_APPROVED = "timeoff:approved"
    TIMEOFF_DENIED = "timeoff:denied"
    TIMEOFF_CANCELLED = "timeoff:cancelled"

    # Staff
    STAFF_CREATED = "staff:created"
    STAFF_UPDATED = "staff:updated"
    STAFF_STATUS_CHANGED = "staff:status_changed"

    # Notifications
    NOTIFICATION_NEW = "notification:new"
    NOTIFICATION_READ = "notification:read"

    # Presence
    PRESENCE_UPDATE = "presence:update"
    PRESENCE_CHANGED = "presence:changed"

    # Messaging
    MESSAGE_SEND = "message:send"
    MESSAGE_RECEIVED = "message:received"

    # System
    SYSTEM_ANNOUNCEMENT = "system:announcement"
    SYSTEM_MAINTENANCE = "system:maintenance"

    # Error
    ERROR = "error"


class WSChannel:
    """WebSocket channel patterns"""

    SCHEDULES = "schedules"
    STAFF = "staff"
    TIMEOFF = "timeoff"

    @staticmethod
    def schedules_id(schedule_id: str) -> str:
        return f"schedules:{schedule_id}"

    @staticmethod
    def staff_id(staff_id: str) -> str:
        return f"staff:{staff_id}"

    @staticmethod
    def timeoff_id(timeoff_id: str) -> str:
        return f"timeoff:{timeoff_id}"

    @staticmethod
    def department_id(department_id: str) -> str:
        return f"department:{department_id}"

    @staticmethod
    def user_id(user_id: str) -> str:
        return f"user:{user_id}"

    @staticmethod
    def organization_id(org_id: str) -> str:
        return f"organization:{org_id}"


# Base message structure
class WebSocketMessage(BaseModel):
    """Base WebSocket message"""

    type: str
    payload: Dict[str, Any]
    timestamp: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
    id: str
    user_id: Optional[str] = None
    organization_id: Optional[str] = None


# Connection Events
class ConnectionEstablishedPayload(BaseModel):
    connection_id: str
    user_id: str
    server_time: str


class ConnectionAuthenticatedPayload(BaseModel):
    user_id: str
    role: str
    organization_id: str


class ConnectionErrorPayload(BaseModel):
    code: str
    message: str
    reconnect: bool


# Subscription Events
class SubscribePayload(BaseModel):
    channels: List[str]


class SubscribedPayload(BaseModel):
    channels: List[str]
    total: int


class UnsubscribePayload(BaseModel):
    channels: List[str]


# Schedule Events
class ScheduleStatus(str, Enum):
    DRAFT = "draft"
    PUBLISHED = "published"
    ARCHIVED = "archived"


class Schedule(BaseModel):
    id: str
    staff_id: str
    start_time: str
    end_time: str
    position: str
    status: ScheduleStatus
    notes: Optional[str] = None
    created_by: str


class ScheduleCreatedPayload(BaseModel):
    schedule: Schedule


class ScheduleUpdatedPayload(BaseModel):
    schedule_id: str
    changes: Dict[str, Dict[str, Any]]
    schedule: Schedule
    updated_by: str


class ScheduleDeletedPayload(BaseModel):
    schedule_id: str
    deleted_by: str
    reason: Optional[str] = None


class SchedulePublishedPayload(BaseModel):
    schedule_id: str
    staff_id: str
    published_by: str
    notification_sent: bool


# Time Off Events
class TimeOffType(str, Enum):
    VACATION = "vacation"
    SICK = "sick"
    PERSONAL = "personal"
    UNPAID = "unpaid"
    BEREAVEMENT = "bereavement"
    JURY_DUTY = "jury_duty"


class TimeOffStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    DENIED = "denied"
    CANCELLED = "cancelled"


class TimeOff(BaseModel):
    id: str
    staff_id: str
    type: TimeOffType
    start_date: str
    end_date: str
    total_days: float
    status: TimeOffStatus
    reason: Optional[str] = None


class TimeOffCreatedPayload(BaseModel):
    time_off: TimeOff


class TimeOffApprovedPayload(BaseModel):
    time_off_id: str
    staff_id: str
    approved_by: str
    approver_name: str
    notes: Optional[str] = None
    time_off: TimeOff


class TimeOffDeniedPayload(BaseModel):
    time_off_id: str
    staff_id: str
    denied_by: str
    denier_name: str
    reason: str
    time_off: TimeOff


class TimeOffCancelledPayload(BaseModel):
    time_off_id: str
    staff_id: str
    cancelled_by: str
    reason: Optional[str] = None


# Staff Events
class StaffStatus(str, Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    ON_LEAVE = "on_leave"
    TERMINATED = "terminated"


class Staff(BaseModel):
    id: str
    first_name: str
    last_name: str
    department_id: str
    position: str
    status: StaffStatus


class StaffCreatedPayload(BaseModel):
    staff: Staff


class StaffUpdatedPayload(BaseModel):
    staff_id: str
    changes: Dict[str, Dict[str, Any]]
    staff: Staff


class StaffStatusChangedPayload(BaseModel):
    staff_id: str
    old_status: str
    new_status: str
    reason: Optional[str] = None
    effective_date: Optional[str] = None


# Notification Events
class NotificationType(str, Enum):
    INFO = "info"
    SUCCESS = "success"
    WARNING = "warning"
    ERROR = "error"
    SCHEDULE = "schedule"
    TIMEOFF = "timeoff"
    ANNOUNCEMENT = "announcement"


class NotificationPriority(str, Enum):
    LOW = "low"
    NORMAL = "normal"
    HIGH = "high"
    URGENT = "urgent"


class Notification(BaseModel):
    id: str
    title: str
    message: str
    type: NotificationType
    priority: NotificationPriority
    action_url: Optional[str] = None
    read: bool = False
    expires_at: Optional[str] = None


class NotificationNewPayload(BaseModel):
    notification: Notification


class NotificationReadPayload(BaseModel):
    notification_id: str


# Presence Events
class PresenceStatus(str, Enum):
    ONLINE = "online"
    AWAY = "away"
    BUSY = "busy"
    OFFLINE = "offline"


class PresenceUpdatePayload(BaseModel):
    status: PresenceStatus
    activity: Optional[str] = None


class PresenceChangedPayload(BaseModel):
    user_id: str
    user_name: str
    status: PresenceStatus
    last_seen: str


# Messaging Events
class MessageSendPayload(BaseModel):
    recipient_id: str
    message: str
    attachments: Optional[List[str]] = None


class MessageReceivedPayload(BaseModel):
    message_id: str
    sender_id: str
    sender_name: str
    message: str
    timestamp: str
    read: bool = False


# System Events
class SystemSeverity(str, Enum):
    INFO = "info"
    WARNING = "warning"
    CRITICAL = "critical"


class SystemAnnouncementPayload(BaseModel):
    title: str
    message: str
    severity: SystemSeverity
    expires_at: Optional[str] = None


class SystemMaintenancePayload(BaseModel):
    starts_at: str
    duration: str
    reason: str
    disconnect_in: int


# Error Events
class ErrorPayload(BaseModel):
    code: str
    message: str
    details: Optional[Dict[str, Any]] = None


# Helper function to create WebSocket message
def create_ws_message(
    event_type: WSEventType,
    payload: BaseModel,
    message_id: str,
    user_id: Optional[str] = None,
    organization_id: Optional[str] = None,
) -> Dict[str, Any]:
    """Create a WebSocket message with proper structure"""
    return {
        "type": event_type.value,
        "payload": payload.dict(),
        "timestamp": datetime.utcnow().isoformat(),
        "id": message_id,
        "userId": user_id,
        "organizationId": organization_id,
    }
