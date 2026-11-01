import React, { useEffect, useState } from "react";
import { UserProfile } from "./types/auth";
import { AuthService } from "./services/AuthService";
import { LoginPage } from "./pages/LoginPage";
import { JudgePage } from "./pages/JudgePage";
import { PromptsPage } from "./pages/PromptsPage";
import { ProfilePage } from "./pages/ProfilePage";
import { Navbar } from "./components/Navbar";
import { Footer } from "./components/Footer";

export const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isInitializing, setIsInitializing] = useState<boolean>(true);
  const [currentTab, setCurrentTab] = useState<"judge" | "prompts" | "profile">("judge");

  useEffect(() => {
    const initSession = async () => {
      const token = AuthService.getToken();
      const cached = AuthService.getCachedProfile();

      if (token && cached) {
        setUserProfile(cached);
        setIsAuthenticated(true);
        // refresh in background
        AuthService.fetchProfile()
          .then((fresh) => setUserProfile(fresh))
          .catch(() => {
            // keep cached if offline
          });
      } else if (token) {
        try {
          const profile = await AuthService.fetchProfile();
          setUserProfile(profile);
          setIsAuthenticated(true);
        } catch {
          AuthService.clearSession();
          setIsAuthenticated(false);
        }
      }
      setIsInitializing(false);
    };

    initSession();
  }, []);

  const handleLoginSuccess = (profile: UserProfile) => {
    setUserProfile(profile);
    setIsAuthenticated(true);
  };

  const handleLogout = async () => {
    await AuthService.logout();
    setUserProfile(null);
    setIsAuthenticated(false);
    setCurrentTab("judge");
  };

  if (isInitializing) {
    return (
      <div className="min-vh-100 d-flex justify-content-center align-items-center bg-light">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status" style={{ width: "3rem", height: "3rem" }}></div>
          <p className="mt-3 text-muted small fw-semibold">Inicializando ambiente CodeJudge...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-vh-100 d-flex flex-column bg-light">
      <Navbar
        currentTab={currentTab}
        onTabChange={(tab) => setCurrentTab(tab)}
        user={userProfile}
        onLogout={handleLogout}
      />

      <main className="flex-grow-1">
        {currentTab === "judge" && <JudgePage user={userProfile} />}
        {currentTab === "prompts" && <PromptsPage />}
        {currentTab === "profile" && <ProfilePage user={userProfile} onLogout={handleLogout} />}
      </main>

      <Footer />
    </div>
  );
};
export default App;
