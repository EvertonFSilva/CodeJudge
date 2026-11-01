export interface UserProfile {
  name: string;
  email: string;
  username?: string;
  city: string;
  country: string;
  campus: string;
  firstAccess: string;
  lastAccess: string;
  profileUrl: string;
  courses: string[];
}

export interface LoginResponse {
  token: string;
  username: string;
  profile: UserProfile;
}

export interface SessionState {
  token: string | null;
  profile: UserProfile | null;
  isAuthenticated: boolean;
}
