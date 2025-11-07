/**
 * MCP (Multi-Client Protocol) Session Management
 * 
 * Enables real-time collaborative sessions with multiple participants
 * using WebSocket for bi-directional communication.
 */

export interface MCPSession {
  sessionId: string;
  tenantId: string;
  participants: Participant[];
  state: Record<string, any>;
  metadata: {
    createdAt: Date;
    expiresAt: Date;
    maxParticipants: number;
  };
}

export interface Participant {
  userId: string;
  name: string;
  role: 'host' | 'participant' | 'observer';
  joinedAt: Date;
  cursor?: {
    x: number;
    y: number;
  };
}

export interface MCPMessage {
  type: 'join' | 'leave' | 'state_update' | 'cursor_move' | 'action' | 'ping' | 'pong';
  senderId: string;
  payload?: any;
  timestamp: Date;
}

export class MCPSessionManager {
  private ws: WebSocket | null = null;
  private session: MCPSession | null = null;
  private reconnectAttempts = 0;
  private readonly MAX_RECONNECT_ATTEMPTS = 5;
  private readonly WS_ENDPOINT: string;
  private messageHandlers: Map<string, ((message: MCPMessage) => void)[]> = new Map();
  private heartbeatInterval: NodeJS.Timeout | null = null;

  constructor(endpoint: string = 'wss://api.akaind.ca/mcp') {
    this.WS_ENDPOINT = endpoint;
  }

