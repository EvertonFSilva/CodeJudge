import React, { useEffect, useState, useMemo } from "react";
import { PromptDocument } from "../types/prompts";
import { PromptService } from "../services/PromptService";
import { MarkdownRenderer } from "../components/MarkdownRenderer";
import { CustomDropdown, DropdownOption } from "../components/CustomDropdown";

export const PromptsPage: React.FC = () => {
  const [prompts, setPrompts] = useState<PromptDocument[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [activePrompt, setActivePrompt] = useState<PromptDocument | null>(null);
  const [copiedPromptKey, setCopiedPromptKey] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const list = await PromptService.getAll();
        setPrompts(list);
      } catch (err: unknown) {
        setErrorMessage("Não foi possível carregar os prompts da API do CodeJudgeApp.");
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
      const matchesCategory =
        selectedCategory === "all" || p.category.toLowerCase() === selectedCategory.toLowerCase();
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !query ||
        p.name.toLowerCase().includes(query) ||
        p.description.toLowerCase().includes(query) ||
        p.key.toLowerCase().includes(query);
      return matchesCategory && matchesSearch;
    });
  }, [prompts, selectedCategory, searchQuery]);

  const handleCopy = (key: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedPromptKey(key);
    setTimeout(() => setCopiedPromptKey(null), 2000);
  };

  return (
    <div className="container-fluid px-3 px-md-4 py-4 fade-in">
      <div
        className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4 gap-3 pb-3"
        style={{ borderBottom: "1px solid var(--border-color)" }}
      >
        <div>
          <h4 className="fw-bold text-white mb-1 d-flex align-items-center gap-2">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
            </svg>
            Prompts
          </h4>
          <p className="text-secondary small mb-0">
            Modelos estruturados para apoiar sua prática de programação com diagnósticos conceituais e otimizações.
          </p>
        </div>

        <div>
          <span className="lang-badge">
            {prompts.length} Prompts Carregados
          </span>
        </div>
      </div>

      {errorMessage && (
        <div
          className="p-3 rounded small d-flex align-items-center gap-2 mb-4"
          style={{
            backgroundColor: "rgba(248, 81, 73, 0.12)",
            border: "1px solid rgba(248, 81, 73, 0.35)",
            color: "#ff7b72"
          }}
          role="alert"
        >
          <i className="bi bi-exclamation-triangle-fill fs-5 text-danger flex-shrink-0"></i>
          <div>{errorMessage}</div>
        </div>
      )}

      <div className="dark-card dropdown-host-card mb-4 p-3">
        <div className="row g-3 align-items-center">
          <div className="col-md-7">
            <div className="custom-search-wrapper">
              <span className="custom-search-icon">
                <i className="bi bi-search"></i>
              </span>
              <input
                type="text"
                className="custom-search-input"
                placeholder="Pesquisar por nome ou finalidade do prompt..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  className="custom-search-clear-btn"
                  type="button"
                  onClick={() => setSearchQuery("")}
                  title="Limpar pesquisa"
                >
                  <i className="bi bi-x-lg"></i>
                </button>
              )}
            </div>
          </div>

          <div className="col-md-5">
            <div className="d-flex align-items-center gap-2">
              <label className="form-label mb-0 small fw-semibold text-secondary flex-shrink-0">
                Categoria:
              </label>
              <div className="flex-grow-1">
                <CustomDropdown
                  options={categories.map((cat) => ({
                    value: cat,
                    label: cat === "all" ? "Todas as Categorias" : cat.toUpperCase(),
                    icon: (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
                      </svg>
                    )
                  }))}
                  value={selectedCategory}
                  onChange={(val) => setSelectedCategory(val)}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-success" role="status"></div>
          <p className="mt-2 text-secondary small">Carregando catálogo de prompts...</p>
        </div>
      ) : filteredPrompts.length === 0 ? (
        <div className="dark-card text-center py-5">
          <div className="text-secondary display-6 mb-2">
            <i className="bi bi-search"></i>
          </div>
          <h6 className="fw-bold text-white">Nenhum prompt encontrado</h6>
          <p className="text-secondary small mb-0">Tente ajustar seus termos de busca ou categoria.</p>
        </div>
      ) : (
        <div className="row g-3">
          {filteredPrompts.map((prompt, idx) => (
            <div key={idx} className="col-md-6 col-lg-4">
              <div className="dark-card h-100 d-flex flex-column justify-content-between p-3">
                <div>
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <span className="lang-badge">
                      {prompt.category.toUpperCase()}
                    </span>
                    <span className="text-secondary font-monospace small">#{idx + 1}</span>
                  </div>
                  <h6 className="fw-bold text-white mb-1">{prompt.name}</h6>
                  <p className="text-secondary small" style={{ minHeight: "44px" }}>
                    {prompt.description || "Sem descrição informada."}
                  </p>
                </div>

                <div
                  className="d-flex justify-content-between align-items-center pt-3"
                  style={{ borderTop: "1px solid var(--border-subtle)" }}
                >
                  <button
                    type="button"
                    className="btn btn-action-upload py-1 px-3 d-flex align-items-center gap-1.5"
                    onClick={() => setActivePrompt(prompt)}
                  >
                    <i className="bi bi-eye"></i>
                    <span>Visualizar</span>
                  </button>

                  <button
                    type="button"
                    className={`btn py-1 px-2.5 d-flex align-items-center gap-1 ${
                      copiedPromptKey === prompt.key ? "btn-action-copy copied" : "btn-action-copy"
                    }`}
                    onClick={() => handleCopy(prompt.key, prompt.content)}
                    title="Copiar template"
                  >
                    <i className={`bi ${copiedPromptKey === prompt.key ? "bi-check-lg" : "bi-clipboard"}`}></i>
                    {copiedPromptKey === prompt.key && <span className="small">Copiado!</span>}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {activePrompt && (
        <div
          className="modal fade show d-block"
          tabIndex={-1}
          style={{ backgroundColor: "rgba(0, 0, 0, 0.8)", backdropFilter: "blur(4px)" }}
          onClick={() => setActivePrompt(null)}
        >
          <div
            className="modal-dialog modal-lg modal-dialog-scrollable"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="modal-content dark-card"
              style={{ border: "1px solid var(--border-color)", background: "var(--bg-card)" }}
            >
              <div
                className="modal-header"
                style={{ borderBottom: "1px solid var(--border-color)", background: "var(--bg-card-secondary)" }}
              >
                <div className="d-flex align-items-center gap-2">
                  <span className="lang-badge">{activePrompt.category}</span>
                  <h5 className="modal-title fw-bold text-white mb-0">{activePrompt.name}</h5>
                </div>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setActivePrompt(null)}
                ></button>
              </div>

              <div className="modal-body p-4">
                <div className="mb-3">
                  <span className="text-secondary small fw-semibold">Finalidade:</span>
                  <p className="text-light small mb-0">{activePrompt.description}</p>
                </div>

                <div className="mb-3">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className="text-secondary small fw-semibold">Conteúdo da Instrução:</span>
                    <button
                      className={`btn btn-sm py-1 px-3 d-flex align-items-center gap-1.5 ${
                        copiedPromptKey === activePrompt.key ? "btn-action-copy copied" : "btn-action-copy"
                      }`}
                      onClick={() => handleCopy(activePrompt.key, activePrompt.content)}
                    >
                      <i className={`bi ${copiedPromptKey === activePrompt.key ? "bi-check-lg" : "bi-clipboard"}`}></i>
                      <span>{copiedPromptKey === activePrompt.key ? "Copiado!" : "Copiar"}</span>
                    </button>
                  </div>
                  <MarkdownRenderer content={activePrompt.content} />
                </div>
              </div>

              <div
                className="modal-footer"
                style={{ borderTop: "1px solid var(--border-color)", background: "var(--bg-card-secondary)" }}
              >
                <button
                  type="button"
                  className="btn btn-report-action btn-sm"
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
