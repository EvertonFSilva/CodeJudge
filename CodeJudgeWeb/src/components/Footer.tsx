import React from "react";

export const Footer: React.FC = () => {
  return (
    <footer className="app-footer mt-auto">
      <div className="container-fluid px-4 d-flex flex-column flex-md-row justify-content-between align-items-center gap-2">
        <div className="d-flex align-items-center gap-2">
          <span className="text-light fw-bold">CodeJudge</span>
          <span className="text-muted">&bull;</span>
          <span className="text-secondary">
            Desenvolvido por <strong style={{ color: "var(--emerald-accent)" }}>Everton</strong>
          </span>
        </div>

        <div className="d-flex align-items-center gap-2 text-secondary">
          <span className="small">Ambiente Integrado de Diagnóstico e Otimização com IA</span>
          <span className="text-muted">&bull;</span>
          <span
            className="small px-2 py-0.5 rounded fw-semibold"
            style={{
              background: "var(--emerald-subtle)",
              color: "var(--emerald-accent)",
              border: "1px solid rgba(16, 185, 129, 0.35)"
            }}
          >
            Moodle IFF
          </span>
        </div>
      </div>
    </footer>
  );
};
