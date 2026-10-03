import { store } from '../state/store.js';
import { modal } from '../components/Modal.js';
import { toast } from '../components/Toast.js';
import { formatDate } from '../utils/formatters.js';
import { storageService } from '../services/storageService.js';
import { renderExportButtonHtml, bindExportButton } from '../components/ExportMenu.js';

let currentPath = []; // array of path segments, e.g. ['Clientes', 'Nexus Digital', 'Contratos']
let searchQuery = '';
let viewMode = 'grid'; // 'grid' | 'list'

export function renderDocumentsView(container, onNavigate) {
  const state = store.getState();
  const { documents = [], clients = [], projects = [] } = state;

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

      if (state.customFolders) {
        state.customFolders.filter(f => !f.parentId).forEach(f => {
          subfolders.push({ name: f.name, icon: 'folder', count: 0, type: 'custom', id: f.id });
        });
      }

      files = documents.filter(d => !d.clientId && !d.folder);
    } else if (currentPath[0] === 'Clientes') {
      if (currentPath.length === 1) {
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

          return { name: sub, icon: 'subfolder', count };
        });

        files = documents.filter(d => (d.clientId === clientObj?.id || d.clientName === clientName) && !d.subfolder);
      } else if (currentPath.length === 3) {
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

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      files = documents.filter(d => 
        (d.name && d.name.toLowerCase().includes(q)) || 
        (d.category && d.category.toLowerCase().includes(q)) ||
        (d.clientName && d.clientName.toLowerCase().includes(q))
      );
      subfolders = [];
    }

    return { files, subfolders };
  }

  const { files, subfolders } = getFolderContents();

  function getFileIcon(format) {
    const f = (format || '').toLowerCase();
    if (['png', 'jpg', 'jpeg', 'webp', 'svg', 'gif'].includes(f)) {
      return { icon: '🖼️', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' };
    }
    if (f === 'pdf') {
      return { icon: '📄', color: 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300' };
    }
    if (['xls', 'xlsx', 'csv'].includes(f)) {
      return { icon: '📊', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' };
    }
    if (['doc', 'docx', 'txt'].includes(f)) {
      return { icon: '📝', color: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300' };
    }
    if (['zip', 'rar'].includes(f)) {
      return { icon: '📦', color: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300' };
    }
    if (f === 'link' || f === 'fig') {
      return { icon: '🔗', color: 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300' };
    }
    return { icon: '📁', color: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300' };
  }

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
          <p class="text-xs text-zinc-500 mt-1">Upload real de arquivos (PDF, PNG, JPG, XLSX, DOCX) com preview, download e pastas por cliente.</p>
        </div>
        <div class="flex items-center gap-2 flex-wrap">
          ${renderExportButtonHtml('docs-export-dropdown', 'Exportar')}
          <button id="doc-new-folder-btn" class="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 rounded-xl text-xs font-semibold transition-colors border border-zinc-200 dark:border-zinc-700">
            <svg class="w-4 h-4 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h4l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"/></svg>
            <span>Nova Pasta</span>
          </button>
          <button id="doc-upload-btn" class="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition-colors shadow-xs">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
            <span>+ Adicionar Documento</span>
          </button>
        </div>
      </div>

      <!-- Breadcrumbs & Barra de Navegação -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl shadow-2xs">
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

        <div class="flex items-center gap-2">
          <div class="relative">
            <input 
              id="doc-search-input" 
              type="text" 
              placeholder="Buscar arquivos ou pastas..." 
              value="${searchQuery}" 
              class="w-48 sm:w-64 pl-8 pr-3 py-1.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs focus:outline-none focus:border-blue-600 text-zinc-800 dark:text-zinc-200"
            />
            <svg class="w-4 h-4 text-zinc-400 absolute left-2.5 top-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
          </div>

          <div class="flex items-center bg-zinc-100 dark:bg-zinc-800 rounded-xl p-0.5 border border-zinc-200 dark:border-zinc-700">
            <button id="view-mode-grid-btn" class="p-1.5 rounded-lg ${viewMode === 'grid' ? 'bg-white dark:bg-zinc-700 text-blue-600 shadow-2xs' : 'text-zinc-400 hover:text-zinc-700'}">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"/></svg>
            </button>
            <button id="view-mode-list-btn" class="p-1.5 rounded-lg ${viewMode === 'list' ? 'bg-white dark:bg-zinc-700 text-blue-600 shadow-2xs' : 'text-zinc-400 hover:text-zinc-700'}">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/></svg>
            </button>
          </div>
        </div>
      </div>

      <!-- Pastas -->
      ${subfolders.length > 0 ? `
        <div>
          <h3 class="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3">Pastas</h3>
          <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            ${subfolders.map(fld => `
              <div 
                data-folder-name="${fld.name}" 
                class="folder-card p-3.5 bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl hover:border-blue-500/60 dark:hover:border-blue-500/60 transition-all cursor-pointer shadow-2xs hover:shadow-xs group flex items-center gap-3 select-none"
              >
                <div class="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform text-lg">
                  📁
                </div>
                <div class="overflow-hidden">
                  <h4 class="font-semibold text-xs text-zinc-900 dark:text-zinc-100 truncate">${fld.name}</h4>
                  <span class="text-[10px] text-zinc-400">${fld.count} ${fld.count === 1 ? 'item' : 'itens'}</span>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}

      <!-- Arquivos -->
      <div>
        <div class="flex items-center justify-between mb-3">
          <h3 class="text-xs font-bold uppercase tracking-wider text-zinc-400">Arquivos (${files.length})</h3>
        </div>

        ${files.length === 0 ? `
          <div class="p-12 text-center bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 space-y-3">
            <div class="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-xl mx-auto">
              📄
            </div>
            <p class="text-xs font-medium text-zinc-500">Nenhum arquivo encontrado nesta pasta.</p>
            <button id="empty-upload-btn" class="px-3.5 py-1.5 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 transition-colors shadow-2xs">
              + Fazer Upload de Arquivo
            </button>
          </div>
        ` : viewMode === 'grid' ? `
          <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            ${files.map(doc => {
              const fileInfo = getFileIcon(doc.format || doc.extension);
              return `
                <div class="doc-card p-4 bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl hover:border-blue-500/50 transition-all shadow-2xs group flex flex-col justify-between">
                  <div>
                    <div class="flex items-start justify-between gap-2 mb-3">
                      <div class="w-10 h-10 rounded-xl ${fileInfo.color} flex items-center justify-center text-lg shrink-0">
                        ${fileInfo.icon}
                      </div>
                      <span class="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500">
                        ${doc.format || doc.extension || 'ARQ'}
                      </span>
                    </div>

                    <h4 class="font-bold text-xs text-zinc-900 dark:text-zinc-100 line-clamp-2 leading-snug mb-1" title="${doc.name}">
                      ${doc.name}
                    </h4>
                    <div class="text-[11px] text-zinc-400 space-y-0.5">
                      <div>${doc.category} • <span class="font-semibold text-zinc-600 dark:text-zinc-300">${doc.size || '1 MB'}</span></div>
                      ${doc.clientName ? `<div class="text-blue-600 dark:text-blue-400 font-medium truncate">Cliente: ${doc.clientName}</div>` : ''}
                      ${doc.projectName ? `<div class="truncate">Proj: ${doc.projectName}</div>` : ''}
                    </div>
                  </div>

                  <div class="flex items-center justify-between pt-3 mt-3 border-t border-zinc-100 dark:border-zinc-800 text-xs">
                    <span class="text-[10px] text-zinc-400">${formatDate(doc.uploadDate || doc.createdAt)}</span>
                    <div class="flex items-center gap-1">
                      <button data-action="preview" data-id="${doc.id}" class="p-1.5 text-zinc-400 hover:text-blue-600 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors" title="Visualizar">
                        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                      </button>
                      <button data-action="download" data-id="${doc.id}" class="p-1.5 text-zinc-400 hover:text-emerald-600 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors" title="Baixar">
                        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                      </button>
                      <button data-action="delete" data-id="${doc.id}" class="p-1.5 text-zinc-400 hover:text-rose-600 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors" title="Excluir">
                        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                      </button>
                    </div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        ` : `
          <!-- Visualização em Tabela -->
          <div class="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-2xs">
            <div class="overflow-x-auto">
              <table class="w-full text-left text-xs text-zinc-600 dark:text-zinc-400">
                <thead class="bg-zinc-50 dark:bg-zinc-850 text-zinc-900 dark:text-zinc-200 border-b border-zinc-200 dark:border-zinc-800 font-semibold">
                  <tr>
                    <th class="p-3.5">Nome do Arquivo</th>
                    <th class="p-3.5">Categoria</th>
                    <th class="p-3.5">Cliente / Projeto</th>
                    <th class="p-3.5">Tamanho</th>
                    <th class="p-3.5">Data</th>
                    <th class="p-3.5 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-zinc-100 dark:divide-zinc-800">
                  ${files.map(doc => {
                    const fileInfo = getFileIcon(doc.format || doc.extension);
                    return `
                      <tr class="hover:bg-zinc-50/70 dark:hover:bg-zinc-850/50 transition-colors">
                        <td class="p-3.5 font-bold text-zinc-900 dark:text-zinc-100">
                          <div class="flex items-center gap-2">
                            <span class="text-base">${fileInfo.icon}</span>
                            <span class="truncate max-w-xs">${doc.name}</span>
                          </div>
                        </td>
                        <td class="p-3.5">${doc.category}</td>
                        <td class="p-3.5 text-zinc-500">${doc.clientName || doc.projectName || '-'}</td>
                        <td class="p-3.5 font-medium">${doc.size || '1 MB'}</td>
                        <td class="p-3.5">${formatDate(doc.uploadDate || doc.createdAt)}</td>
                        <td class="p-3.5 text-right">
                          <div class="flex items-center justify-end gap-1">
                            <button data-action="preview" data-id="${doc.id}" class="p-1.5 text-zinc-400 hover:text-blue-600 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800" title="Visualizar">
                              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                            </button>
                            <button data-action="download" data-id="${doc.id}" class="p-1.5 text-zinc-400 hover:text-emerald-600 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800" title="Baixar">
                              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                            </button>
                            <button data-action="delete" data-id="${doc.id}" class="p-1.5 text-zinc-400 hover:text-rose-600 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800" title="Excluir">
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

  // Breadcrumbs navigation
  container.querySelectorAll('button[data-path-idx]').forEach(btn => {
    btn.onclick = () => {
      const idx = parseInt(btn.getAttribute('data-path-idx'));
      if (idx === -1) {
        currentPath = [];
      } else {
        currentPath = currentPath.slice(0, idx + 1);
      }
      renderDocumentsView(container, onNavigate);
    };
  });

  // Folder click navigation
  container.querySelectorAll('.folder-card').forEach(card => {
    card.onclick = () => {
      const folderName = card.getAttribute('data-folder-name');
      currentPath.push(folderName);
      renderDocumentsView(container, onNavigate);
    };
  });

  // Search input
  const searchInput = container.querySelector('#doc-search-input');
  if (searchInput) {
    searchInput.oninput = (e) => {
      searchQuery = e.target.value;
      renderDocumentsView(container, onNavigate);
    };
  }

  // View mode toggles
  const gridBtn = container.querySelector('#view-mode-grid-btn');
  const listBtn = container.querySelector('#view-mode-list-btn');
  if (gridBtn) gridBtn.onclick = () => { viewMode = 'grid'; renderDocumentsView(container, onNavigate); };
  if (listBtn) listBtn.onclick = () => { viewMode = 'list'; renderDocumentsView(container, onNavigate); };

  // Actions on documents
  container.querySelectorAll('button[data-action]').forEach(btn => {
    btn.onclick = async () => {
      const action = btn.getAttribute('data-action');
      const id = btn.getAttribute('data-id');
      const doc = documents.find(d => d.id === id);
      if (!doc) return;

      if (action === 'preview') {
        const objectUrl = await storageService.getObjectUrl(id);
        const ext = (doc.extension || doc.format || '').toLowerCase();
        const isImage = ['png', 'jpg', 'jpeg', 'webp', 'svg', 'gif'].includes(ext);
        const isPdf = ext === 'pdf';

        modal.open({
          title: `Visualização: ${doc.name}`,
          content: `
            <div class="space-y-4">
              <div class="flex items-center justify-between text-xs text-zinc-500 pb-2 border-b border-zinc-200 dark:border-zinc-800">
                <span>Categoria: <strong>${doc.category || 'Geral'}</strong> • Tamanho: <strong>${doc.size || '1.0 MB'}</strong></span>
                <span>Data: ${formatDate(doc.uploadDate || doc.createdAt)}</span>
              </div>

              ${isImage && objectUrl ? `
                <div class="flex items-center justify-center p-2 bg-zinc-50 dark:bg-zinc-850 rounded-xl overflow-hidden max-h-[500px]">
                  <img src="${objectUrl}" alt="${doc.name}" class="max-w-full max-h-[480px] object-contain rounded-lg shadow-sm" />
                </div>
              ` : isPdf && objectUrl ? `
                <div class="w-full h-[500px] bg-zinc-100 rounded-xl overflow-hidden">
                  <iframe src="${objectUrl}#toolbar=0" class="w-full h-full border-0"></iframe>
                </div>
              ` : `
                <div class="p-8 text-center bg-zinc-50 dark:bg-zinc-850 rounded-2xl border border-zinc-200 dark:border-zinc-800 space-y-3">
                  <div class="w-16 h-16 rounded-2xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 flex items-center justify-center font-bold text-2xl mx-auto">
                    ${(doc.extension || doc.format || 'DOC').toUpperCase()}
                  </div>
                  <div>
                    <h4 class="font-bold text-sm text-zinc-900 dark:text-zinc-100">${doc.name}</h4>
                    <p class="text-xs text-zinc-400 mt-1">Este formato pode ser aberto após o download.</p>
                  </div>
                  <button id="modal-preview-download-btn" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs">
                    Baixar Arquivo Agora
                  </button>
                </div>
              `}

              ${doc.notes ? `<div class="p-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl text-xs text-zinc-600 dark:text-zinc-400"><strong>Anotações:</strong> ${doc.notes}</div>` : ''}
            </div>
          `,
          size: isPdf || isImage ? 'lg' : 'md'
        });

        const previewDlBtn = document.getElementById('modal-preview-download-btn');
        if (previewDlBtn) {
          previewDlBtn.onclick = async () => {
            await storageService.downloadFile(doc.id, doc.name);
            toast.success(`Download de ${doc.name} concluído!`);
          };
        }
      } else if (action === 'download') {
        try {
          await storageService.downloadFile(id, doc.name);
          toast.success(`Download de ${doc.name} iniciado!`);
        } catch (e) {
          toast.error('Erro ao baixar arquivo do armazenamento local.');
        }
      } else if (action === 'delete') {
        if (confirm(`Deseja remover o arquivo "${doc.name}" permanentemente?`)) {
          await storageService.deleteFile(id);
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

  const emptyUploadBtn = container.querySelector('#empty-upload-btn');
  if (emptyUploadBtn) {
    emptyUploadBtn.onclick = () => {
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

  // Universal Export Dropdown
  bindExportButton(container, 'docs-export-dropdown', () => {
    const headers = ['Nome', 'Categoria', 'Formato', 'Tamanho', 'Cliente', 'Projeto', 'Data de Upload'];
    const rows = files.map(d => [
      d.name,
      d.category || 'Geral',
      (d.extension || d.format || 'bin').toUpperCase(),
      d.size || '1 MB',
      d.clientName || '-',
      d.projectName || '-',
      formatDate(d.uploadDate || d.createdAt)
    ]);

    const summary = [
      { label: 'Total de Arquivos Listados', value: files.length },
      { label: 'Total Geral na Central', value: documents.length },
      { label: 'Pasta Atual', value: currentPath.join(' / ') || 'Início' }
    ];

    return {
      filename: `documentos_${new Date().toISOString().split('T')[0]}`,
      title: 'Inventário da Central de Documentos',
      headers,
      rows,
      summary,
      filters: `Caminho: ${currentPath.join(' / ') || 'Início'}`
    };
  });
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

// Modal de Upload com seletor real do SO
function openUploadDocModal(onSuccess) {
  const { clients, projects, deliveries = [] } = store.getState();

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
    <form id="docs-upload-form" class="space-y-4">
      <!-- Seletor de Arquivo Real do SO -->
      <div>
        <label class="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">Selecionar Arquivo do Dispositivo *</label>
        <div id="dropzone-area" class="border-2 border-dashed border-zinc-300 dark:border-zinc-700 hover:border-blue-600 dark:hover:border-blue-500 rounded-2xl p-5 text-center cursor-pointer transition-colors bg-zinc-50/60 dark:bg-zinc-850/50">
          <input type="file" id="real-file-input" accept=".jpg,.jpeg,.png,.webp,.pdf,.xls,.xlsx,.csv,.doc,.docx" class="hidden" />
          <div id="dropzone-prompt">
            <svg class="w-8 h-8 text-blue-600 dark:text-blue-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/></svg>
            <span class="text-xs font-bold text-zinc-900 dark:text-zinc-100 block">Clique para escolher do computador ou dispositivo</span>
            <span class="text-[11px] text-zinc-400 block mt-0.5">Suporta PDF, JPG, PNG, WEBP, XLSX, CSV, DOCX</span>
          </div>
          <div id="dropzone-file-info" class="hidden text-left p-2.5 bg-blue-50 dark:bg-blue-950/40 rounded-xl border border-blue-200 dark:border-blue-800">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2 overflow-hidden">
                <span class="text-lg" id="selected-file-icon">📄</span>
                <div class="overflow-hidden">
                  <div class="font-bold text-xs text-zinc-900 dark:text-zinc-100 truncate" id="selected-file-name">arquivo.pdf</div>
                  <div class="text-[10px] text-zinc-400" id="selected-file-size">0 KB</div>
                </div>
              </div>
              <button type="button" id="btn-remove-selected-file" class="p-1 text-zinc-400 hover:text-rose-600">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div>
        <label class="block text-xs font-medium text-zinc-600 dark:text-zinc-300 mb-1">Nome de Exibição do Documento *</label>
        <input required id="doc-display-name" name="name" class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs text-zinc-900 dark:text-zinc-100" placeholder="Ex: Contrato de Prestação de Serviços.pdf">
      </div>

      <div class="grid grid-cols-2 gap-2">
        <div>
          <label class="block text-xs font-medium text-zinc-600 dark:text-zinc-300 mb-1">Categoria / Pasta *</label>
          <select name="category" class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs text-zinc-800 dark:text-zinc-200">
            <option value="Contratos">Contratos</option>
            <option value="Briefings">Briefings</option>
            <option value="Identidade visual">Identidade visual</option>
            <option value="Artes">Artes</option>
            <option value="Apresentações">Apresentações</option>
            <option value="Financeiro">Financeiro / Comprovantes</option>
            <option value="Arquivos finais">Arquivos finais</option>
            <option value="Referência">Referência & Inspiração</option>
            <option value="Templates">Templates & Modelos</option>
            <option value="Outros" selected>Outros</option>
          </select>
        </div>
        <div>
          <label class="block text-xs font-medium text-zinc-600 dark:text-zinc-300 mb-1">Cliente Vinculado</label>
          <select name="clientId" class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs text-zinc-800 dark:text-zinc-200">
            <option value="">Nenhum (Documento Geral)</option>
            ${clients.map(c => `<option value="${c.id}" ${c.id === defaultClientId ? 'selected' : ''}>${c.name}</option>`).join('')}
          </select>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-2">
        <div>
          <label class="block text-xs font-medium text-zinc-600 dark:text-zinc-300 mb-1">Projeto Vinculado</label>
          <select name="projectId" class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs text-zinc-800 dark:text-zinc-200">
            <option value="">Nenhum</option>
            ${projects.map(p => `<option value="${p.id}">${p.title}</option>`).join('')}
          </select>
        </div>
        <div>
          <label class="block text-xs font-medium text-zinc-600 dark:text-zinc-300 mb-1">Entrega Vinculada</label>
          <select name="deliveryId" class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs text-zinc-800 dark:text-zinc-200">
            <option value="">Nenhuma</option>
            ${deliveries.map(d => `<option value="${d.id}">${d.title}</option>`).join('')}
          </select>
        </div>
      </div>

      <div>
        <label class="block text-xs font-medium text-zinc-600 dark:text-zinc-300 mb-1">Anotações / Descrição (Opcional)</label>
        <textarea name="notes" rows="2" class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs text-zinc-800 dark:text-zinc-200 resize-none" placeholder="Detalhes da versão ou observações..."></textarea>
      </div>

      <div class="pt-2 flex justify-end gap-2">
        <button type="submit" id="btn-submit-upload" class="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition-colors">
          Salvar Arquivo
        </button>
      </div>
    </form>
  `;

  const m = modal.open({
    title: 'Adicionar Documento à Central',
    content,
    size: 'md'
  });

  const form = m.panel.querySelector('#docs-upload-form');
  const dropzoneArea = form.querySelector('#dropzone-area');
  const fileInput = form.querySelector('#real-file-input');
  const promptEl = form.querySelector('#dropzone-prompt');
  const infoEl = form.querySelector('#dropzone-file-info');
  const nameInput = form.querySelector('#doc-display-name');
  const fileNameEl = form.querySelector('#selected-file-name');
  const fileSizeEl = form.querySelector('#selected-file-size');
  const removeBtn = form.querySelector('#btn-remove-selected-file');

  let selectedRealFile = null;

  dropzoneArea.onclick = (e) => {
    if (e.target !== removeBtn && !removeBtn.contains(e.target)) {
      fileInput.click();
    }
  };

  fileInput.onchange = () => {
    if (fileInput.files && fileInput.files[0]) {
      selectedRealFile = fileInput.files[0];
      nameInput.value = selectedRealFile.name;
      fileNameEl.textContent = selectedRealFile.name;
      fileSizeEl.textContent = storageService.formatBytes(selectedRealFile.size);
      promptEl.classList.add('hidden');
      infoEl.classList.remove('hidden');
    }
  };

  removeBtn.onclick = (e) => {
    e.stopPropagation();
    selectedRealFile = null;
    fileInput.value = '';
    promptEl.classList.remove('hidden');
    infoEl.classList.add('hidden');
    nameInput.value = '';
  };

  form.onsubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const clientId = fd.get('clientId');
    const projectId = fd.get('projectId');
    const deliveryId = fd.get('deliveryId');
    const selectedClient = clients.find(c => c.id === clientId);
    const selectedProj = projects.find(p => p.id === projectId);
    const displayName = fd.get('name').trim();

    if (!selectedRealFile) {
      toast.error('Por favor, selecione um arquivo do computador ou dispositivo.');
      return;
    }

    try {
      const savedMeta = await storageService.saveFile(selectedRealFile, {
        userId: store.currentUserId,
        name: displayName,
        category: fd.get('category'),
        clientId: clientId || null,
        clientName: selectedClient ? selectedClient.name : null,
        projectId: projectId || null,
        projectName: selectedProj ? selectedProj.title : null,
        deliveryId: deliveryId || null,
        notes: fd.get('notes') || '',
        subfolder: defaultSubfolder || null
      });

      store.addDocument({
        id: savedMeta.id,
        name: savedMeta.name,
        category: savedMeta.category,
        format: savedMeta.extension,
        extension: savedMeta.extension,
        size: savedMeta.size,
        clientId: savedMeta.clientId,
        clientName: savedMeta.clientName,
        projectId: savedMeta.projectId,
        projectName: savedMeta.projectName,
        deliveryId: savedMeta.deliveryId,
        notes: savedMeta.notes,
        subfolder: savedMeta.subfolder,
        uploadDate: new Date().toISOString().split('T')[0]
      });

      store.addXP(10, 'Documento arquivado com upload real');
      toast.success('Documento carregado e salvo com sucesso!');
      m.close();
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error('Erro ao fazer upload:', err);
      toast.error('Falha ao salvar arquivo no armazenamento local.');
    }
  };
}
