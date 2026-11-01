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
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setErrorMessage("Por favor, preencha o CPF e a senha institucional.");
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
    <div className="login-page-wrapper">
      <div className="login-card-container fade-in">
        <div className="text-center mb-4">
          <div className="login-logo-glow mb-3">
            <CodeJudgeLogo size={54} />
          </div>
          <div className="d-flex align-items-center justify-content-center gap-2 mb-1">
            <h2 className="login-title mb-0">CodeJudge</h2>
            <span className="brand-subtitle">IFF</span>
          </div>
          <p className="login-subtitle">
            Ambiente Integrado de Diagnóstico e Otimização com IA
          </p>
        </div>

        <div className="institutional-notice mb-4">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.2" className="flex-shrink-0">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
          </svg>
          <div className="notice-text">
            Autenticação institucional com <strong>Moodle IFF</strong>. Acesse utilizando seu CPF e senha institucional.
          </div>
        </div>

        {errorMessage && (
          <div className="error-alert-box mb-4" role="alert">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f85149" strokeWidth="2" className="flex-shrink-0">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <div>{errorMessage}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-field-group mb-3">
            <label className="field-label" htmlFor="username">
              CPF / Matrícula
            </label>
            <div className="input-wrapper">
              <span className="input-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
              </span>
              <input
                type="text"
                id="username"
                className="custom-form-input"
                placeholder="Digite seu CPF (apenas números)"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isLoading}
                autoComplete="username"
                required
              />
            </div>
          </div>

          <div className="form-field-group mb-4">
            <label className="field-label" htmlFor="password">
              Senha Institucional
            </label>
            <div className="input-wrapper">
              <span className="input-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
              </span>
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                className="custom-form-input"
                placeholder="Digite sua senha do Moodle"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                title={showPassword ? "Ocultar senha" : "Exibir senha"}
              >
                {showPassword ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                    <line x1="1" y1="1" x2="23" y2="23"></line>
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="login-submit-btn w-100"
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="d-flex align-items-center justify-content-center gap-2">
                <span className="spinner-border spinner-border-sm" role="status"></span>
                <span>Conectando ao Moodle IFF...</span>
              </span>
            ) : (
              <span className="d-flex align-items-center justify-content-center gap-2">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
                  <polyline points="10 17 15 12 10 7"></polyline>
                  <line x1="15" y1="12" x2="3" y2="12"></line>
                </svg>
                <span>Entrar no CodeJudge</span>
              </span>
            )}
          </button>
        </form>

        <div className="login-card-footer mt-4">
          <span>Desenvolvido por </span>
          <strong className="author-highlight">Everton</strong>
          <span className="separator">&bull;</span>
          <span className="institution-tag">Moodle IFF</span>
        </div>
      </div>
    </div>
  );
};
