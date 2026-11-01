import React from "react";

export const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-top py-3 mt-auto">
      <div className="container-fluid px-4 d-flex flex-column flex-md-row justify-content-between align-items-center text-muted small">
        <div>
          <strong>CodeJudge</strong> &copy; {new Date().getFullYear()} &bull; Desenvolvido por <span className="text-dark fw-semibold">Everton</span>
        </div>
        <div className="mt-2 mt-md-0 d-flex gap-3">
          <span>Ambiente de Avaliação Automática e Diagnóstico com IA</span>
          <span>&bull;</span>
          <span>Moodle IFFar / IFF</span>
        </div>
      </div>
    </footer>
  );
};
