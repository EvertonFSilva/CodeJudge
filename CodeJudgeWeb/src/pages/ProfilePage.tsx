import React from "react";
import { UserProfile } from "../types/auth";
import { AuthService } from "../services/AuthService";

interface ProfilePageProps {
  user: UserProfile | null;
  onLogout: () => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ user, onLogout }) => {
  const token = AuthService.getToken();

  if (!user) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border text-success" role="status"></div>
        <p className="mt-2 text-secondary">Carregando dados do usuário...</p>
      </div>
    );
  }

  const userInitial = user.name ? user.name.charAt(0).toUpperCase() : "U";

  return (
    <div className="container py-4 fade-in">
      <div
        className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center mb-4 pb-3 gap-3"
        style={{ borderBottom: "1px solid var(--border-color)" }}
      >
        <div>
          <h4 className="fw-bold text-white mb-1 d-flex align-items-center gap-2">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
            Perfil do Estudante & Dados Institucionais
          </h4>
          <p className="text-secondary small mb-0">
            Sincronizado diretamente do ambiente <strong>Moodle IFF</strong> (Instituto Federal Fluminense).
          </p>
        </div>

        <button
          className="logout-nav-btn m-0"
          onClick={onLogout}
          title="Encerrar sessão no Moodle IFF"
        >
          <i className="bi bi-box-arrow-right fs-6"></i>
          <span>Encerrar Sessão</span>
        </button>
      </div>

      <div className="row g-4">
        <div className="col-lg-4">
          <div className="dark-card text-center p-4">
            <div className="mb-3">
              <div
                className="rounded-circle text-white d-inline-flex justify-content-center align-items-center shadow"
                style={{
                  width: "86px",
                  height: "86px",
                  fontSize: "32px",
                  fontWeight: "bold",
                  background: "linear-gradient(135deg, var(--emerald-primary), var(--emerald-accent))",
                  border: "2px solid var(--emerald-accent)",
                  boxShadow: "0 4px 16px var(--emerald-glow)"
                }}
              >
                {userInitial}
              </div>
            </div>

            <h5 className="fw-bold text-white mb-1">{user.name}</h5>
            <p className="text-secondary small mb-3">{user.email || "E-mail institucional não informado"}</p>

            <div className="lang-badge d-inline-block mb-3">
              {user.campus || "Instituto Federal Fluminense (IFF)"}
            </div>

            <div
              className="pt-3 text-start small"
              style={{ borderTop: "1px solid var(--border-subtle)" }}
            >
              <div className="d-flex justify-content-between align-items-center py-2">
                <span className="text-secondary d-flex align-items-center gap-2">
                  <i className="bi bi-geo-alt text-success"></i>
                  <span>Cidade:</span>
                </span>
                <span className="text-light fw-medium">{user.city || "Não informada"}</span>
              </div>
              <div className="d-flex justify-content-between align-items-center py-2">
                <span className="text-secondary d-flex align-items-center gap-2">
                  <i className="bi bi-globe-americas text-success"></i>
                  <span>País:</span>
                </span>
                <span className="text-light fw-medium">{user.country || "Brasil"}</span>
              </div>
              <div className="d-flex justify-content-between align-items-center py-2">
                <span className="text-secondary d-flex align-items-center gap-2">
                  <i className="bi bi-calendar-check text-success"></i>
                  <span>Primeiro Acesso:</span>
                </span>
                <span className="text-light fw-medium">{user.firstAccess || "N/A"}</span>
              </div>
              <div className="d-flex justify-content-between align-items-center py-2">
                <span className="text-secondary d-flex align-items-center gap-2">
                  <i className="bi bi-clock-history text-success"></i>
                  <span>Último Acesso:</span>
                </span>
                <span className="text-light fw-medium">{user.lastAccess || "N/A"}</span>
              </div>
            </div>

            {user.profileUrl && (
              <a
                href={user.profileUrl}
                target="_blank"
                rel="noreferrer"
                className="btn btn-report-action btn-sm w-100 mt-3 justify-content-center gap-2"
              >
                <i className="bi bi-box-arrow-up-right"></i>
                <span>Acessar Moodle IFF</span>
              </a>
            )}
          </div>

          <div className="dark-card mt-3 p-3">
            <div className="d-flex align-items-center gap-2 mb-2">
              <span className="status-dot online"></span>
              <span className="fw-bold text-light small">Token de Sessão Ativa</span>
            </div>
            <div
              className="p-2 rounded text-secondary font-monospace small text-break"
              style={{ backgroundColor: "var(--bg-input)", border: "1px solid var(--border-subtle)" }}
            >
              {token ? `${token.substring(0, 26)}...` : "Nenhum token ativo"}
            </div>
          </div>
        </div>

        <div className="col-lg-8">
          <div className="dark-card">
            <div className="dark-card-header d-flex justify-content-between align-items-center">
              <div className="d-flex align-items-center gap-2">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2">
                  <path d="M22 10v6M2 10l10-5 10 5-10 5z"></path>
                  <path d="M6 12v5c3 3 9 3 12 0v-5"></path>
                </svg>
                <span className="fw-bold text-white small">
                  Disciplinas e Turmas Matriculadas ({user.courses ? user.courses.length : 0})
                </span>
              </div>
              <span className="badge badge-custom-success small">Moodle IFF</span>
            </div>

            <div className="dark-card-body">
              {user.courses && user.courses.length > 0 ? (
                <div className="d-flex flex-column gap-2">
                  {user.courses.map((course, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded d-flex justify-content-between align-items-center"
                      style={{
                        backgroundColor: "var(--bg-input)",
                        border: "1px solid var(--border-subtle)"
                      }}
                    >
                      <div className="d-flex align-items-center gap-3">
                        <div
                          className="rounded-circle p-2 d-flex align-items-center justify-content-center flex-shrink-0"
                          style={{
                            backgroundColor: "var(--emerald-subtle)",
                            color: "var(--emerald-accent)",
                            width: "38px",
                            height: "38px"
                          }}
                        >
                          <i className="bi bi-journal-bookmark-fill fs-6"></i>
                        </div>
                        <div>
                          <div className="fw-semibold text-white">{course}</div>
                          <span className="text-secondary small">Ambiente Virtual Moodle</span>
                        </div>
                      </div>
                      <span className="badge badge-custom-success px-2 py-1 small">
                        Inscrito
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-secondary">
                  <i className="bi bi-journal-x display-6 mb-2 d-block"></i>
                  <p className="mb-0 small">Nenhuma disciplina pública listada no seu perfil do Moodle IFF.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
