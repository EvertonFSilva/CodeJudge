import React, { useEffect, useState, useRef } from "react";
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
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState<boolean>(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  const profileDropdownRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        profileDropdownRef.current &&
        !profileDropdownRef.current.contains(event.target as Node)
      ) {
        setIsProfileDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const userInitial = user?.name ? user.name.charAt(0).toUpperCase() : "U";
  const userShortName = user?.name ? user.name.split(" ")[0] : "Usuário";

  return (
    <header className="app-header sticky-top">
      <div className="container-fluid px-2 px-md-3 d-flex align-items-center justify-content-between gap-2 gap-md-3">
        <div className="d-flex align-items-center gap-3">
          <div className="brand-wrapper" onClick={() => onTabChange("judge")}>
            <CodeJudgeLogo size={32} />
            <div className="d-flex align-items-center">
              <span className="brand-title">CodeJudge</span>
              <span className="brand-subtitle">IFF</span>
            </div>
          </div>

          <div className="header-divider d-none d-md-block"></div>

          <nav className="d-none d-md-flex align-items-center nav-segments-container">
            <button
              type="button"
              className={`nav-tab-btn ${currentTab === "judge" ? "active" : ""}`}
              onClick={() => onTabChange("judge")}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="5 3 19 12 5 21 5 3"></polygon>
              </svg>
              <span>Processamento</span>
            </button>

            <button
              type="button"
              className={`nav-tab-btn ${currentTab === "prompts" ? "active" : ""}`}
              onClick={() => onTabChange("prompts")}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
              </svg>
              <span>Prompts</span>
            </button>
          </nav>
        </div>

        <div className="d-flex align-items-center gap-2 gap-md-3">
          <div
            className="api-status-chip d-none d-sm-flex"
            title={
              isBackendOnline === true
                ? "Conexão ativa com o serviço CodeJudgeApp"
                : isBackendOnline === false
                ? "Servidor offline ou inacessível na porta 8000"
                : "Verificando status de conectividade..."
            }
          >
            <span
              className={`status-dot ${
                isBackendOnline === true
                  ? "online"
                  : isBackendOnline === false
                  ? "offline"
                  : ""
              }`}
            ></span>
            <span className="small">
              {isBackendOnline === true
                ? "Servidor Conectado"
                : isBackendOnline === false
                ? "Servidor Desconectado"
                : "Conectando ao Servidor..."}
            </span>
          </div>

          {user && (
            <div className="position-relative d-none d-md-block" ref={profileDropdownRef}>
              <button
                type="button"
                className={`user-profile-btn ${isProfileDropdownOpen || currentTab === "profile" ? "active" : ""}`}
                onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                aria-expanded={isProfileDropdownOpen}
                title={`Perfil de ${user.name}`}
              >
                <div className="user-avatar-circle">{userInitial}</div>
                <div className="d-flex flex-column text-start" style={{ lineHeight: "1.15" }}>
                  <span className="fw-semibold text-light">{userShortName}</span>
                  <span className="text-secondary" style={{ fontSize: "10px" }}>Moodle IFF</span>
                </div>
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  className={`user-chevron ms-1 ${isProfileDropdownOpen ? "open" : ""}`}
                >
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </button>

              {isProfileDropdownOpen && (
                <div className="profile-dropdown-menu">
                  <div className="profile-menu-header">
                    <div className="fw-semibold text-white small text-truncate">{user.name}</div>
                    <div className="text-secondary text-truncate" style={{ fontSize: "11px" }}>
                      {user.username ? `Matrícula: ${user.username}` : user.email || "Moodle IFF"}
                    </div>
                  </div>

                  <button
                    type="button"
                    className="profile-menu-item"
                    onClick={() => {
                      onTabChange("profile");
                      setIsProfileDropdownOpen(false);
                    }}
                  >
                    <i className="bi bi-person-circle fs-6 text-success"></i>
                    <span>Meu Perfil</span>
                  </button>

                  <div className="dropdown-divider my-1" style={{ borderColor: "#21262d" }}></div>

                  <button
                    type="button"
                    className="profile-menu-item logout-item"
                    onClick={() => {
                      setIsProfileDropdownOpen(false);
                      onLogout();
                    }}
                  >
                    <i className="bi bi-box-arrow-right fs-6"></i>
                    <span>Sair</span>
                  </button>
                </div>
              )}
            </div>
          )}

          <button
            type="button"
            className="navbar-toggler-btn d-md-none"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Abrir menu de navegação"
          >
            <i className={`bi ${isMobileMenuOpen ? "bi-x-lg" : "bi-list"} fs-5`}></i>
          </button>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div className="mobile-nav-collapse d-md-none px-3 py-3">
          <div className="d-flex flex-column gap-1 mb-3">
            <button
              type="button"
              className={`mobile-nav-link ${currentTab === "judge" ? "active" : ""}`}
              onClick={() => {
                onTabChange("judge");
                setIsMobileMenuOpen(false);
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="5 3 19 12 5 21 5 3"></polygon>
              </svg>
              <span>Processamento</span>
            </button>

            <button
              type="button"
              className={`mobile-nav-link ${currentTab === "prompts" ? "active" : ""}`}
              onClick={() => {
                onTabChange("prompts");
                setIsMobileMenuOpen(false);
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
              </svg>
              <span>Prompts</span>
            </button>
          </div>

          {user && (
            <div className="pt-2 border-top" style={{ borderColor: "#21262d" }}>
              <div className="d-flex align-items-center gap-2 px-2 py-2 mb-2">
                <div className="user-avatar-circle">{userInitial}</div>
                <div className="d-flex flex-column text-truncate">
                  <span className="fw-semibold text-white small text-truncate">{user.name}</span>
                  <span className="text-secondary" style={{ fontSize: "11px" }}>
                    {user.username ? `Matrícula: ${user.username}` : user.email || "Moodle IFF"}
                  </span>
                </div>
              </div>

              <div className="d-flex flex-column gap-1">
                <button
                  type="button"
                  className={`mobile-nav-link ${currentTab === "profile" ? "active" : ""}`}
                  onClick={() => {
                    onTabChange("profile");
                    setIsMobileMenuOpen(false);
                  }}
                >
                  <i className="bi bi-person-circle fs-6 text-success"></i>
                  <span>Meu Perfil</span>
                </button>

                <button
                  type="button"
                  className="mobile-nav-link logout-link"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    onLogout();
                  }}
                >
                  <i className="bi bi-box-arrow-right fs-6"></i>
                  <span>Sair</span>
                </button>
              </div>
            </div>
          )}

          <div className="pt-2 mt-2 border-top d-flex align-items-center justify-content-between px-2" style={{ borderColor: "#21262d" }}>
            <span className="text-secondary small">Status do Servidor:</span>
            <div className="d-flex align-items-center gap-1.5 small text-secondary">
              <span
                className={`status-dot ${
                  isBackendOnline === true
                    ? "online"
                    : isBackendOnline === false
                    ? "offline"
                    : ""
                }`}
              ></span>
              <span style={{ fontSize: "11.5px" }}>
                {isBackendOnline === true ? "Conectado" : isBackendOnline === false ? "Offline" : "Verificando"}
              </span>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
