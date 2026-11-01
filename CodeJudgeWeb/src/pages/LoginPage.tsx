import React, { useState } from "react";
import { AuthService } from "../services/AuthService";
import { UserProfile } from "../types/auth";

interface LoginPageProps {
  onLoginSuccess: (profile: UserProfile) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setErrorMessage("Por favor, preencha o usuário e a senha.");
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await AuthService.login(username.trim(), password);
      onLoginSuccess(response.profile);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erro desconhecido ao autenticar.";
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-vh-100 d-flex flex-column justify-content-center align-items-center bg-light py-5 px-3">
      <div className="card shadow-lg border-0 rounded-4" style={{ maxWidth: "450px", width: "100%" }}>
        <div className="card-body p-4 p-md-5">
          <div className="text-center mb-4">
            <div className="display-4 text-primary mb-2">
              <i className="bi bi-terminal-split"></i>
            </div>
            <h3 className="fw-bold text-dark mb-1">CodeJudge</h3>
            <p className="text-muted small mb-0">
              Ambiente Integrado de Avaliação e Aprendizado com IA
            </p>
          </div>

          <div className="alert alert-info py-2 px-3 small d-flex align-items-center gap-2 mb-4">
            <i className="bi bi-shield-lock-fill fs-5 text-primary flex-shrink-0"></i>
            <div>
              Autenticação institucional integrada via <strong>Moodle IFFar / IFF</strong>. Use suas credenciais acadêmicas (CPF e senha).
            </div>
          </div>

          {errorMessage && (
            <div className="alert alert-danger py-2 px-3 small d-flex align-items-center gap-2 mb-4" role="alert">
              <i className="bi bi-exclamation-triangle-fill fs-5 text-danger flex-shrink-0"></i>
              <div>{errorMessage}</div>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label small fw-semibold text-secondary" htmlFor="username">
                Usuário / CPF (Moodle)
              </label>
              <div className="input-group">
                <span className="input-group-text bg-white text-muted">
                  <i className="bi bi-person"></i>
                </span>
                <input
                  type="text"
                  id="username"
                  className="form-control"
                  placeholder="Seu CPF (apenas números)"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={isLoading}
                  autoComplete="username"
                  required
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="form-label small fw-semibold text-secondary" htmlFor="password">
                Senha Institucional
              </label>
              <div className="input-group">
                <span className="input-group-text bg-white text-muted">
                  <i className="bi bi-key"></i>
                </span>
                <input
                  type="password"
                  id="password"
                  className="form-control"
                  placeholder="Sua senha do Moodle"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  autoComplete="current-password"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary w-100 py-2 fw-semibold d-flex justify-content-center align-items-center gap-2 shadow-sm"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                  <span>Verificando credenciais no Moodle...</span>
                </>
              ) : (
                <>
                  <i className="bi bi-box-arrow-in-right"></i>
                  <span>Entrar no CodeJudge</span>
                </>
              )}
            </button>
          </form>
        </div>

        <div className="card-footer bg-light border-0 text-center py-3 text-muted small">
          Desenvolvido por <strong>Everton</strong> &bull; IFFar
        </div>
      </div>
    </div>
  );
};
