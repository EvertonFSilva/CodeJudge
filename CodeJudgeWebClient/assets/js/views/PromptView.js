export class PromptView {
    constructor(containerId, loadingId) {
        this.container = document.getElementById(containerId);
        this.loading = document.getElementById(loadingId);
    }

    renderPrompts(prompts) {
        this.loading.style.display = 'none';
        this.container.style.display = 'block';

        let accordionHtml = '';
        let idx = 0;

        Object.keys(prompts).forEach(category => {
            const categoryPrompts = prompts[category];

            accordionHtml += `<h4 class="mt-5 mb-3">${toTitleCase(category)}</h4>`;
            accordionHtml += `<div class="accordion shadow-sm rounded-3" id="accordion-${category}">`;

            Object.keys(categoryPrompts).forEach(promptKey => {
                const prompt = categoryPrompts[promptKey];
                const metadata = prompt.metadata || {};
                const promptName = metadata.name || toTitleCase(promptKey);
                const description = metadata.description || '';
                const promptContent = marked.parse(prompt.content || '');
                const collapseId = `collapse-${category}-${idx}`;

                accordionHtml += `
                    <div class="accordion-item">
                        <h2 class="accordion-header" id="heading-${collapseId}">
                            <button class="accordion-button collapsed d-flex flex-column align-items-start" 
                                type="button" data-bs-toggle="collapse" 
                                data-bs-target="#${collapseId}" 
                                aria-expanded="false" 
                                aria-controls="${collapseId}">
                                <span class="fw-bold">${promptName}</span>
                                ${description ? `<div class="text-muted mt-1 small">${description}</div>` : ''}
                            </button>
                        </h2>
                        <div id="${collapseId}" class="accordion-collapse collapse" aria-labelledby="heading-${collapseId}" data-bs-parent="#accordion-${category}">
                            <div class="accordion-body border-start ps-3">
                                ${promptContent}
                            </div>
                        </div>
                    </div>
                `;
                idx++;
            });

            accordionHtml += `</div>`;
        });

        this.container.innerHTML = accordionHtml;
    }

    renderError(message) {
        this.loading.innerHTML = `<p class="text-danger">${message}</p>`;
    }
}

function toTitleCase(str) {
    return str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.slice(1));
}
