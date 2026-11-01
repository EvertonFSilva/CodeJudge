import React, { useEffect, useState } from "react";
import { UserProfile } from "../types/auth";
import { CodeJudgeService } from "../services/CodeJudgeService";

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

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark sticky-top shadow-sm">
      <div className="container-fluid px-4">
        <a
          className="navbar-brand d-flex align-items-center fw-bold fs-4 text-white"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            onTabChange("judge");
          }}
        >
          <i className="bi bi-terminal-split text-primary me-2 fs-3"></i>
          <span>CodeJudge</span>
        </a>

        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarContent"
          aria-controls="navbarContent"
          aria-expanded="false"
          aria-label="Alternar navegação"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className="collapse navbar-collapse" id="navbarContent">
          <ul className="navbar-nav me-auto mb-2 mb-lg-0">
            <li className="nav-item">
              <button
                className={`nav-link btn btn-link text-decoration-none px-3 ${currentTab === "judge" ? "active fw-bold text-white border-bottom border-primary border-2" : "text-light"}`}
                onClick={() => onTabChange("judge")}
              >
                <i className="bi bi-play-circle me-1"></i> Juiz Online
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link btn btn-link text-decoration-none px-3 ${currentTab === "prompts" ? "active fw-bold text-white border-bottom border-primary border-2" : "text-light"}`}
                onClick={() => onTabChange("prompts")}
              >
                <i className="bi bi-journal-code me-1"></i> Catálogo de Prompts
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link btn btn-link text-decoration-none px-3 ${currentTab === "profile" ? "active fw-bold text-white border-bottom border-primary border-2" : "text-light"}`}
                onClick={() => onTabChange("profile")}
              >
                <i className="bi bi-person-circle me-1"></i> Meu Perfil
              </button>
            </li>
          </ul>

          <div className="d-flex align-items-center gap-3">
            {isBackendOnline !== null && (
              <span
                className={`badge d-flex align-items-center gap-1 ${isBackendOnline ? "bg-success" : "bg-danger"}`}
                title={isBackendOnline ? "Serviço CodeJudgeApp operacional" : "Serviço CodeJudgeApp indisponível"}
              >
                <i className={`bi bi-${isBackendOnline ? "check-circle" : "exclamation-circle"}`}></i>
                {isBackendOnline ? "API Online" : "API Offline"}
              </span>
            )}

            {user && (
              <div className="d-flex align-items-center gap-2 text-white">
                <span className="small text-white-50 d-none d-md-inline">Conectado como:</span>
                <span className="fw-semibold small">{user.name.split(" ")[0]}</span>
              </div>
            )}

            <button
              className="btn btn-outline-danger btn-sm d-flex align-items-center gap-1"
              onClick={onLogout}
              title="Encerrar sessão"
            >
              <i className="bi bi-box-arrow-right"></i>
              <span>Sair</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};
