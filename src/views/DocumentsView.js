import { store } from '../state/store.js';
import { modal } from '../components/Modal.js';
import { toast } from '../components/Toast.js';
import { formatDate } from '../utils/formatters.js';

let currentPath = []; // array of path segments, e.g. ['Clientes', 'Pulse Academia & Cross', 'Contratos']
let searchQuery = '';
let viewMode = 'grid'; // 'grid' | 'list'

export function renderDocumentsView(container, onNavigate) {
  const state = store.getState();
  const { documents = [], clients = [], projects = [] } = state;

  // Build standard and virtual folders structure
  // Root level: Clientes, Modelos & Templates, Administrativo, Pessoal
  function getFolderContents() {
    let files = [];
    let subfolders = [];

    if (currentPath.length === 0) {
      // Root level
      subfolders = [
        { name: 'Clientes', icon: 'folder-user', count: clients.length, type: 'system' },
        { name: 'Modelos & Templates', icon: 'folder-template', count: documents.filter(d => d.category === 'Templates' || d.category === 'Modelos').length, type: 'system' },
        { name: 'Administrativo', icon: 'folder-briefcase', count: documents.filter(d => !d.clientId && d.category !== 'Pessoal' && d.category !== 'Templates').length, type: 'system' },
        { name: 'Pessoal', icon: 'folder-heart', count: documents.filter(d => d.category === 'Pessoal').length, type: 'system' }
      ];

      // Custom folders if any
      if (state.customFolders) {
        state.customFolders.filter(f => !f.parentId).forEach(f => {
          subfolders.push({ name: f.name, icon: 'folder', count: 0, type: 'custom', id: f.id });
        });
      }

      files = documents.filter(d => !d.clientId && !d.folder);
    } else if (currentPath[0] === 'Clientes') {
      if (currentPath.length === 1) {
        // Clientes root -> List all clients as folders
        subfolders = clients.map(c => {
          const clientDocs = documents.filter(d => d.clientId === c.id || d.clientName === c.name);
          return {
            name: c.name,
            icon: 'client',
            count: clientDocs.length,
            clientId: c.id
          };
        });
      } else if (currentPath.length === 2) {
        // Inside a specific client -> standard client subfolders
        const clientName = currentPath[1];
        const clientObj = clients.find(c => c.name === clientName);
        const subCategories = ['Contratos', 'Briefings', 'Financeiro', 'Projetos', 'Entregas', 'Arquivos Finais'];

        subfolders = subCategories.map(sub => {
          const count = documents.filter(d => {
            const matchesClient = d.clientId === clientObj?.id || d.clientName === clientName;
            if (!matchesClient) return false;
            if (sub === 'Contratos') return d.category === 'Contratos' || d.category === 'Propostas';
            if (sub === 'Briefings') return d.category === 'Briefings' || d.category === 'Identidade visual';
            if (sub === 'Financeiro') return d.category === 'Financeiro' || d.category === 'Comprovantes' || d.category === 'Notas fiscais';
            if (sub === 'Projetos') return d.category === 'Projetos' || d.category === 'Apresentações';
            if (sub === 'Entregas') return d.category === 'Entregas' || d.category === 'Artes';
            if (sub === 'Arquivos Finais') return d.category === 'Arquivos finais';
            return false;
          }).length;

          return {
            name: sub,
            icon: 'subfolder',
            count
          };
        });

        // Loose files for this client
        files = documents.filter(d => (d.clientId === clientObj?.id || d.clientName === clientName) && !d.subfolder);
      } else if (currentPath.length === 3) {
        // Inside a client subfolder (e.g. Clientes > Nexus > Contratos)
        const clientName = currentPath[1];
        const clientObj = clients.find(c => c.name === clientName);
        const sub = currentPath[2];

        files = documents.filter(d => {
          const matchesClient = d.clientId === clientObj?.id || d.clientName === clientName;
          if (!matchesClient) return false;
          if (d.subfolder === sub) return true;
          if (sub === 'Contratos') return d.category === 'Contratos' || d.category === 'Propostas';
          if (sub === 'Briefings') return d.category === 'Briefings' || d.category === 'Identidade visual';
          if (sub === 'Financeiro') return d.category === 'Financeiro' || d.category === 'Comprovantes' || d.category === 'Notas fiscais';
          if (sub === 'Projetos') return d.category === 'Projetos' || d.category === 'Apresentações';
          if (sub === 'Entregas') return d.category === 'Entregas' || d.category === 'Artes';
          if (sub === 'Arquivos Finais') return d.category === 'Arquivos finais';
          return false;
        });
      }
    } else if (currentPath[0] === 'Modelos & Templates') {
      files = documents.filter(d => d.category === 'Templates' || d.category === 'Modelos');
    } else if (currentPath[0] === 'Administrativo') {
      files = documents.filter(d => !d.clientId && d.category !== 'Pessoal' && d.category !== 'Templates');
    } else if (currentPath[0] === 'Pessoal') {
      files = documents.filter(d => d.category === 'Pessoal');
    }

    // Apply search filter if active
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      files = documents.filter(d => 
        d.name.toLowerCase().includes(q) || 
        (d.clientName && d.clientName.toLowerCase().includes(q)) ||
        (d.category && d.category.toLowerCase().includes(q)) ||
        (d.projectName && d.projectName.toLowerCase().includes(q))
      );
      subfolders = [];
    }

    return { subfolders, files };
  }

  const { subfolders, files } = getFolderContents();

  container.innerHTML = `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div class="flex items-center gap-3">
            <h2 class="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">Central de Documentos</h2>
            <span class="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
              ${documents.length} arquivos
            </span>
          </div>
          <p class="text-xs text-zinc-500 mt-1">Pastas inteligentes por cliente, contratos, briefings, arquivos finais e links externos (Figma, Drive, Notion).</p>
        </div>
        <div class="flex items-center gap-2">
          <button id="doc-new-folder-btn" class="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 rounded-xl text-xs font-semibold transition-colors border border-zinc-200 dark:border-zinc-700">
            <svg class="w-4 h-4 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h4l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"/></svg>
            <span>Nova Pasta</span>
          </button>
          <button id="doc-upload-btn" class="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition-colors shadow-xs">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
            <span>Novo Arquivo / Link</span>
          </button>
        </div>
      </div>

      <!-- Breadcrumbs & Barra de Navegação -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl shadow-2xs">
        <!-- Breadcrumbs -->
        <div class="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400 overflow-x-auto py-1">
          <button data-path-idx="-1" class="flex items-center gap-1 hover:text-blue-600 font-medium ${currentPath.length === 0 ? 'text-zinc-900 dark:text-zinc-100 font-bold' : ''}">
            <svg class="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/></svg>
            <span>Início</span>
          </button>
          ${currentPath.map((seg, idx) => `
            <span class="text-zinc-300 dark:text-zinc-600">/</span>
            <button data-path-idx="${idx}" class="hover:text-blue-600 font-medium whitespace-nowrap ${idx === currentPath.length - 1 ? 'text-zinc-900 dark:text-zinc-100 font-bold' : ''}">
              ${seg}
            </button>
          `).join('')}
        </div>

        <!-- Barra de Busca e Visualização -->
        <div class="flex items-center gap-2">
          <div class="relative w-full sm:w-56">
            <input 
              id="docs-search-input" 
              type="text" 
              value="${searchQuery}" 
              placeholder="Buscar em todos os arquivos..." 
              class="w-full pl-8 pr-3 py-1.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-blue-600"
            />
            <svg class="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
          </div>

          <div class="flex items-center bg-zinc-100 dark:bg-zinc-800 p-0.5 rounded-lg border border-zinc-200 dark:border-zinc-700 shrink-0">
            <button id="view-grid-btn" class="p-1.5 rounded-md ${viewMode === 'grid' ? 'bg-white dark:bg-zinc-900 text-blue-600 shadow-2xs' : 'text-zinc-400 hover:text-zinc-700'}">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"/></svg>
            </button>
            <button id="view-list-btn" class="p-1.5 rounded-md ${viewMode === 'list' ? 'bg-white dark:bg-zinc-900 text-blue-600 shadow-2xs' : 'text-zinc-400 hover:text-zinc-700'}">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/></svg>
            </button>
          </div>
        </div>
      </div>

      <!-- Pastas -->
      ${subfolders.length > 0 ? `
        <div class="space-y-3">
          <div class="text-xs font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
            <svg class="w-3.5 h-3.5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/></svg>
            <span>Pastas (${subfolders.length})</span>
          </div>
          <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            ${subfolders.map(folder => `
              <div 
                data-folder-name="${folder.name}" 
                class="folder-card p-3.5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 hover:border-blue-500 dark:hover:border-blue-500 cursor-pointer shadow-2xs transition-all flex items-center justify-between group"
              >
                <div class="flex items-center gap-3 overflow-hidden">
                  <div class="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/></svg>
                  </div>
                  <div class="truncate">
                    <h4 class="font-bold text-xs text-zinc-900 dark:text-zinc-100 truncate group-hover:text-blue-600 transition-colors">${folder.name}</h4>
                    <span class="text-[11px] text-zinc-400 font-medium">${folder.count} item${folder.count === 1 ? '' : 's'}</span>
                  </div>
                </div>
                <svg class="w-4 h-4 text-zinc-300 dark:text-zinc-600 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all shrink-0 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}

      <!-- Arquivos e Documentos -->
      <div class="space-y-3">
        <div class="text-xs font-semibold text-zinc-500 uppercase tracking-wider flex items-center justify-between">
          <span class="flex items-center gap-1.5">
            <svg class="w-3.5 h-3.5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
            Arquivos (${files.length})
          </span>
          ${currentPath.length > 0 ? `
            <span class="text-[11px] text-zinc-400 font-normal">Local: ${currentPath.join(' / ')}</span>
          ` : ''}
        </div>

        ${files.length === 0 ? `
          <div class="text-center py-12 bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl">
            <div class="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400 mx-auto mb-2 text-lg">📄</div>
            <p class="text-xs text-zinc-500 font-medium">Nenhum arquivo nesta pasta.</p>
            <p class="text-[11px] text-zinc-400 mt-0.5">Clique em "Novo Arquivo / Link" acima para adicionar.</p>
          </div>
        ` : viewMode === 'grid' ? `
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            ${files.map(doc => {
              const isLink = doc.format === 'link' || (doc.url && (doc.url.startsWith('http://') || doc.url.startsWith('https://')));
              return `
                <div class="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-2xs hover:border-blue-400 dark:hover:border-blue-600 transition-all flex flex-col justify-between group">
                  <div>
                    <div class="flex items-start justify-between gap-2 mb-2.5">
                      <div class="w-10 h-10 rounded-xl ${isLink ? 'bg-purple-50 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400' : 'bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400'} flex items-center justify-center font-bold text-xs uppercase shrink-0">
                        ${isLink ? '🔗' : (doc.format || 'doc')}
                      </div>
                      <span class="text-[10px] bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 px-2 py-0.5 rounded-md font-medium border border-zinc-200/60 dark:border-zinc-700">
                        ${doc.category || 'Geral'}
                      </span>
                    </div>

                    <h4 class="font-bold text-xs text-zinc-900 dark:text-zinc-100 truncate group-hover:text-blue-600 transition-colors" title="${doc.name}">${doc.name}</h4>
                    
                    <div class="text-[11px] text-zinc-400 mt-1.5 space-y-0.5">
                      ${doc.clientName ? `<div class="truncate">Cliente: <span class="text-zinc-700 dark:text-zinc-300 font-medium">${doc.clientName}</span></div>` : ''}
                      ${doc.projectName ? `<div class="truncate">Projeto: <span class="text-zinc-700 dark:text-zinc-300">${doc.projectName}</span></div>` : ''}
                      ${doc.notes ? `<div class="truncate text-zinc-500 italic mt-1">"${doc.notes}"</div>` : ''}
                    </div>
                  </div>

                  <div class="pt-3 mt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-[11px] text-zinc-400">
                    <span>${doc.size || '1.0 MB'} • ${formatDate(doc.uploadDate || doc.createdAt)}</span>
                    <div class="flex items-center gap-1">
                      ${isLink ? `
                        <a href="${doc.url || '#'}" target="_blank" rel="noopener noreferrer" class="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded transition-colors" title="Abrir link externo">
                          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
                        </a>
                      ` : `
                        <button data-action="preview" data-id="${doc.id}" class="p-1.5 text-zinc-400 hover:text-blue-600 rounded transition-colors" title="Visualizar">
                          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                        </button>
                        <button data-action="download" data-id="${doc.id}" class="p-1.5 text-zinc-400 hover:text-emerald-600 rounded transition-colors" title="Baixar">
                          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                        </button>
                      `}
                      <button data-action="delete" data-id="${doc.id}" class="p-1.5 text-zinc-400 hover:text-rose-600 rounded transition-colors" title="Excluir">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                      </button>
                    </div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        ` : `
          <!-- Tabela Modo Lista -->
          <div class="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-2xs">
            <div class="overflow-x-auto">
              <table class="w-full text-left text-xs text-zinc-600 dark:text-zinc-300">
                <thead class="bg-zinc-50 dark:bg-zinc-800/60 text-zinc-400 uppercase text-[10px] font-semibold border-b border-zinc-200 dark:border-zinc-800">
                  <tr>
                    <th class="py-3 px-4">Nome do Arquivo</th>
                    <th class="py-3 px-3">Categoria</th>
                    <th class="py-3 px-3">Cliente / Projeto</th>
                    <th class="py-3 px-3">Data</th>
                    <th class="py-3 px-3">Tamanho</th>
                    <th class="py-3 px-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-zinc-100 dark:divide-zinc-800/60 font-medium">
                  ${files.map(doc => {
                    const isLink = doc.format === 'link' || (doc.url && (doc.url.startsWith('http://') || doc.url.startsWith('https://')));
                    return `
                      <tr class="hover:bg-zinc-50/60 dark:hover:bg-zinc-800/40 transition-colors">
                        <td class="py-3 px-4 font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2.5">
                          <span class="w-6 h-6 rounded-md ${isLink ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'} text-[10px] font-bold flex items-center justify-center uppercase shrink-0">
                            ${isLink ? '🔗' : (doc.format || 'doc')}
                          </span>
                          <span class="truncate max-w-xs">${doc.name}</span>
                        </td>
                        <td class="py-3 px-3">
                          <span class="px-2 py-0.5 rounded text-[10px] bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                            ${doc.category || 'Geral'}
                          </span>
                        </td>
                        <td class="py-3 px-3 text-zinc-500">
                          ${doc.clientName || '—'}${doc.projectName ? ` / ${doc.projectName}` : ''}
                        </td>
                        <td class="py-3 px-3 text-zinc-400 font-mono">${formatDate(doc.uploadDate || doc.createdAt)}</td>
                        <td class="py-3 px-3 text-zinc-400">${doc.size || '1.0 MB'}</td>
                        <td class="py-3 px-4 text-right">
                          <div class="inline-flex items-center gap-1">
                            ${isLink ? `
                              <a href="${doc.url || '#'}" target="_blank" rel="noopener noreferrer" class="p-1 text-blue-600 hover:bg-blue-50 rounded" title="Abrir link">
                                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
                              </a>
                            ` : `
                              <button data-action="preview" data-id="${doc.id}" class="p-1 text-zinc-400 hover:text-blue-600 rounded" title="Visualizar">
                                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                              </button>
                              <button data-action="download" data-id="${doc.id}" class="p-1 text-zinc-400 hover:text-emerald-600 rounded" title="Baixar">
                                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                              </button>
                            `}
                            <button data-action="delete" data-id="${doc.id}" class="p-1 text-zinc-400 hover:text-rose-600 rounded" title="Excluir">
                              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
            </div>
          </div>
        `}
      </div>
    </div>
  `;

  // Attach Events
  // Folder Navigation clicks
  container.querySelectorAll('.folder-card').forEach(card => {
    card.onclick = () => {
      const folderName = card.getAttribute('data-folder-name');
      currentPath.push(folderName);
      searchQuery = '';
      renderDocumentsView(container, onNavigate);
    };
  });

  // Breadcrumbs clicks
  container.querySelectorAll('button[data-path-idx]').forEach(btn => {
    btn.onclick = () => {
      const idx = parseInt(btn.getAttribute('data-path-idx'), 10);
      if (idx === -1) {
        currentPath = [];
      } else {
        currentPath = currentPath.slice(0, idx + 1);
      }
      searchQuery = '';
      renderDocumentsView(container, onNavigate);
    };
  });

  // Search input
  const searchInput = container.querySelector('#docs-search-input');
  if (searchInput) {
    searchInput.oninput = (e) => {
      searchQuery = e.target.value;
      renderDocumentsView(container, onNavigate);
      const reInput = container.querySelector('#docs-search-input');
      if (reInput) {
        reInput.focus();
        reInput.setSelectionRange(reInput.value.length, reInput.value.length);
      }
    };
  }

  // View mode toggle
  const gridBtn = container.querySelector('#view-grid-btn');
  const listBtn = container.querySelector('#view-list-btn');
  if (gridBtn && listBtn) {
    gridBtn.onclick = () => {
      viewMode = 'grid';
      renderDocumentsView(container, onNavigate);
    };
    listBtn.onclick = () => {
      viewMode = 'list';
      renderDocumentsView(container, onNavigate);
    };
  }

  // Actions on documents
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
            <div class="p-6 text-center space-y-4">
              <div class="w-16 h-16 rounded-2xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 flex items-center justify-center font-bold text-lg mx-auto">
                ${(doc.format || 'doc').toUpperCase()}
              </div>
              <div>
                <h4 class="font-bold text-sm text-zinc-900 dark:text-zinc-100">${doc.name}</h4>
                <p class="text-xs text-zinc-400 mt-1">Categoria: ${doc.category || 'Geral'} • Tamanho: ${doc.size || '1.0 MB'}</p>
                <p class="text-xs text-zinc-500 mt-1">Vinculado a: ${doc.clientName || 'Geral'}</p>
                ${doc.notes ? `<div class="p-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl text-xs text-zinc-600 dark:text-zinc-400 text-left mt-3"><strong>Anotações:</strong> ${doc.notes}</div>` : ''}
              </div>
            </div>
          `,
          size: 'md'
        });
      } else if (action === 'download') {
        const dummyBlob = new Blob([`Arquivo: ${doc.name}\nCategoria: ${doc.category}\nCliente: ${doc.clientName || 'Geral'}\nNotas: ${doc.notes || 'Nenhuma'}`], { type: 'text/plain' });
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

  // Upload modal button
  const uploadBtn = container.querySelector('#doc-upload-btn');
  if (uploadBtn) {
    uploadBtn.onclick = () => {
      openUploadDocModal(() => renderDocumentsView(container, onNavigate));
    };
  }

  // New folder button
  const newFolderBtn = container.querySelector('#doc-new-folder-btn');
  if (newFolderBtn) {
    newFolderBtn.onclick = () => {
      openNewFolderModal(() => renderDocumentsView(container, onNavigate));
    };
  }
}

function openNewFolderModal(onSuccess) {
  const content = `
    <form id="new-folder-form" class="space-y-4">
      <div>
        <label class="block text-xs font-medium text-zinc-600 dark:text-zinc-300 mb-1">Nome da Nova Pasta *</label>
        <input required id="folder-name-input" class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs text-zinc-900 dark:text-zinc-100" placeholder="Ex: Propostas 2026, Recursos Figma, Contabilidade" />
      </div>
      <div class="flex justify-end gap-2 pt-2">
        <button type="submit" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold">Criar Pasta</button>
      </div>
    </form>
  `;

  const m = modal.open({
    title: 'Criar Nova Pasta',
    content,
    size: 'sm'
  });

  m.panel.querySelector('#new-folder-form').onsubmit = (e) => {
    e.preventDefault();
    const folderName = m.panel.querySelector('#folder-name-input').value.trim();
    if (!folderName) return;

    const state = store.getState();
    if (!state.customFolders) state.customFolders = [];
    state.customFolders.push({
      id: 'fld-' + Date.now(),
      name: folderName,
      createdAt: new Date().toISOString()
    });
    store.saveState();
    toast.success(`Pasta "${folderName}" criada com sucesso!`);
    m.close();
    if (onSuccess) onSuccess();
  };
}

function openUploadDocModal(onSuccess) {
  const { clients, projects } = store.getState();

  // If user is inside a client folder, pre-select that client
  let defaultClientId = '';
  let defaultSubfolder = '';
  if (currentPath[0] === 'Clientes' && currentPath.length >= 2) {
    const c = clients.find(cl => cl.name === currentPath[1]);
    if (c) defaultClientId = c.id;
    if (currentPath.length >= 3) {
      defaultSubfolder = currentPath[2];
    }
  }

  const content = `
    <form id="docs-upload-form" class="space-y-3.5">
      <!-- Tipo: Arquivo vs Link Externo -->
      <div>
        <label class="block text-xs font-medium text-zinc-600 dark:text-zinc-300 mb-1.5">Tipo de Registro</label>
        <div class="grid grid-cols-2 gap-2">
          <label class="flex items-center gap-2 p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 cursor-pointer has-[:checked]:border-blue-600 has-[:checked]:bg-blue-50/50 dark:has-[:checked]:bg-blue-950/40">
            <input type="radio" name="recordType" value="file" checked class="text-blue-600" />
            <span class="text-xs font-semibold text-zinc-800 dark:text-zinc-200">📁 Arquivo Local</span>
          </label>
          <label class="flex items-center gap-2 p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 cursor-pointer has-[:checked]:border-blue-600 has-[:checked]:bg-blue-50/50 dark:has-[:checked]:bg-blue-950/40">
            <input type="radio" name="recordType" value="link" class="text-blue-600" />
            <span class="text-xs font-semibold text-zinc-800 dark:text-zinc-200">🔗 Link Externo</span>
          </label>
        </div>
      </div>

      <div>
        <label class="block text-xs font-medium text-zinc-600 dark:text-zinc-300 mb-1">Nome do Documento / Arquivo *</label>
        <input required name="name" class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs text-zinc-900 dark:text-zinc-100" placeholder="Ex: Contrato_Prestacao_Nexus.pdf">
      </div>

      <div id="url-field-group" class="hidden">
        <label class="block text-xs font-medium text-zinc-600 dark:text-zinc-300 mb-1">URL / Link Externo (Figma, Drive, Notion, GitHub...)</label>
        <input name="url" class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs text-zinc-900 dark:text-zinc-100" placeholder="https://www.figma.com/file/...">
      </div>

      <div class="grid grid-cols-2 gap-2">
        <div>
          <label class="block text-xs font-medium text-zinc-600 dark:text-zinc-300 mb-1">Categoria *</label>
          <select name="category" class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs text-zinc-800 dark:text-zinc-200">
            <option value="Contratos">Contratos</option>
            <option value="Briefings">Briefings</option>
            <option value="Identidade visual">Identidade visual</option>
            <option value="Artes">Artes</option>
            <option value="Apresentações">Apresentações</option>
            <option value="Financeiro">Financeiro / Notas Fiscais</option>
            <option value="Arquivos finais">Arquivos finais</option>
            <option value="Templates">Templates & Modelos</option>
            <option value="Pessoal">Pessoal</option>
            <option value="Outros">Outros</option>
          </select>
        </div>
        <div id="format-field-group">
          <label class="block text-xs font-medium text-zinc-600 dark:text-zinc-300 mb-1">Formato</label>
          <select name="format" class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs text-zinc-800 dark:text-zinc-200">
            <option value="pdf">PDF</option>
            <option value="zip">ZIP / Arquivo</option>
            <option value="png">PNG / JPG</option>
            <option value="fig">FIG / Figma</option>
            <option value="docx">DOCX / Word</option>
          </select>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-2">
        <div>
          <label class="block text-xs font-medium text-zinc-600 dark:text-zinc-300 mb-1">Cliente Vinculado</label>
          <select name="clientId" class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs text-zinc-800 dark:text-zinc-200">
            <option value="">Nenhum (Documento Geral)</option>
            ${clients.map(c => `<option value="${c.id}" ${c.id === defaultClientId ? 'selected' : ''}>${c.name} (${c.company})</option>`).join('')}
          </select>
        </div>
        <div>
          <label class="block text-xs font-medium text-zinc-600 dark:text-zinc-300 mb-1">Projeto Vinculado</label>
          <select name="projectId" class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs text-zinc-800 dark:text-zinc-200">
            <option value="">Nenhum</option>
            ${projects.map(p => `<option value="${p.id}">${p.title}</option>`).join('')}
          </select>
        </div>
      </div>

      <div>
        <label class="block text-xs font-medium text-zinc-600 dark:text-zinc-300 mb-1">Tamanho Estimado</label>
        <input name="size" class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs text-zinc-800 dark:text-zinc-200" placeholder="Ex: 2.4 MB" value="1.8 MB">
      </div>

      <div>
        <label class="block text-xs font-medium text-zinc-600 dark:text-zinc-300 mb-1">Anotações / Descrição (Opcional)</label>
        <textarea name="notes" rows="2" class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs text-zinc-800 dark:text-zinc-200 resize-none" placeholder="Instruções de versão, tags ou links de backup..."></textarea>
      </div>

      <div class="pt-2 flex justify-end gap-2">
        <button type="submit" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition-colors">Salvar Documento</button>
      </div>
    </form>
  `;

  const m = modal.open({
    title: 'Adicionar Documento à Central',
    content,
    size: 'md'
  });

  const form = m.panel.querySelector('#docs-upload-form');
  const typeRadios = form.querySelectorAll('input[name="recordType"]');
  const urlGroup = form.querySelector('#url-field-group');
  const formatGroup = form.querySelector('#format-field-group');

  typeRadios.forEach(radio => {
    radio.onchange = () => {
      if (radio.value === 'link') {
        urlGroup.classList.remove('hidden');
        formatGroup.classList.add('hidden');
      } else {
        urlGroup.classList.add('hidden');
        formatGroup.classList.remove('hidden');
      }
    };
  });

  form.onsubmit = (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const clientId = fd.get('clientId');
    const projectId = fd.get('projectId');
    const selectedClient = clients.find(c => c.id === clientId);
    const selectedProj = projects.find(p => p.id === projectId);
    const recordType = fd.get('recordType');

    store.addDocument({
      name: fd.get('name'),
      category: fd.get('category'),
      format: recordType === 'link' ? 'link' : fd.get('format'),
      size: recordType === 'link' ? 'Link Web' : fd.get('size'),
      url: fd.get('url') || '#',
      clientId: clientId || null,
      clientName: selectedClient ? selectedClient.name : null,
      projectId: projectId || null,
      projectName: selectedProj ? selectedProj.title : null,
      notes: fd.get('notes') || '',
      subfolder: defaultSubfolder || null
    });

    store.addXP(10, 'Documento arquivado na Central');
    toast.success('Documento arquivado com sucesso na Central!');
    m.close();
    if (onSuccess) onSuccess();
  };
}
