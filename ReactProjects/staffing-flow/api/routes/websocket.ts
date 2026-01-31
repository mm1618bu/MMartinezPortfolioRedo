/**
 * WebSocket HTTP API Routes
 * REST endpoints for WebSocket server management and statistics
 */

import express, { Request, Response, Router } from 'express';
import { webSocketService } from '../services/websocket.service';
import { logger } from '../utils/logger';
import type { BroadcastRequest, WebSocketMessage } from '../types/websocket';

const router: Router = express.Router();

// ==============================================
// SERVER INFO & STATISTICS
// ==============================================

/**
 * GET /api/ws/stats
 * Get WebSocket server statistics
 */
router.get('/stats', async (_req: Request, res: Response): Promise<void> => {
  try {
    if (!webSocketService.isInitialized()) {
      res.status(503).json({
        error: 'WebSocket server not initialized',
      });
      return;
    }

    const stats = webSocketService.getStats();
    res.status(200).json({
      success: true,
      stats,
    });
  } catch (error) {
    logger.error('Error in GET /ws/stats:', error);
    res.status(500).json({
      error: 'Failed to get WebSocket stats',
      details: (error as Error).message,
    });
  }
});

/**
 * GET /api/ws/connections
 * Get list of active connections
 */
router.get('/connections', async (req: Request, res: Response): Promise<void> => {
  try {
    if (!webSocketService.isInitialized()) {
      res.status(503).json({
        error: 'WebSocket server not initialized',
      });
      return;
    }

    const organizationId = req.query.organization_id as string;
    const connections = webSocketService.getConnections();

    // Filter by organization if specified
    const filteredConnections = organizationId
      ? connections.filter(c => c.organization_id === organizationId)
      : connections;

    res.status(200).json({
      success: true,
      connections: filteredConnections,
      total_count: filteredConnections.length,
    });
  } catch (error) {
    logger.error('Error in GET /ws/connections:', error);
    res.status(500).json({
      error: 'Failed to get connections',
      details: (error as Error).message,
    });
  }
});

/**
 * GET /api/ws/connections/:socketId
 * Get specific connection info
 */
