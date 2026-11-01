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
    <div className="card shadow-sm border-0 mb-4">
      <div className="card-header bg-white py-3 border-bottom d-flex justify-content-between align-items-center">
        <h6 className="mb-0 fw-bold text-dark">
          <i className="bi bi-list-check me-2 text-primary"></i>
          Resultados dos Casos de Teste
        </h6>
        <div className="d-flex gap-2">
          <span className={`badge px-3 py-2 ${computedRate === 100 ? "bg-success" : computedRate > 0 ? "bg-warning text-dark" : "bg-danger"}`}>
            Taxa de Acerto: {computedRate}% ({passedCount}/{totalCount})
          </span>
          {durationMs !== undefined && durationMs !== null && (
            <span className="badge bg-secondary px-3 py-2">
              <i className="bi bi-stopwatch me-1"></i>
              {durationMs.toFixed(1)} ms
            </span>
          )}
        </div>
      </div>
      <div className="table-responsive">
        <table className="table table-hover align-middle mb-0">
          <thead className="table-light">
            <tr>
              <th style={{ width: "80px" }} className="text-center">#</th>
              <th>Entrada</th>
              <th>Saída Esperada</th>
              <th>Saída Obtida</th>
              <th style={{ width: "120px" }} className="text-center">Resultado</th>
            </tr>
          </thead>
          <tbody>
            {outcomes.map((outcome, idx) => (
              <tr key={idx} className={outcome.passed ? "table-light-success" : "table-light-danger"}>
                <td className="text-center fw-semibold">{idx + 1}</td>
                <td>
                  <pre className="mb-0 p-2 bg-light rounded text-dark small font-monospace" style={{ maxHeight: "80px", overflowY: "auto" }}>
                    {outcome.input || <span className="text-muted fst-italic">(vazia)</span>}
                  </pre>
                </td>
                <td>
                  <pre className="mb-0 p-2 bg-light rounded text-dark small font-monospace" style={{ maxHeight: "80px", overflowY: "auto" }}>
                    {outcome.expected || <span className="text-muted fst-italic">(vazia)</span>}
                  </pre>
                </td>
                <td>
                  <pre className="mb-0 p-2 bg-light rounded text-dark small font-monospace" style={{ maxHeight: "80px", overflowY: "auto" }}>
                    {outcome.actual || <span className="text-muted fst-italic">(vazia)</span>}
                  </pre>
                </td>
                <td className="text-center">
                  {outcome.passed ? (
                    <span className="badge bg-success-subtle text-success border border-success-subtle px-2 py-1">
                      <i className="bi bi-check-circle-fill me-1"></i> Passou
                    </span>
                  ) : (
                    <span className="badge bg-danger-subtle text-danger border border-danger-subtle px-2 py-1">
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
