import { store } from '../state/store.js';
import { modal } from '../components/Modal.js';
import { toast } from '../components/Toast.js';
import { formatDate } from '../utils/formatters.js';

let selectedCategory = 'all';
let searchQuery = '';

export function renderDocumentsView(container, onNavigate) {
  const { documents, clients, projects } = store.getState();

  const categories = [
    'Contratos', 'Briefings', 'Identidade visual', 'Artes', 'Apresentações',
    'Comprovantes', 'Notas fiscais', 'Propostas', 'Arquivos finais', 'Outros'
  ];

  let filtered = documents;
  if (selectedCategory !== 'all') {
    filtered = filtered.filter(d => d.category === selectedCategory);
  }
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    filtered = filtered.filter(d => d.name.toLowerCase().includes(q) || (d.clientName && d.clientName.toLowerCase().includes(q)));
  }

  container.innerHTML = `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 class="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">Central de Documentos</h2>
          <p class="text-xs text-zinc-500">Repositório unificado de arquivos, contratos, briefings e notas fiscais sincronizados com clientes e projetos.</p>
        </div>
        <div class="flex items-center gap-2">
          <button id="doc-upload-btn" class="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition-colors shadow-xs">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg>
            <span>Novo Arquivo</span>
          </button>
        </div>
      </div>

      <!-- Filters & Categories Bar -->
      <div class="space-y-3">
        <!-- Search and Client Quick Filter -->
        <div class="flex flex-col sm:flex-row sm:items-center gap-3">
          <div class="relative flex-1">
            <input 
              id="docs-search-input" 
              type="text" 
              value="${searchQuery}" 
              placeholder="Buscar documento por nome ou cliente..." 
              class="w-full pl-9 pr-4 py-2 bg-white dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-blue-600"
            />
            <svg class="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
          </div>
        </div>

        <!-- Categories Pill Bar -->
        <div class="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <button data-cat="all" class="px-3 py-1 rounded-lg font-medium shrink-0 transition-colors ${selectedCategory === 'all' ? 'bg-blue-600 text-white font-semibold' : 'bg-white dark:bg-zinc-850 text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-750 hover:bg-zinc-100'}">
            Todos (${documents.length})
          </button>
          ${categories.map(cat => {
            const count = documents.filter(d => d.category === cat).length;
            const isSel = selectedCategory === cat;
            return `
              <button data-cat="${cat}" class="px-3 py-1 rounded-lg font-medium shrink-0 transition-colors ${isSel ? 'bg-blue-600 text-white font-semibold' : 'bg-white dark:bg-zinc-850 text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-750 hover:bg-zinc-100'}">
                ${cat} (${count})
              </button>
            `;
          }).join('')}
        </div>
      </div>

      <!-- Documents Grid -->
      ${filtered.length === 0 ? `
        <div class="text-center py-16 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl">
          <svg class="w-10 h-10 mx-auto text-zinc-300 dark:text-zinc-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
          <p class="text-xs text-zinc-400">Nenhum documento encontrado com os filtros atuais.</p>
        </div>
      ` : `
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          ${filtered.map(doc => `
            <div class="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-2xs hover:border-blue-400 dark:hover:border-blue-600 transition-all flex flex-col justify-between">
              <div>
                <div class="flex items-start justify-between gap-2 mb-2">
                  <div class="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs uppercase shrink-0">
                    ${doc.format || 'doc'}
                  </div>
                  <span class="text-[10px] bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 px-2 py-0.5 rounded-full font-medium border border-zinc-200/60 dark:border-zinc-700">
                    ${doc.category}
                  </span>
                </div>
                <h4 class="font-semibold text-xs text-zinc-900 dark:text-zinc-100 truncate" title="${doc.name}">${doc.name}</h4>
                <div class="text-[11px] text-zinc-400 mt-1 space-y-0.5">
                  <div class="truncate">Cliente: <span class="text-zinc-700 dark:text-zinc-300 font-medium">${doc.clientName || 'Geral'}</span></div>
                  ${doc.projectName ? `<div class="truncate">Projeto: <span class="text-zinc-700 dark:text-zinc-300">${doc.projectName}</span></div>` : ''}
                </div>
              </div>

              <div class="pt-3 mt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-[11px] text-zinc-400">
                <span>${doc.size || '1.0 MB'} • ${formatDate(doc.uploadDate)}</span>
                <div class="flex items-center gap-1">
                  <button data-action="preview" data-id="${doc.id}" class="p-1 text-zinc-400 hover:text-blue-600 rounded transition-colors" title="Visualizar">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                  </button>
                  <button data-action="download" data-id="${doc.id}" class="p-1 text-zinc-400 hover:text-emerald-600 rounded transition-colors" title="Baixar">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                  </button>
                  <button data-action="delete" data-id="${doc.id}" class="p-1 text-zinc-400 hover:text-rose-600 rounded transition-colors" title="Excluir">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                  </button>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      `}
    </div>
  `;

  // Search input
  const searchInput = container.querySelector('#docs-search-input');
  searchInput.oninput = (e) => {
    searchQuery = e.target.value;
    renderDocumentsView(container, onNavigate);
  };

  // Category filter buttons
  container.querySelectorAll('button[data-cat]').forEach(btn => {
    btn.onclick = () => {
      selectedCategory = btn.getAttribute('data-cat');
      renderDocumentsView(container, onNavigate);
    };
  });

  // Actions
  container.querySelectorAll('button[data-action]').forEach(btn => {
    btn.onclick = () => {
      const action = btn.getAttribute('data-action');
      const id = btn.getAttribute('data-id');
      const doc = documents.find(d => d.id === id);
      if (!doc) return;

      if (action === 'preview') {
        modal.open({
          title: `Visualização: ${doc.name}`,
          content: `
            <div class="p-8 text-center space-y-4">
              <div class="w-16 h-16 rounded-2xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 flex items-center justify-center font-bold text-lg mx-auto">
                ${doc.format.toUpperCase()}
              </div>
              <div>
                <h4 class="font-bold text-sm text-zinc-900 dark:text-zinc-100">${doc.name}</h4>
                <p class="text-xs text-zinc-400 mt-1">Categoria: ${doc.category} • Tamanho: ${doc.size}</p>
                <p class="text-xs text-zinc-500 mt-1">Vinculado a: ${doc.clientName || 'Geral'}</p>
              </div>
              <div class="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-xl text-xs text-zinc-500 max-w-sm mx-auto">
                Visualização do documento pronto para conferência e download local.
              </div>
            </div>
          `,
          size: 'md'
        });
      } else if (action === 'download') {
        const dummyBlob = new Blob([`Arquivo: ${doc.name}\nCategoria: ${doc.category}\nCliente: ${doc.clientName}`], { type: 'text/plain' });
        const url = URL.createObjectURL(dummyBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = doc.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        toast.success(`Download de ${doc.name} iniciado!`);
      } else if (action === 'delete') {
        if (confirm(`Deseja remover o arquivo "${doc.name}"?`)) {
          store.deleteDocument(id);
          toast.info('Documento removido da Central.');
          renderDocumentsView(container, onNavigate);
        }
      }
    };
  });

  // Upload modal
  container.querySelector('#doc-upload-btn').onclick = () => {
    openUploadDocModal(() => renderDocumentsView(container, onNavigate));
  };
}

function openUploadDocModal(onSuccess) {
  const { clients, projects } = store.getState();
  const content = `
    <form id="docs-upload-form" class="space-y-3">
      <div>
        <label class="block text-xs font-medium text-zinc-600 dark:text-zinc-300 mb-1">Nome do Documento / Arquivo *</label>
        <input required name="name" class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs" placeholder="Ex: Contrato_Prestacao_2026.pdf">
      </div>
      <div class="grid grid-cols-2 gap-2">
        <div>
          <label class="block text-xs font-medium text-zinc-600 dark:text-zinc-300 mb-1">Categoria *</label>
          <select name="category" class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs">
            <option value="Contratos">Contratos</option>
            <option value="Briefings">Briefings</option>
            <option value="Identidade visual">Identidade visual</option>
            <option value="Artes">Artes</option>
            <option value="Apresentações">Apresentações</option>
            <option value="Comprovantes">Comprovantes</option>
            <option value="Notas fiscais">Notas fiscais</option>
            <option value="Propostas">Propostas</option>
            <option value="Arquivos finais">Arquivos finais</option>
            <option value="Outros">Outros</option>
          </select>
        </div>
        <div>
          <label class="block text-xs font-medium text-zinc-600 dark:text-zinc-300 mb-1">Formato</label>
          <select name="format" class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs">
            <option value="pdf">PDF</option>
            <option value="zip">ZIP / Compactado</option>
            <option value="png">PNG / Imagem</option>
            <option value="fig">FIG / Figma</option>
            <option value="docx">DOCX</option>
          </select>
        </div>
      </div>
      <div class="grid grid-cols-2 gap-2">
        <div>
          <label class="block text-xs font-medium text-zinc-600 dark:text-zinc-300 mb-1">Cliente Vinculado</label>
          <select name="clientId" class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs">
            <option value="">Nenhum (Documento Geral)</option>
            ${clients.map(c => `<option value="${c.id}">${c.name} (${c.company})</option>`).join('')}
          </select>
        </div>
        <div>
          <label class="block text-xs font-medium text-zinc-600 dark:text-zinc-300 mb-1">Projeto Vinculado</label>
          <select name="projectId" class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs">
            <option value="">Nenhum</option>
            ${projects.map(p => `<option value="${p.id}">${p.title}</option>`).join('')}
          </select>
        </div>
      </div>
      <div>
        <label class="block text-xs font-medium text-zinc-600 dark:text-zinc-300 mb-1">Tamanho Estimado</label>
        <input name="size" class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs" placeholder="Ex: 2.4 MB" value="1.8 MB">
      </div>
      <div class="pt-2 flex justify-end gap-2">
        <button type="submit" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors">Salvar Documento</button>
      </div>
    </form>
  `;

  const m = modal.open({
    title: 'Adicionar Documento à Central',
    content,
    size: 'md'
  });

  m.panel.querySelector('#docs-upload-form').onsubmit = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const clientId = fd.get('clientId');
    const projectId = fd.get('projectId');
    const selectedClient = clients.find(c => c.id === clientId);
    const selectedProj = projects.find(p => p.id === projectId);

    store.addDocument({
      name: fd.get('name'),
      category: fd.get('category'),
      format: fd.get('format'),
      size: fd.get('size'),
      clientId: clientId || null,
      clientName: selectedClient ? selectedClient.name : null,
      projectId: projectId || null,
      projectName: selectedProj ? selectedProj.title : null
    });

    toast.success('Documento arquivado com sucesso na Central!');
    m.close();
    if (onSuccess) onSuccess();
  };
}
