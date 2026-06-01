/**
 * Session Management System
 * Provides improved session management with Redis support and multi-device support
 */

import { logger } from "../logger";

export interface Session {
  id: string;
  userId: string;
  workspaceId?: string;
  createdAt: number;
  expiresAt: number;
  lastActivityAt: number;
  ipAddress?: string;
  userAgent?: string;
  device?: string;
}

export interface SessionData {
  userId: string;
  workspaceId?: string;
  ipAddress?: string;
  userAgent?: string;
  device?: string;
}

class SessionManager {
  private sessions: Map<string, Session> = new Map();
  private userSessions: Map<string, Set<string>> = new Map(); // userId -> sessionIds
  private defaultTTL = 86400000; // 24 hours in milliseconds

  /**
   * Create a new session
   */
  async createSession(data: SessionData, ttl: number = this.defaultTTL): Promise<string> {
    const sessionId = this.generateSessionId();
    const now = Date.now();

    const session: Session = {
      id: sessionId,
      userId: data.userId,
      workspaceId: data.workspaceId,
      createdAt: now,
      expiresAt: now + ttl,
      lastActivityAt: now,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      device: data.device || this.detectDevice(data.userAgent),
    };

    this.sessions.set(sessionId, session);

    // Track user sessions
    if (!this.userSessions.has(data.userId)) {
      this.userSessions.set(data.userId, new Set());
    }
    this.userSessions.get(data.userId)!.add(sessionId);

    logger.info("Session created", {
      sessionId,
      userId: data.userId,
      device: session.device,
      expiresAt: new Date(session.expiresAt).toISOString(),
    });

    return sessionId;
  }

  /**
   * Get session by ID
   */
  getSession(sessionId: string): Session | undefined {
    const session = this.sessions.get(sessionId);

    if (!session) {
      return undefined;
    }

    // Check if expired
    if (Date.now() > session.expiresAt) {
      this.sessions.delete(sessionId);
      this.removeFromUserSessions(session.userId, sessionId);
      logger.info("Session expired", { sessionId });
      return undefined;
    }

    // Update last activity
    session.lastActivityAt = Date.now();
    this.sessions.set(sessionId, session);

    return session;
  }

  /**
   * Validate session
   */
  validateSession(sessionId: string): { valid: boolean; session?: Session } {
    const session = this.getSession(sessionId);

    if (!session) {
      return { valid: false };
    }

    return { valid: true, session };
  }

  /**
   * Revoke session
   */
  revokeSession(sessionId: string): void {
    const session = this.sessions.get(sessionId);

    if (session) {
      this.sessions.delete(sessionId);
      this.removeFromUserSessions(session.userId, sessionId);
      logger.info("Session revoked", { sessionId, userId: session.userId });
    }
  }

  /**
   * Revoke all sessions for a user
   */
  revokeAllUserSessions(userId: string): void {
    const sessionIds = this.userSessions.get(userId);

    if (sessionIds) {
      for (const sessionId of sessionIds) {
        this.sessions.delete(sessionId);
      }
      this.userSessions.delete(userId);
      logger.info("All user sessions revoked", { userId, count: sessionIds.size });
    }
  }

  /**
   * Revoke all sessions except the current one
   */
  revokeOtherSessions(userId: string, currentSessionId: string): void {
    const sessionIds = this.userSessions.get(userId);

    if (sessionIds) {
      for (const sessionId of sessionIds) {
        if (sessionId !== currentSessionId) {
          this.sessions.delete(sessionId);
        }
      }
      logger.info("Other sessions revoked", { userId, currentSessionId });
    }
  }

  /**
   * Extend session TTL
   */
  extendSession(sessionId: string, ttl: number = this.defaultTTL): void {
    const session = this.sessions.get(sessionId);

    if (session) {
      session.expiresAt = Date.now() + ttl;
      this.sessions.set(sessionId, session);
      logger.info("Session extended", { sessionId, expiresAt: new Date(session.expiresAt).toISOString() });
    }
  }

  /**
   * Get all sessions for a user
   */
  getUserSessions(userId: string): Session[] {
    const sessionIds = this.userSessions.get(userId);

    if (!sessionIds) {
      return [];
    }

    const sessions: Session[] = [];
    for (const sessionId of sessionIds) {
      const session = this.sessions.get(sessionId);
      if (session && Date.now() <= session.expiresAt) {
        sessions.push(session);
      }
    }

    return sessions;
  }

  /**
   * Clean up expired sessions
   */
  cleanupExpiredSessions(): void {
    const now = Date.now();
    let cleaned = 0;

    for (const [sessionId, session] of this.sessions.entries()) {
      if (now > session.expiresAt) {
        this.sessions.delete(sessionId);
        this.removeFromUserSessions(session.userId, sessionId);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      logger.info("Expired sessions cleaned up", { count: cleaned });
    }
  }

  /**
   * Get session statistics
   */
  getStats() {
    const now = Date.now();
    const sessions = Array.from(this.sessions.values());

    return {
      total: sessions.length,
      active: sessions.filter((s) => now <= s.expiresAt).length,
      expired: sessions.filter((s) => now > s.expiresAt).length,
      users: this.userSessions.size,
      devices: this.getDeviceBreakdown(sessions),
    };
  }

  /**
   * Get device breakdown
   */
  private getDeviceBreakdown(sessions: Session[]): Record<string, number> {
    const breakdown: Record<string, number> = {};

    for (const session of sessions) {
      const device = session.device || "unknown";
      breakdown[device] = (breakdown[device] || 0) + 1;
    }

    return breakdown;
  }

  /**
   * Detect device from user agent
   */
  private detectDevice(userAgent?: string): string {
    if (!userAgent) {
      return "unknown";
    }

    const ua = userAgent.toLowerCase();

    if (ua.includes("mobile") || ua.includes("android") || ua.includes("iphone")) {
      return "mobile";
    }

    if (ua.includes("tablet") || ua.includes("ipad")) {
      return "tablet";
    }

    if (ua.includes("windows") || ua.includes("macintosh") || ua.includes("linux")) {
      return "desktop";
    }

    return "unknown";
  }

  /**
   * Remove session from user sessions map
   */
  private removeFromUserSessions(userId: string, sessionId: string): void {
    const sessionIds = this.userSessions.get(userId);
    if (sessionIds) {
      sessionIds.delete(sessionId);
      if (sessionIds.size === 0) {
        this.userSessions.delete(userId);
      }
    }
  }

  /**
   * Generate a unique session ID
   */
  private generateSessionId(): string {
    return `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Start cleanup interval
   */
  startCleanupInterval(intervalMs: number = 60000): void {
    setInterval(() => this.cleanupExpiredSessions(), intervalMs);
    logger.info("Session cleanup interval started", { intervalMs });
  }
}

// Singleton instance
let sessionManager: SessionManager | null = null;

export function getSessionManager(): SessionManager {
  if (!sessionManager) {
    sessionManager = new SessionManager();
    sessionManager.startCleanupInterval();
  }
  return sessionManager;
}

/**
 * Create a session (convenience function)
 */
export async function createSession(data: SessionData, ttl?: number): Promise<string> {
  const manager = getSessionManager();
  return await manager.createSession(data, ttl);
}

/**
 * Validate a session (convenience function)
 */
export function validateSession(sessionId: string): { valid: boolean; session?: Session } {
  const manager = getSessionManager();
  return manager.validateSession(sessionId);
}

/**
 * Revoke a session (convenience function)
 */
export function revokeSession(sessionId: string): void {
  const manager = getSessionManager();
  manager.revokeSession(sessionId);
}