import React from "react";
import { CodeJudgeLogo } from "./CodeJudgeLogo";

export const Footer: React.FC = () => {
  return (
    <footer className="app-footer mt-auto">
      <div className="container-fluid px-3 px-md-4 py-3">
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-center gap-3">
          <div className="d-flex align-items-center gap-3 flex-wrap text-center text-md-start">
            <div className="d-flex align-items-center gap-2">
              <CodeJudgeLogo size={24} />
              <span className="fw-bold text-white small">CodeJudge</span>
              <span
                className="px-2 py-0.5 rounded fw-semibold"
                style={{
                  background: "var(--emerald-subtle)",
                  color: "var(--emerald-accent)",
                  border: "1px solid rgba(16, 185, 129, 0.35)",
                  fontSize: "11px"
                }}
              >
                v2.0.0
              </span>
            </div>

            <div className="footer-v-divider d-none d-sm-block"></div>

            <div className="text-secondary small">
              Ambiente de Diagnóstico & Otimização com IA &bull;{" "}
              <strong className="text-light">Instituto Federal Fluminense (IFF)</strong>
            </div>
          </div>

          <div className="d-flex align-items-center gap-3 flex-wrap justify-content-center">
            <div className="text-secondary small">
              Desenvolvido por <strong style={{ color: "var(--emerald-accent)" }}>Everton</strong>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
