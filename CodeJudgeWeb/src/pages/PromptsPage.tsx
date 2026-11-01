import React, { useEffect, useState, useMemo } from "react";
import { PromptDocument } from "../types/prompts";
import { PromptService } from "../services/PromptService";
import { MarkdownRenderer } from "../components/MarkdownRenderer";

export const PromptsPage: React.FC = () => {
  const [prompts, setPrompts] = useState<PromptDocument[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [activePrompt, setActivePrompt] = useState<PromptDocument | null>(null);
  const [copySuccess, setCopySuccess] = useState<boolean>(false);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const list = await PromptService.getAll();
        setPrompts(list);
      } catch (err: unknown) {
        setErrorMessage("Não foi possível carregar os prompts do CodeJudgeApp.");
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const categories = useMemo(() => {
    const set = new Set<string>();
    prompts.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return ["all", ...Array.from(set)];
  }, [prompts]);

  const filteredPrompts = useMemo(() => {
    return prompts.filter((p) => {
      const matchesCategory = selectedCategory === "all" || p.category.toLowerCase() === selectedCategory.toLowerCase();
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch = !query || p.name.toLowerCase().includes(query) || p.description.toLowerCase().includes(query);
      return matchesCategory && matchesSearch;
    });
  }, [prompts, selectedCategory, searchQuery]);

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  return (
    <div className="container-fluid px-4 py-4">
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4 gap-3 border-bottom pb-3">
        <div>
          <h3 className="fw-bold text-dark mb-1 d-flex align-items-center gap-2">
            <i className="bi bi-journal-code text-primary"></i>
            Catálogo de Prompts e Engenharia de IA
          </h3>
          <p className="text-muted small mb-0">
            Explore os 20 templates de prompt padronizados do CodeJudge para diagnóstico, otimização e feedback conceitual.
          </p>
        </div>

        <div className="d-flex align-items-center gap-2">
          <span className="badge bg-primary px-3 py-2">
            {prompts.length} Prompts Disponíveis
          </span>
        </div>
      </div>

      {errorMessage && (
        <div className="alert alert-danger d-flex align-items-center gap-2 mb-4" role="alert">
          <i className="bi bi-exclamation-triangle-fill fs-5"></i>
          <div>{errorMessage}</div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="card shadow-sm border-0 mb-4">
        <div className="card-body p-3">
          <div className="row g-3 align-items-center">
            <div className="col-md-6 col-lg-7">
              <div className="input-group">
                <span className="input-group-text bg-white text-muted">
                  <i className="bi bi-search"></i>
                </span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Pesquisar por nome ou descrição do prompt..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button
                    className="btn btn-outline-secondary"
                    type="button"
                    onClick={() => setSearchQuery("")}
                  >
                    <i className="bi bi-x-lg"></i>
                  </button>
                )}
              </div>
            </div>

            <div className="col-md-6 col-lg-5">
              <div className="d-flex align-items-center gap-2">
                <label className="form-label mb-0 small fw-semibold text-secondary flex-shrink-0">
                  Categoria:
                </label>
                <select
                  className="form-select form-select-sm"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat === "all" ? "Todas as Categorias" : cat.toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Prompts Cards Grid */}
      {isLoading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status"></div>
          <p className="mt-2 text-muted small">Carregando catálogo de prompts...</p>
        </div>
      ) : filteredPrompts.length === 0 ? (
        <div className="card shadow-sm border-0 text-center py-5">
          <div className="text-muted display-6 mb-2">
            <i className="bi bi-search"></i>
          </div>
          <h6 className="fw-bold text-dark">Nenhum prompt encontrado</h6>
          <p className="text-muted small mb-0">Tente ajustar seus termos de busca ou categoria.</p>
        </div>
      ) : (
        <div className="row g-4">
          {filteredPrompts.map((prompt, idx) => (
            <div key={idx} className="col-md-6 col-lg-4">
              <div className="card shadow-sm border-0 h-100 d-flex flex-column justify-content-between hover-shadow">
                <div className="card-body p-4">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <span className="badge bg-primary-subtle text-primary border border-primary-subtle px-2 py-1 small">
                      {prompt.category || "Geral"}
                    </span>
                    <span className="text-muted small font-monospace">#{idx + 1}</span>
                  </div>
                  <h5 className="card-title fw-bold text-dark mb-2">{prompt.name}</h5>
                  <p className="card-text text-secondary small" style={{ minHeight: "48px" }}>
                    {prompt.description || "Sem descrição informada."}
                  </p>
                </div>

                <div className="card-footer bg-white border-top p-3 d-flex justify-content-between align-items-center">
                  <button
                    className="btn btn-outline-primary btn-sm d-flex align-items-center gap-1"
                    onClick={() => setActivePrompt(prompt)}
                  >
                    <i className="bi bi-eye"></i>
                    <span>Visualizar</span>
                  </button>

                  <button
                    className="btn btn-outline-secondary btn-sm"
                    onClick={() => handleCopy(prompt.content)}
                    title="Copiar conteúdo do prompt"
                  >
                    <i className="bi bi-clipboard"></i>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Prompt View Modal */}
      {activePrompt && (
        <div
          className="modal fade show d-block"
          tabIndex={-1}
          style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
          onClick={() => setActivePrompt(null)}
        >
          <div
            className="modal-dialog modal-lg modal-dialog-scrollable"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-content border-0 shadow-lg">
              <div className="modal-header bg-dark text-white">
                <div className="d-flex align-items-center gap-2">
                  <span className="badge bg-primary">{activePrompt.category}</span>
                  <h5 className="modal-title fw-bold mb-0">{activePrompt.name}</h5>
                </div>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setActivePrompt(null)}
                  aria-label="Fechar"
                ></button>
              </div>

              <div className="modal-body p-4">
                <div className="mb-3">
                  <label className="form-label small fw-semibold text-secondary">Descrição:</label>
                  <p className="text-dark small mb-0">{activePrompt.description}</p>
                </div>

                <div className="mb-3">
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <label className="form-label small fw-semibold text-secondary mb-0">Template de Instrução:</label>
                    <button
                      className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1 py-1"
                      onClick={() => handleCopy(activePrompt.content)}
                    >
                      <i className={`bi ${copySuccess ? "bi-check-lg text-success" : "bi-clipboard"}`}></i>
                      <span>{copySuccess ? "Copiado!" : "Copiar Template"}</span>
                    </button>
                  </div>
                  <MarkdownRenderer content={activePrompt.content} />
                </div>
              </div>

              <div className="modal-footer bg-light">
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setActivePrompt(null)}
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
