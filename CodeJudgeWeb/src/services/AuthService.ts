import { LoginResponse, UserProfile } from "../types/auth";

const TOKEN_KEY = "codejudge_auth_token";
const PROFILE_KEY = "codejudge_user_profile";

export class AuthService {
  static getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  static getCachedProfile(): UserProfile | null {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as UserProfile;
    } catch {
      return null;
    }
  }

  static isAuthenticated(): boolean {
    return Boolean(this.getToken());
  }

  static async login(username: string, password: string): Promise<LoginResponse> {
    const response = await fetch("/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok || !data.success) {
      throw new Error(data.message || data.error || "Falha na autenticação via Moodle IFF.");
    }

    const token = data.token || data.authToken;
    const profile = data.profile;

    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));

    return {
      token,
      username,
      profile
    };
  }

  static async fetchProfile(): Promise<UserProfile> {
    const token = this.getToken();
    if (!token) {
      throw new Error("Sessão não encontrada.");
    }

    const response = await fetch("/auth/profile", {
      headers: { Authorization: `Bearer ${token}` }
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok || !data.success) {
      this.clearSession();
      throw new Error(data.message || "Sessão expirada ou inválida no Moodle IFF.");
    }

    const profile: UserProfile = data.profile || data;
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
    return profile;
  }

  static async logout(): Promise<void> {
    const token = this.getToken();
    if (token) {
      try {
        await fetch("/auth/logout", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` }
        });
      } catch {
        // silently clear local storage
      }
    }
    this.clearSession();
  }

  static clearSession(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(PROFILE_KEY);
  }
}
