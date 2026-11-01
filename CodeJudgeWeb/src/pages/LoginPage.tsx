import React, { useState } from "react";
import { AuthService } from "../services/AuthService";
import { UserProfile } from "../types/auth";
import { CodeJudgeLogo } from "../components/CodeJudgeLogo";

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
      setErrorMessage("Por favor, preencha o CPF e a senha.");
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
    <div
      className="min-vh-100 d-flex flex-column justify-content-center align-items-center py-5 px-3"
      style={{ backgroundColor: "var(--bg-main)" }}
    >
      <div className="dark-card shadow-lg p-4 p-md-5" style={{ maxWidth: "440px", width: "100%", borderColor: "var(--border-color)" }}>
        <div className="text-center mb-4">
          <div className="d-flex justify-content-center mb-3">
            <CodeJudgeLogo size={42} />
          </div>
          <h3 className="fw-bold text-white mb-1">CodeJudge</h3>
          <p className="text-secondary small mb-0">
            Ambiente Integrado de Avaliação e Aprendizado com IA
          </p>
        </div>

        <div
          className="p-3 mb-4 rounded d-flex align-items-center gap-2 small"
          style={{
            backgroundColor: "var(--green-subtle)",
            border: "1px solid var(--green-border)",
            color: "#e2e8f0"
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" className="flex-shrink-0">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
          </svg>
          <div>
            Autenticação integrada via <strong>Moodle IFF</strong>. Utilize seu CPF e senha institucional.
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
              CPF / Matrícula (Moodle IFF)
            </label>
            <div className="input-group">
              <span className="input-group-text dark-input text-secondary border-end-0">
                <i className="bi bi-person"></i>
              </span>
              <input
                type="text"
                id="username"
                className="form-control dark-input border-start-0"
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
              <span className="input-group-text dark-input text-secondary border-end-0">
                <i className="bi bi-key"></i>
              </span>
              <input
                type="password"
                id="password"
                className="form-control dark-input border-start-0"
                placeholder="Sua senha do Moodle IFF"
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
            className="main-execute-btn w-100 py-2 fw-semibold d-flex justify-content-center align-items-center gap-2"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                <span>Validando credenciais no Moodle IFF...</span>
              </>
            ) : (
              <>
                <i className="bi bi-box-arrow-in-right"></i>
                <span>Entrar no CodeJudge</span>
              </>
            )}
          </button>
        </form>

        <div className="text-center mt-4 pt-3 border-top border-secondary-subtle text-secondary small">
          Desenvolvido por <strong className="text-light">Everton</strong> &bull; IFF
        </div>
      </div>
    </div>
  );
};