router.get('/connections/:socketId', async (req: Request, res: Response): Promise<void> => {
  try {
    if (!webSocketService.isInitialized()) {
      res.status(503).json({
        error: 'WebSocket server not initialized',
      });
      return;
    }

    const socketId = req.params.socketId as string;
    const connection = webSocketService.getConnection(socketId);

    if (!connection) {
      res.status(404).json({
        error: 'Connection not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      connection,
    });
  } catch (error) {
    logger.error('Error in GET /ws/connections/:socketId:', error);
    res.status(500).json({
      error: 'Failed to get connection',
      details: (error as Error).message,
    });
  }
});

/**
 * GET /api/ws/rooms
 * Get list of active rooms
 */
router.get('/rooms', async (_req: Request, res: Response): Promise<void> => {
  try {
    if (!webSocketService.isInitialized()) {
      res.status(503).json({
        error: 'WebSocket server not initialized',
      });
      return;
    }

    const rooms = webSocketService.getRooms();

    res.status(200).json({
      success: true,
      rooms,
      total_count: rooms.length,
    });
  } catch (error) {
    logger.error('Error in GET /ws/rooms:', error);
    res.status(500).json({
      error: 'Failed to get rooms',
      details: (error as Error).message,
    });
  }
});

// ==============================================
// BROADCAST OPERATIONS
// ==============================================

/**
 * POST /api/ws/broadcast
 * Broadcast a message to connected clients
 */
router.post('/broadcast', async (req: Request, res: Response): Promise<void> => {
  try {
    if (!webSocketService.isInitialized()) {
      res.status(503).json({
        error: 'WebSocket server not initialized',
      });
      return;
    }

    const request: BroadcastRequest = req.body;

    if (!request.event) {
      res.status(400).json({ error: 'event is required' });
      return;
    }
    if (!request.data) {
      res.status(400).json({ error: 'data is required' });
      return;
    }

    const message: WebSocketMessage = {
      message_id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      event: request.event,
      data: request.data,
      timestamp: new Date().toISOString(),
      organization_id: request.target?.organization_id,
      department_id: request.target?.department_id,
      queue_name: request.target?.queue_name,
      priority: request.priority || 'medium',
      requires_ack: request.requires_ack,
    };

    // Broadcast based on target
    if (request.target?.socket_ids && request.target.socket_ids.length > 0) {
      request.target.socket_ids.forEach(socketId => {
        webSocketService.sendToSocket(socketId, message);
      });
    } else {
      webSocketService.broadcastToAll(message);
    }

    // Get recipient count (simplified - would need actual tracking)
    const connections = webSocketService.getConnections();
    let recipientCount = connections.length;
    if (request.target?.organization_id) {
      recipientCount = connections.filter(c => c.organization_id === request.target?.organization_id).length;
    }

    res.status(200).json({
      success: true,
      message_id: message.message_id,
      recipients_count: recipientCount,
      sent_at: message.timestamp,
    });

    logger.info('Message broadcasted via HTTP', {
      message_id: message.message_id,
      event: request.event,
      recipients_count: recipientCount,
    });
  } catch (error) {
    logger.error('Error in POST /ws/broadcast:', error);
    res.status(500).json({
      error: 'Failed to broadcast message',
      details: (error as Error).message,
    });
  }
});

/**
 * POST /api/ws/broadcast/kpi
 * Broadcast KPI update
 */
router.post('/broadcast/kpi', async (req: Request, res: Response): Promise<void> => {
  try {
    if (!webSocketService.isInitialized()) {
      res.status(503).json({
        error: 'WebSocket server not initialized',
      });
      return;
    }

    webSocketService.broadcastKPIUpdate(req.body);

    res.status(200).json({
      success: true,
      message: 'KPI update broadcasted',
    });
  } catch (error) {
    logger.error('Error in POST /ws/broadcast/kpi:', error);
    res.status(500).json({
      error: 'Failed to broadcast KPI update',
      details: (error as Error).message,
    });
  }
});

/**
 * POST /api/ws/broadcast/backlog
 * Broadcast backlog update
 */
router.post('/broadcast/backlog', async (req: Request, res: Response): Promise<void> => {
  try {
    if (!webSocketService.isInitialized()) {
      res.status(503).json({
        error: 'WebSocket server not initialized',
      });
      return;
    }

    webSocketService.broadcastBacklogUpdate(req.body);

    res.status(200).json({
      success: true,
      message: 'Backlog update broadcasted',
    });
  } catch (error) {
    logger.error('Error in POST /ws/broadcast/backlog:', error);
    res.status(500).json({
      error: 'Failed to broadcast backlog update',
      details: (error as Error).message,
    });
  }
});

/**
 * POST /api/ws/broadcast/attendance
 * Broadcast attendance update
 */
router.post('/broadcast/attendance', async (req: Request, res: Response): Promise<void> => {
  try {
    if (!webSocketService.isInitialized()) {
      res.status(503).json({
        error: 'WebSocket server not initialized',
      });
      return;
    }

    webSocketService.broadcastAttendanceUpdate(req.body);

    res.status(200).json({
      success: true,
      message: 'Attendance update broadcasted',
    });
  } catch (error) {
    logger.error('Error in POST /ws/broadcast/attendance:', error);
    res.status(500).json({
      error: 'Failed to broadcast attendance update',
      details: (error as Error).message,
    });
  }
});

/**
 * POST /api/ws/broadcast/alert
 * Broadcast alert
 */
router.post('/broadcast/alert', async (req: Request, res: Response): Promise<void> => {
  try {
    if (!webSocketService.isInitialized()) {
      res.status(503).json({
        error: 'WebSocket server not initialized',
      });
      return;
    }

    webSocketService.broadcastAlert(req.body);

    res.status(200).json({
      success: true,
      message: 'Alert broadcasted',
    });
  } catch (error) {
    logger.error('Error in POST /ws/broadcast/alert:', error);
    res.status(500).json({
      error: 'Failed to broadcast alert',
      details: (error as Error).message,
    });
  }
});

// ==============================================
// HEALTH CHECK
// ==============================================

/**
 * GET /api/ws/health
 * Health check endpoint
 */
router.get('/health', async (_req: Request, res: Response): Promise<void> => {
  const isInitialized = webSocketService.isInitialized();
  
  if (!isInitialized) {
    res.status(503).json({
      status: 'unhealthy',
      service: 'websocket-server',
      initialized: false,
      timestamp: new Date().toISOString(),
    });
    return;
  }

  const stats = webSocketService.getStats();
  
  res.status(200).json({
    status: 'healthy',
    service: 'websocket-server',
    initialized: true,
    active_connections: stats.active_connections,
    uptime_seconds: stats.uptime_seconds,
    timestamp: new Date().toISOString(),
  });
});

export default router;
