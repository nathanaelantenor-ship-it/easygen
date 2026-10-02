import { store } from '../state/store.js';
import { modal } from './Modal.js';
import { formatCurrency } from '../utils/formatters.js';

export function openGlobalSearch(onNavigate) {
  const content = `
    <div class="space-y-4">
      <div class="relative">
        <input 
          id="global-search-input" 
          type="text" 
          autofocus
          placeholder="Digite para buscar clientes, leads, projetos, propostas, serviços..." 
          class="w-full pl-10 pr-4 py-3 bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm focus:outline-none focus:border-blue-600 dark:focus:border-blue-500 text-zinc-900 dark:text-zinc-100"
        />
        <svg class="w-5 h-5 text-zinc-400 absolute left-3 top-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
      </div>

      <div id="search-results-container" class="max-h-[60vh] overflow-y-auto space-y-4 pt-1">
        <p class="text-xs text-zinc-400 text-center py-6">Digite pelo menos 1 caractere para buscar em toda a base de dados.</p>
      </div>
    </div>
  `;

  const searchModal = modal.open({
    title: 'Busca Global (Ctrl + K)',
    content,
    size: 'lg'
  });

  const input = searchModal.panel.querySelector('#global-search-input');
  const resultsContainer = searchModal.panel.querySelector('#search-results-container');

  setTimeout(() => input?.focus(), 50);

  input.addEventListener('input', (e) => {
    const q = e.target.value.trim();
    if (!q) {
      resultsContainer.innerHTML = '<p class="text-xs text-zinc-400 text-center py-6">Digite pelo menos 1 caractere para buscar em toda a base de dados.</p>';
      return;
    }

    const results = store.searchAll(q);
    const categories = Object.keys(results).filter(cat => results[cat].length > 0);

    if (categories.length === 0) {
      resultsContainer.innerHTML = `<p class="text-xs text-zinc-400 text-center py-8">Nenhum resultado encontrado para "${q}".</p>`;
      return;
    }

    let html = '';
    categories.forEach(cat => {
      const items = results[cat];
      const categoryTitle = cat.charAt(0).toUpperCase() + cat.slice(1);
      html += `
        <div class="space-y-1.5">
          <div class="text-[11px] font-semibold tracking-wider uppercase text-zinc-400 dark:text-zinc-500 px-1">${categoryTitle} (${items.length})</div>
          <div class="space-y-1">
            ${items.map(item => `
              <div data-module="${cat}" data-id="${item.id}" class="search-result-item flex items-center justify-between p-2.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer transition-colors text-xs">
                <div class="font-medium text-zinc-800 dark:text-zinc-200">
                  ${item.name || item.title || item.number || 'Item'}
                  ${item.company ? `<span class="text-zinc-400 ml-1">(${item.company})</span>` : ''}
                </div>
                <div class="text-[11px] text-zinc-400">
                  ${item.price ? formatCurrency(item.price) : ''}
                  ${item.value ? formatCurrency(item.value) : ''}
                  ${item.amount ? formatCurrency(item.amount) : ''}
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    });

    resultsContainer.innerHTML = html;

    resultsContainer.querySelectorAll('.search-result-item').forEach(el => {
      el.onclick = () => {
        const mod = el.getAttribute('data-module');
        const mapping = {
          clientes: 'clients',
          leads: 'crm',
          projetos: 'projects',
          propostas: 'proposals',
          servicos: 'services',
          documentos: 'documents',
          tarefas: 'routine',
          eventos: 'agenda',
          financeiro: 'finance'
        };
        searchModal.close();
        if (onNavigate && mapping[mod]) {
          onNavigate(mapping[mod]);
        }
      };
    });
  });
}
