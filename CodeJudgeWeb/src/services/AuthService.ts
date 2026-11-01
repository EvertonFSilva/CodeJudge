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

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || "Falha na autenticação via Moodle.");
    }

    const data: LoginResponse = await response.json();
    localStorage.setItem(TOKEN_KEY, data.token);
    localStorage.setItem(PROFILE_KEY, JSON.stringify(data.profile));
    return data;
  }

  static async fetchProfile(): Promise<UserProfile> {
    const token = this.getToken();
    if (!token) {
      throw new Error("Sessão não encontrada.");
    }

    const response = await fetch("/auth/profile", {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!response.ok) {
      this.clearSession();
      throw new Error("Sessão expirada ou inválida.");
    }

    const profile: UserProfile = await response.json();
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
