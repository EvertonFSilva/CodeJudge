import React, { useEffect, useState } from "react";
import { UserProfile } from "../types/auth";
import { CodeJudgeService } from "../services/CodeJudgeService";
import { CodeJudgeLogo } from "./CodeJudgeLogo";

interface NavbarProps {
  currentTab: "judge" | "prompts" | "profile";
  onTabChange: (tab: "judge" | "prompts" | "profile") => void;
  user: UserProfile | null;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onTabChange,
  user,
  onLogout
}) => {
  const [isBackendOnline, setIsBackendOnline] = useState<boolean | null>(null);

  useEffect(() => {
    let isMounted = true;
    const checkBackend = async () => {
      try {
        await CodeJudgeService.checkHealth();
        if (isMounted) setIsBackendOnline(true);
      } catch {
        if (isMounted) setIsBackendOnline(false);
      }
    };

    checkBackend();
    const interval = setInterval(checkBackend, 15000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const userInitial = user?.name ? user.name.charAt(0).toUpperCase() : "U";
  const userShortName = user?.name ? user.name.split(" ")[0] : "Usuário";

  return (
    <header className="app-header sticky-top">
      <div className="container-fluid px-3 d-flex flex-wrap align-items-center justify-content-between gap-3">
        {/* Brand */}
        <div className="d-flex align-items-center gap-4">
          <div className="brand-wrapper" onClick={() => onTabChange("judge")}>
            <CodeJudgeLogo size={28} />
            <div className="d-flex align-items-center">
              <span className="brand-title">CodeJudge</span>
              <span className="brand-subtitle">IFF</span>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="d-none d-md-flex align-items-center gap-2">
            <button
              type="button"
              className={`nav-tab-btn ${currentTab === "judge" ? "active" : ""}`}
              onClick={() => onTabChange("judge")}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="5 3 19 12 5 21 5 3"></polygon>
              </svg>
              <span>Processamento</span>
            </button>

            <button
              type="button"
              className={`nav-tab-btn ${currentTab === "prompts" ? "active" : ""}`}
              onClick={() => onTabChange("prompts")}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
              </svg>
              <span>Prompts</span>
            </button>

            <button
              type="button"
              className={`nav-tab-btn ${currentTab === "profile" ? "active" : ""}`}
              onClick={() => onTabChange("profile")}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
              <span>Meu Perfil</span>
            </button>
          </nav>
        </div>

        {/* Right side controls */}
        <div className="d-flex align-items-center gap-3">
          {/* Mobile navigation selector */}
          <div className="d-md-none">
            <select
              className="form-select form-select-sm dark-input"
              value={currentTab}
              onChange={(e) => onTabChange(e.target.value as "judge" | "prompts" | "profile")}
            >
              <option value="judge">Processamento</option>
              <option value="prompts">Prompts</option>
              <option value="profile">Meu Perfil</option>
            </select>
          </div>

          {/* Backend Status indicator */}
          <div className="api-status-chip" title="Status da API de processamento do CodeJudgeApp">
            <span
              className={`status-dot ${isBackendOnline === true ? "online" : isBackendOnline === false ? "offline" : ""}`}
            ></span>
            <span>{isBackendOnline === true ? "API Online" : isBackendOnline === false ? "API Offline" : "Conectando..."}</span>
          </div>

          {/* User Chip */}
          {user && (
            <div className="user-chip d-none d-sm-flex" title={`Conectado como ${user.name}`}>
              <div className="user-avatar-circle">{userInitial}</div>
              <span className="fw-semibold">{userShortName}</span>
            </div>
          )}

          {/* Logout */}
          <button
            type="button"
            className="btn btn-outline-danger btn-sm d-flex align-items-center gap-1 py-1 px-2"
            onClick={onLogout}
            title="Encerrar sessão no Moodle IFF"
          >
            <i className="bi bi-box-arrow-right"></i>
            <span className="d-none d-sm-inline">Sair</span>
          </button>
        </div>
      </div>
    </header>
  );
};
