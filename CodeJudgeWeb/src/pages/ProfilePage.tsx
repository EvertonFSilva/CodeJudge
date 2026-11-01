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
        <div className="spinner-border text-primary" role="status"></div>
        <p className="mt-2 text-muted">Carregando dados do usuário...</p>
      </div>
    );
  }

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-4 border-bottom pb-3">
        <div>
          <h3 className="fw-bold text-dark mb-1 d-flex align-items-center gap-2">
            <i className="bi bi-person-badge text-primary"></i>
            Perfil Institucional Moodle
          </h3>
          <p className="text-muted small mb-0">
            Informações acadêmicas sincronizadas diretamente do ambiente Moodle IFFar / IFF.
          </p>
        </div>

        <button
          className="btn btn-outline-danger btn-sm d-flex align-items-center gap-1"
          onClick={onLogout}
        >
          <i className="bi bi-box-arrow-right"></i>
          <span>Encerrar Sessão</span>
        </button>
      </div>

      <div className="row g-4">
        {/* User Card */}
        <div className="col-lg-4">
          <div className="card shadow-sm border-0 text-center p-4">
            <div className="mb-3">
              <div
                className="rounded-circle bg-primary text-white d-inline-flex justify-content-center align-items-center shadow-sm"
                style={{ width: "90px", height: "90px", fontSize: "32px", fontWeight: "bold" }}
              >
                {user.name ? user.name.charAt(0).toUpperCase() : "U"}
              </div>
            </div>

            <h5 className="fw-bold text-dark mb-1">{user.name}</h5>
            <p className="text-muted small mb-3">{user.email || "E-mail institucional não informado"}</p>

            {user.campus && (
              <div className="badge bg-primary-subtle text-primary border border-primary-subtle px-3 py-2 mb-3">
                <i className="bi bi-geo-alt-fill me-1"></i> {user.campus}
              </div>
            )}

            <div className="border-top pt-3 text-start small">
              <div className="d-flex justify-content-between py-1">
                <span className="text-muted">Cidade:</span>
                <span className="fw-semibold text-dark">{user.city || "Não informada"}</span>
              </div>
              <div className="d-flex justify-content-between py-1">
                <span className="text-muted">País:</span>
                <span className="fw-semibold text-dark">{user.country || "Brasil"}</span>
              </div>
              <div className="d-flex justify-content-between py-1">
                <span className="text-muted">Primeiro Acesso:</span>
                <span className="fw-semibold text-dark">{user.firstAccess || "N/A"}</span>
              </div>
              <div className="d-flex justify-content-between py-1">
                <span className="text-muted">Último Acesso:</span>
                <span className="fw-semibold text-dark">{user.lastAccess || "N/A"}</span>
              </div>
            </div>

            {user.profileUrl && (
              <a
                href={user.profileUrl}
                target="_blank"
                rel="noreferrer"
                className="btn btn-outline-primary btn-sm w-100 mt-3 d-flex align-items-center justify-content-center gap-1"
              >
                <i className="bi bi-box-arrow-up-right"></i>
                <span>Ver no Moodle IFFar</span>
              </a>
            )}
          </div>

          {/* Session Token Card */}
          <div className="card shadow-sm border-0 mt-4 p-3">
            <h6 className="fw-bold text-dark mb-2 small">
              <i className="bi bi-shield-check text-success me-1"></i>
              Token de Sessão Ativa
            </h6>
            <div className="p-2 bg-light rounded text-muted font-monospace small text-break">
              {token ? `${token.substring(0, 24)}...` : "Nenhum token ativo"}
            </div>
          </div>
        </div>

        {/* Courses & Academic Details */}
        <div className="col-lg-8">
          <div className="card shadow-sm border-0 mb-4">
            <div className="card-header bg-white py-3 border-bottom d-flex justify-content-between align-items-center">
              <h6 className="mb-0 fw-bold text-dark">
                <i className="bi bi-mortarboard me-2 text-primary"></i>
                Disciplinas e Cursos Matriculados ({user.courses ? user.courses.length : 0})
              </h6>
              <span className="badge bg-secondary">Moodle LMS</span>
            </div>

            <div className="card-body p-4">
              {user.courses && user.courses.length > 0 ? (
                <div className="list-group list-group-flush">
                  {user.courses.map((course, idx) => (
                    <div
                      key={idx}
                      className="list-group-item d-flex align-items-center justify-content-between px-0 py-3"
                    >
                      <div className="d-flex align-items-center gap-3">
                        <span className="badge bg-light text-secondary border rounded-circle p-2">
                          <i className="bi bi-book"></i>
                        </span>
                        <div>
                          <div className="fw-semibold text-dark">{course}</div>
                          <span className="text-muted small">Turma Ativa no Moodle</span>
                        </div>
                      </div>
                      <span className="badge bg-success-subtle text-success border border-success-subtle px-2 py-1 small">
                        Inscrito
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-muted">
                  <i className="bi bi-journal-x display-6 mb-2"></i>
                  <p className="mb-0 small">Nenhum curso ou disciplina listado no perfil público do Moodle.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
