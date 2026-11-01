import React from "react";
import { ScenarioOutcome } from "../types/codejudge";

interface TestResultsTableProps {
  outcomes: ScenarioOutcome[];
  rate?: number | null;
  durationMs?: number | null;
}

export const TestResultsTable: React.FC<TestResultsTableProps> = ({
  outcomes,
  rate,
  durationMs
}) => {
  if (!outcomes || outcomes.length === 0) {
    return null;
  }

  const passedCount = outcomes.filter((o) => o.passed).length;
  const totalCount = outcomes.length;
  const computedRate = rate !== undefined && rate !== null
    ? rate
    : Math.round((passedCount / totalCount) * 100);

  return (
    <div className="dark-card mb-4">
      <div className="dark-card-header d-flex flex-wrap justify-content-between align-items-center gap-2">
        <div className="d-flex align-items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2">
            <polyline points="9 11 12 14 22 4"></polyline>
            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
          </svg>
          <span className="fw-bold text-light">Resultados dos Casos de Teste</span>
        </div>
        <div className="d-flex align-items-center gap-2">
          <span
            className={`badge px-3 py-1 font-monospace ${
              computedRate === 100
                ? "badge-custom-success"
                : computedRate > 0
                ? "badge-custom-warning"
                : "badge-custom-danger"
            }`}
          >
            Taxa de Acerto: {computedRate}% ({passedCount}/{totalCount})
          </span>
          {durationMs !== undefined && durationMs !== null && (
            <span className="badge badge-subtle-duration px-2 py-1 font-monospace">
              {durationMs.toFixed(1)} ms
            </span>
          )}
        </div>
      </div>

      <div className="table-responsive">
        <table className="table align-middle mb-0 custom-results-table">
          <thead>
            <tr>
              <th style={{ width: "55px" }} className="text-center">#</th>
              <th>Entrada (stdin)</th>
              <th>Saída Esperada</th>
              <th>Saída Obtida</th>
              <th style={{ width: "125px" }} className="text-center">Veredito</th>
            </tr>
          </thead>
          <tbody>
            {outcomes.map((outcome, idx) => (
              <tr key={idx}>
                <td className="text-center fw-bold text-light">{idx + 1}</td>
                <td>
                  <div className="test-cell-container">
                    {outcome.input && outcome.input.trim().length > 0 ? (
                      <pre className="test-cell-pre">{outcome.input}</pre>
                    ) : (
                      <span className="empty-val-chip">(vazia)</span>
                    )}
                  </div>
                </td>
                <td>
                  <div className="test-cell-container">
                    {outcome.expected && outcome.expected.trim().length > 0 ? (
                      <pre className="test-cell-pre">{outcome.expected}</pre>
                    ) : (
                      <span className="empty-val-chip">(vazia)</span>
                    )}
                  </div>
                </td>
                <td>
                  <div className="test-cell-container">
                    {outcome.actual && outcome.actual.trim().length > 0 ? (
                      <pre className="test-cell-pre">{outcome.actual}</pre>
                    ) : (
                      <span className="empty-val-chip">(vazia)</span>
                    )}
                  </div>
                </td>
                <td className="text-center">
                  {outcome.passed ? (
                    <span className="badge badge-custom-success px-2.5 py-1">
                      <i className="bi bi-check-circle-fill me-1"></i> Passou
                    </span>
                  ) : (
                    <span className="badge badge-custom-danger px-2.5 py-1">
                      <i className="bi bi-x-circle-fill me-1"></i> Falhou
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