  /**
   * Create a new MCP session
   */
  async createSession(tenantId: string, userId: string): Promise<MCPSession> {
    const response = await fetch('/api/mcp/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tenantId,
        hostId: userId,
        maxParticipants: 50,
        expiresIn: 3600 // 1 hour
      })
    });

    if (!response.ok) {
      throw new Error('Failed to create session');
    }

    const session = await response.json();
    this.session = session;
    
    // Connect to WebSocket
    await this.connect(session.sessionId, userId);

    return session;
  }

  /**
   * Join an existing MCP session
   */
  async joinSession(sessionId: string, userId: string, name: string): Promise<MCPSession> {
    // Fetch session details
    const response = await fetch(`/api/mcp/sessions/${sessionId}`);
    
    if (!response.ok) {
      throw new Error('Session not found');
    }

    this.session = await response.json();

    // Connect to WebSocket
    await this.connect(sessionId, userId);

    // Send join message
    this.send({
      type: 'join',
      senderId: userId,
      payload: { name },
      timestamp: new Date()
    });

    if (!this.session) {
      throw new Error('Session not initialized');
    }

    return this.session;
  }

  /**
   * Leave the current session
   */
  async leaveSession(): Promise<void> {
    if (!this.session || !this.ws) {
      return;
    }

    // Send leave message
    this.send({
      type: 'leave',
      senderId: this.getCurrentUserId(),
      timestamp: new Date()
    });

    // Close WebSocket connection
    this.disconnect();

    this.session = null;
  }

  /**
   * Update session state
   */
  async updateState(key: string, value: any): Promise<void> {
    if (!this.session) {
      throw new Error('Not in a session');
    }

    // Update local state
    this.session.state[key] = value;

    // Broadcast update to other participants
    this.send({
      type: 'state_update',
      senderId: this.getCurrentUserId(),
      payload: { key, value },
      timestamp: new Date()
    });
  }

  /**
   * Get current session state
   */
  getState(): Record<string, any> {
    return this.session?.state || {};
  }

  /**
   * Update cursor position (for collaborative editing)
   */
  updateCursor(x: number, y: number): void {
    if (!this.session) return;

    this.send({
      type: 'cursor_move',
      senderId: this.getCurrentUserId(),
      payload: { x, y },
      timestamp: new Date()
    });
  }

  /**
   * Send custom action to participants
   */
  sendAction(action: string, data?: any): void {
    if (!this.session) return;

    this.send({
      type: 'action',
      senderId: this.getCurrentUserId(),
      payload: { action, data },
      timestamp: new Date()
    });
  }

  /**
   * Register message handler
   */
  on(messageType: string, handler: (message: MCPMessage) => void): void {
    if (!this.messageHandlers.has(messageType)) {
      this.messageHandlers.set(messageType, []);
    }
    this.messageHandlers.get(messageType)!.push(handler);
  }

  /**
   * Unregister message handler
   */
  off(messageType: string, handler: (message: MCPMessage) => void): void {
    const handlers = this.messageHandlers.get(messageType);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  // Private methods

  private async connect(sessionId: string, userId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const wsUrl = `${this.WS_ENDPOINT}?sessionId=${sessionId}&userId=${userId}`;
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('MCP WebSocket connected');
        this.reconnectAttempts = 0;
        this.startHeartbeat();
        resolve();
      };

      this.ws.onmessage = (event) => {
        try {
          const message: MCPMessage = JSON.parse(event.data);
          this.handleMessage(message);
        } catch (error) {
          console.error('Failed to parse MCP message:', error);
        }
      };

      this.ws.onerror = (error) => {
        console.error('MCP WebSocket error:', error);
        reject(error);
      };

      this.ws.onclose = () => {
        console.log('MCP WebSocket closed');
        this.stopHeartbeat();
        this.attemptReconnect(sessionId, userId);
      };
    });
  }

  private disconnect(): void {
    this.stopHeartbeat();
    
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  private send(message: MCPMessage): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn('Cannot send message: WebSocket not connected');
      return;
    }

    this.ws.send(JSON.stringify(message));
  }

  private handleMessage(message: MCPMessage): void {
    // Update session state for state_update messages
    if (message.type === 'state_update' && this.session) {
      const { key, value } = message.payload;
      this.session.state[key] = value;
    }

    // Update participant cursor
    if (message.type === 'cursor_move' && this.session) {
      const participant = this.session.participants.find(
        p => p.userId === message.senderId
      );
      if (participant) {
        participant.cursor = message.payload;
      }
    }

    // Add/remove participants
    if (message.type === 'join' && this.session) {
      const { name } = message.payload;
      this.session.participants.push({
        userId: message.senderId,
        name,
        role: 'participant',
        joinedAt: new Date(message.timestamp)
      });
    }

    if (message.type === 'leave' && this.session) {
      this.session.participants = this.session.participants.filter(
        p => p.userId !== message.senderId
      );
    }

    // Handle pong
    if (message.type === 'pong') {
      // Server is alive
      return;
    }

    // Call registered handlers
    const handlers = this.messageHandlers.get(message.type) || [];
    handlers.forEach(handler => {
      try {
        handler(message);
      } catch (error) {
        console.error('Error in message handler:', error);
      }
    });
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      this.send({
        type: 'ping',
        senderId: this.getCurrentUserId(),
        timestamp: new Date()
      });
    }, 30000); // 30 seconds
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  private async attemptReconnect(sessionId: string, userId: string): Promise<void> {
    if (this.reconnectAttempts >= this.MAX_RECONNECT_ATTEMPTS) {
      console.error('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);

    console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`);

    setTimeout(async () => {
      try {
        await this.connect(sessionId, userId);
        console.log('Reconnected successfully');
      } catch (error) {
        console.error('Reconnection failed:', error);
      }
    }, delay);
  }

  private getCurrentUserId(): string {
    // In production, this would come from auth context
    return 'current-user-id';
  }
}

/**
 * Example usage:
 * 
 * ```typescript
 * const mcpManager = new MCPSessionManager();
 * 
 * // Create a session
 * const session = await mcpManager.createSession('tenant-123', 'user-456');
 * 
 * // Or join an existing session
 * await mcpManager.joinSession('session-789', 'user-456', 'John Doe');
 * 
 * // Listen for state updates
 * mcpManager.on('state_update', (message) => {
 *   console.log('State updated:', message.payload);
 * });
 * 
 * // Update shared state
 * await mcpManager.updateState('cursor', { x: 100, y: 200 });
 * 
 * // Send custom action
 * mcpManager.sendAction('draw_circle', { x: 150, y: 250, radius: 50 });
 * 
 * // Leave session when done
 * await mcpManager.leaveSession();
 * ```
 */

export default MCPSessionManager;
