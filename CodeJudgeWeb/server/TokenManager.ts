import crypto from 'crypto';

export interface UserSession {
  username: string;
  profile: Record<string, any>;
  createdAt: number;
}

export class TokenManager {
  private static sessions: Map<string, UserSession> = new Map();

  public static generateToken(): string {
    return crypto.randomBytes(24).toString('hex');
  }

  public static createSession(username: string, profile: Record<string, any>): string {
    const token = this.generateToken();
    this.sessions.set(token, {
      username,
      profile,
      createdAt: Date.now()
    });
    return token;
  }

  public static getSession(token: string): UserSession | undefined {
    return this.sessions.get(token);
  }

  public static removeSession(token: string): boolean {
    return this.sessions.delete(token);
  }

  public static findSessionByUsername(username: string): { token: string; session: UserSession } | undefined {
    for (const [token, session] of this.sessions.entries()) {
      if (session.username === username) {
        return { token, session };
      }
    }
    return undefined;
  }
}
