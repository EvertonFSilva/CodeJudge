import React from "react";

export const Footer: React.FC = () => {
  return (
    <footer className="app-footer mt-auto">
      <div className="container-fluid px-4 d-flex flex-column flex-md-row justify-content-between align-items-center gap-2">
        <div className="d-flex align-items-center gap-2">
          <span className="text-light fw-semibold">CodeJudge</span>
          <span>&bull;</span>
          <span>Desenvolvido por <strong className="text-light">Everton</strong></span>
        </div>

        <div className="d-flex align-items-center gap-3">
          <span>Ambiente de Avaliação Automática e Diagnóstico com IA</span>
          <span>&bull;</span>
          <span className="text-success-emphasis">Moodle IFF</span>
        </div>
      </div>
    </footer>
  );
};
