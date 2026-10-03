// ========================================================
// DELIVERIES VIEW (MÓDULO: ENTREGAS & OPERAÇÕES)
// Sistema operacional estilo Trello integrado a Projetos, Clientes e Documentos
// ========================================================

import { store } from '../state/store.js';
import { toast } from '../components/Toast.js';
import { modal } from '../components/Modal.js';
import { formatDate } from '../utils/formatters.js';
import { storageService } from '../services/storageService.js';
import { renderExportButtonHtml, bindExportButton } from '../components/ExportMenu.js';

// Estado local de filtros e visualização
const deliveryFilters = {
  viewMode: 'kanban', // 'kanban' | 'list'
  search: '',
  clientId: 'all',
  projectId: 'all',
  status: 'all',
  priority: 'all',
  assignee: 'all',
  dueDate: 'all', // 'all', 'overdue', 'today', 'week'
  tag: 'all'
};

export function renderDeliveriesView(container, onNavigate) {
  const targetContainer = container || document.getElementById('main-view-container');
  if (!targetContainer) return;

  const deliveries = store.getState().deliveries || [];
  const columns = store.getState().deliveryColumns || [];
  const clients = store.getState().clients || [];
  const projects = store.getState().projects || [];
  const tags = store.getState().deliveryTags || [];
  const metrics = store.getDeliveryMetrics();

  // Filtragem
  const filtered = deliveries.filter(d => {
    // Busca
    if (deliveryFilters.search) {
      const q = deliveryFilters.search.toLowerCase();
      const matchTitle = (d.title || '').toLowerCase().includes(q);
      const matchClient = (d.clientName || '').toLowerCase().includes(q);
      const matchProject = (d.projectName || '').toLowerCase().includes(q);
      const matchDesc = (d.description || '').toLowerCase().includes(q);
      const matchTags = (d.tags || []).some(t => (t.name || '').toLowerCase().includes(q));
      if (!matchTitle && !matchClient && !matchProject && !matchDesc && !matchTags) return false;
    }

    // Cliente
    if (deliveryFilters.clientId !== 'all' && d.clientId !== deliveryFilters.clientId) return false;

    // Projeto
    if (deliveryFilters.projectId !== 'all' && d.projectId !== deliveryFilters.projectId) return false;

    // Status
    if (deliveryFilters.status !== 'all' && d.status !== deliveryFilters.status) return false;

    // Prioridade
    if (deliveryFilters.priority !== 'all' && d.priority !== deliveryFilters.priority) return false;

    // Responsável
    if (deliveryFilters.assignee !== 'all' && d.assignee !== deliveryFilters.assignee) return false;

    // Tags
    if (deliveryFilters.tag !== 'all') {
      const hasTag = (d.tags || []).some(t => t.name === deliveryFilters.tag || t.id === deliveryFilters.tag);
      if (!hasTag) return false;
    }

    // Prazo
    if (deliveryFilters.dueDate !== 'all' && d.dueDate) {
      const today = new Date().toISOString().split('T')[0];
      if (deliveryFilters.dueDate === 'overdue') {
        if (!(d.dueDate < today && d.status !== 'entregue')) return false;
      } else if (deliveryFilters.dueDate === 'today') {
        if (d.dueDate !== today) return false;
      } else if (deliveryFilters.dueDate === 'week') {
        const nextWeek = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];
        if (!(d.dueDate >= today && d.dueDate <= nextWeek)) return false;
      }
    }

    return true;
  });

  targetContainer.innerHTML = `
    <div class="space-y-6">
      <!-- HEADER DO MÓDULO -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-5">
        <div>
          <div class="flex items-center gap-3">
            <h1 class="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">Entregas & Operações</h1>
            <span class="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200/50 dark:border-blue-800/40">
              ${deliveries.length} demandas
            </span>
          </div>
          <p class="text-xs text-zinc-500 mt-1">
            Central operacional ágil para organizar tarefas, prazos e entregáveis de clientes com Kanban e automações.
          </p>
        </div>

        <div class="flex items-center gap-2.5 flex-wrap">
          <!-- Toggle Visualização Kanban / Lista -->
          <div class="flex items-center bg-zinc-100 dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 p-0.5 shadow-2xs">
            <button id="btn-view-kanban" class="px-3 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 ${deliveryFilters.viewMode === 'kanban' ? 'bg-white dark:bg-zinc-700 text-blue-600 shadow-2xs font-semibold' : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'}">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"/></svg>
              <span>Kanban</span>
            </button>
            <button id="btn-view-list" class="px-3 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 ${deliveryFilters.viewMode === 'list' ? 'bg-white dark:bg-zinc-700 text-blue-600 shadow-2xs font-semibold' : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'}">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/></svg>
              <span>Lista</span>
            </button>
          </div>

          ${renderExportButtonHtml('deliveries-export-dropdown', 'Exportar')}

          <button id="btn-manage-tags" class="px-3 py-1.5 text-xs font-medium border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-xl transition-colors flex items-center gap-1.5 shadow-2xs">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"/></svg>
            <span>Tags</span>
          </button>

          <button id="btn-new-delivery" class="px-4 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all shadow-xs flex items-center gap-1.5 active:scale-95">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
            <span>Nova Entrega</span>
          </button>
        </div>
      </div>

      <!-- KPI METRICS SUMMARY -->
      <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div class="p-3.5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-2xs">
          <span class="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider block">Total</span>
          <div class="text-xl font-bold text-zinc-900 dark:text-zinc-100 mt-1">${metrics.total}</div>
        </div>
        <div class="p-3.5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-2xs">
          <span class="text-[10px] font-semibold text-amber-500 uppercase tracking-wider block">Em Andamento</span>
          <div class="text-xl font-bold text-amber-600 dark:text-amber-400 mt-1">${metrics.inProgress}</div>
        </div>
        <div class="p-3.5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-2xs">
          <span class="text-[10px] font-semibold text-purple-500 uppercase tracking-wider block">Em Revisão</span>
          <div class="text-xl font-bold text-purple-600 dark:text-purple-400 mt-1">${metrics.inReview}</div>
        </div>
        <div class="p-3.5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-2xs">
          <span class="text-[10px] font-semibold text-emerald-500 uppercase tracking-wider block">Entregues</span>
          <div class="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">${metrics.completed}</div>
        </div>
        <div class="p-3.5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-2xs">
          <span class="text-[10px] font-semibold text-rose-500 uppercase tracking-wider block">Atrasadas</span>
          <div class="text-xl font-bold text-rose-600 dark:text-rose-400 mt-1">${metrics.overdue}</div>
        </div>
        <div class="p-3.5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-2xs">
          <span class="text-[10px] font-semibold text-blue-600 uppercase tracking-wider block">Conclusão</span>
          <div class="text-xl font-bold text-blue-600 dark:text-blue-400 mt-1">${metrics.completionRate}%</div>
        </div>
      </div>

      <!-- BARRA DE PESQUISA E FILTROS -->
      <div class="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl p-3.5 shadow-2xs space-y-3">
        <div class="flex flex-col md:flex-row gap-2.5">
          <!-- Input Busca -->
          <div class="relative flex-1">
            <svg class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
            <input 
              type="text" 
              id="delivery-search-input" 
              placeholder="Buscar por entrega, cliente, projeto, tags ou descrição..." 
              value="${deliveryFilters.search}"
              class="w-full pl-9 pr-3 py-1.5 text-xs bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-600 text-zinc-900 dark:text-zinc-100"
            />
            ${deliveryFilters.search ? `
              <button id="btn-clear-search" class="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 text-xs">
                &times;
              </button>
            ` : ''}
          </div>

          <!-- Filtro Cliente -->
          <select id="filter-delivery-client" class="text-xs bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-xl px-2.5 py-1.5 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-blue-600">
            <option value="all" ${deliveryFilters.clientId === 'all' ? 'selected' : ''}>Todos os Clientes</option>
            ${clients.map(c => `<option value="${c.id}" ${deliveryFilters.clientId === c.id ? 'selected' : ''}>${c.name}</option>`).join('')}
          </select>

          <!-- Filtro Projeto -->
          <select id="filter-delivery-project" class="text-xs bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-xl px-2.5 py-1.5 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-blue-600">
            <option value="all" ${deliveryFilters.projectId === 'all' ? 'selected' : ''}>Todos os Projetos</option>
            ${projects.map(p => `<option value="${p.id}" ${deliveryFilters.projectId === p.id ? 'selected' : ''}>${p.title}</option>`).join('')}
          </select>

          <!-- Filtro Prioridade -->
          <select id="filter-delivery-priority" class="text-xs bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-xl px-2.5 py-1.5 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-blue-600">
            <option value="all" ${deliveryFilters.priority === 'all' ? 'selected' : ''}>Prioridades (Todas)</option>
            <option value="urgente" ${deliveryFilters.priority === 'urgente' ? 'selected' : ''}>Urgente</option>
            <option value="alta" ${deliveryFilters.priority === 'alta' ? 'selected' : ''}>Alta</option>
            <option value="media" ${deliveryFilters.priority === 'media' ? 'selected' : ''}>Média</option>
            <option value="baixa" ${deliveryFilters.priority === 'baixa' ? 'selected' : ''}>Baixa</option>
          </select>

          <!-- Filtro Prazo -->
          <select id="filter-delivery-due" class="text-xs bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-xl px-2.5 py-1.5 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-blue-600">
            <option value="all" ${deliveryFilters.dueDate === 'all' ? 'selected' : ''}>Prazos (Todos)</option>
            <option value="overdue" ${deliveryFilters.dueDate === 'overdue' ? 'selected' : ''}>Atrasados</option>
            <option value="today" ${deliveryFilters.dueDate === 'today' ? 'selected' : ''}>Vencendo Hoje</option>
            <option value="week" ${deliveryFilters.dueDate === 'week' ? 'selected' : ''}>Próximos 7 Dias</option>
          </select>

          <!-- Filtro Tag -->
          <select id="filter-delivery-tag" class="text-xs bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-xl px-2.5 py-1.5 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-blue-600">
            <option value="all" ${deliveryFilters.tag === 'all' ? 'selected' : ''}>Todas as Tags</option>
            ${tags.map(t => `<option value="${t.name}" ${deliveryFilters.tag === t.name ? 'selected' : ''}>${t.name}</option>`).join('')}
          </select>
        </div>
      </div>

      <!-- ÁREA DE CONTEÚDO: KANBAN OU LISTA -->
      <div id="deliveries-content-area">
        ${deliveryFilters.viewMode === 'kanban' 
          ? renderDeliveriesKanban(filtered, columns)
          : renderDeliveriesList(filtered)
        }
      </div>
    </div>
  `;

  setupDeliveriesEvents(targetContainer, onNavigate);
}

// ----------------------------------------------------
// RENDER KANBAN
// ----------------------------------------------------
function renderDeliveriesKanban(deliveries, columns) {
  return `
    <div class="flex gap-4 overflow-x-auto pb-6 pt-1 items-start min-h-[620px] custom-scrollbar" id="kanban-columns-container">
      ${columns.map(col => {
        const colDeliveries = deliveries.filter(d => d.status === col.id);
        return `
          <div 
            class="kanban-column flex-shrink-0 w-80 bg-zinc-100/70 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl p-3 flex flex-col max-h-[82vh]"
            data-column-id="${col.id}"
          >
            <!-- CABEÇALHO DA COLUNA -->
            <div class="flex items-center justify-between pb-3 px-1 border-b border-zinc-200/60 dark:border-zinc-800/60 mb-3">
              <div class="flex items-center gap-2">
                <span class="w-2.5 h-2.5 rounded-full" style="background-color: ${col.color || '#0000FF'}"></span>
                <h3 class="font-bold text-xs text-zinc-900 dark:text-zinc-100 tracking-wide uppercase">${col.title}</h3>
                <span class="px-2 py-0.5 text-[11px] font-bold rounded-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300">
                  ${colDeliveries.length}
                </span>
              </div>

              <div class="flex items-center gap-1">
                <button 
                  class="btn-add-to-column p-1 text-zinc-400 hover:text-blue-600 rounded-lg hover:bg-white dark:hover:bg-zinc-800 transition-colors"
                  data-column-id="${col.id}"
                  title="Adicionar entrega nesta coluna"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
                </button>
                <button 
                  class="btn-col-options p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-lg hover:bg-white dark:hover:bg-zinc-800 transition-colors"
                  data-column-id="${col.id}"
                  data-column-title="${col.title}"
                  title="Opções da coluna"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01"/></svg>
                </button>
              </div>
            </div>

            <!-- CONTAINER DE CARDS DRAGGABLE -->
            <div 
              class="kanban-cards-dropzone flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar min-h-[140px]"
              data-column-id="${col.id}"
            >
              ${colDeliveries.length === 0 ? `
                <div class="h-28 border border-dashed border-zinc-300 dark:border-zinc-700 rounded-xl flex flex-col items-center justify-center text-center p-3 text-zinc-400">
                  <svg class="w-6 h-6 mb-1 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>
                  <p class="text-xs">Nenhuma entrega aqui</p>
                  <button class="mt-1 text-[11px] text-blue-600 dark:text-blue-400 hover:underline btn-add-to-column" data-column-id="${col.id}">+ Criar</button>
                </div>
              ` : colDeliveries.map(delivery => renderDeliveryCard(delivery)).join('')}
            </div>
          </div>
        `;
      }).join('')}

      <!-- BOTÃO ADICIONAR COLUNA -->
      <div class="flex-shrink-0 w-72">
        <button 
          id="btn-add-kanban-column"
          class="w-full py-3.5 px-4 border border-dashed border-zinc-300 dark:border-zinc-700 hover:border-blue-600 text-zinc-500 hover:text-blue-600 rounded-2xl flex items-center justify-center gap-2 text-xs font-semibold bg-white/50 dark:bg-zinc-900/40 hover:bg-blue-50/50 dark:hover:bg-blue-950/20 transition-all shadow-2xs"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
          <span>Adicionar nova coluna</span>
        </button>
      </div>
    </div>
  `;
}

// ----------------------------------------------------
// RENDER DELIVERY CARD (KANBAN)
// ----------------------------------------------------
function renderDeliveryCard(d) {
  const checklist = d.checklist || [];
  const completedChecks = checklist.filter(c => c.completed).length;
  const checklistPercent = checklist.length > 0 ? Math.round((completedChecks / checklist.length) * 100) : 0;
  
  const filesCount = (d.files || []).length;
  const commentsCount = (d.comments || []).length;

  // Prioridade color badge
  let priorityBadge = '';
  switch (d.priority) {
    case 'urgente':
      priorityBadge = '<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400">URGENTE</span>';
      break;
    case 'alta':
      priorityBadge = '<span class="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-400">ALTA</span>';
      break;
    case 'media':
      priorityBadge = '<span class="px-2 py-0.5 rounded text-[10px] font-medium bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-400">MÉDIA</span>';
      break;
    default:
      priorityBadge = '<span class="px-2 py-0.5 rounded text-[10px] font-medium bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">BAIXA</span>';
      break;
  }

  // Prazo format
  let dueBadge = '';
  if (d.dueDate) {
    const today = new Date().toISOString().split('T')[0];
    const isOverdue = d.dueDate < today && d.status !== 'entregue';
    const isToday = d.dueDate === today;
    const dateFormatted = d.dueDate.split('-').reverse().slice(0, 2).join('/');
    
    if (isOverdue) {
      dueBadge = `<span class="inline-flex items-center gap-1 text-[11px] text-rose-600 dark:text-rose-400 font-semibold" title="Atrasado: ${d.dueDate}"><svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg> ${dateFormatted}</span>`;
    } else if (isToday) {
      dueBadge = `<span class="inline-flex items-center gap-1 text-[11px] text-amber-600 dark:text-amber-400 font-semibold" title="Vence hoje"><svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg> Hoje</span>`;
    } else {
      dueBadge = `<span class="inline-flex items-center gap-1 text-[11px] text-zinc-400" title="Prazo: ${d.dueDate}"><svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg> ${dateFormatted}</span>`;
    }
  }

  return `
    <div 
      class="delivery-card bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 hover:border-blue-500/50 rounded-xl p-3.5 shadow-2xs hover:shadow-md transition-all cursor-grab active:cursor-grabbing group relative select-none"
      draggable="true"
      data-delivery-id="${d.id}"
    >
      <!-- CAPA SE EXISTIR -->
      ${d.coverImage ? `
        <div class="w-full h-24 mb-3 rounded-lg overflow-hidden relative border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-800">
          <img src="${d.coverImage}" alt="Capa" class="w-full h-full object-cover">
        </div>
      ` : ''}

      <!-- BADGES: PRIORIDADE & TAGS -->
      <div class="flex items-center justify-between gap-1 mb-2 flex-wrap">
        <div class="flex items-center gap-1.5 flex-wrap">
          ${priorityBadge}
          ${(d.tags || []).slice(0, 2).map(tag => `
            <span class="px-2 py-0.5 rounded text-[10px] font-medium border" style="background-color: ${tag.color ? tag.color + '15' : '#0000FF15'}; color: ${tag.color || '#0000FF'}; border-color: ${tag.color ? tag.color + '40' : '#0000FF40'}">
              ${tag.name}
            </span>
          `).join('')}
          ${(d.tags || []).length > 2 ? `
            <span class="text-[10px] text-zinc-400 font-medium">+${(d.tags || []).length - 2}</span>
          ` : ''}
        </div>

        <button 
          class="btn-delivery-card-menu opacity-0 group-hover:opacity-100 p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-opacity"
          data-delivery-id="${d.id}"
          title="Opções rápidas"
        >
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01"/></svg>
        </button>
      </div>

      <!-- TÍTULO DA ENTREGA -->
      <h4 class="font-semibold text-xs text-zinc-900 dark:text-zinc-100 leading-snug hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer btn-open-delivery-detail" data-delivery-id="${d.id}">
        ${d.title}
      </h4>

      <!-- CLIENTE & PROJETO -->
      ${(d.clientName || d.projectName) ? `
        <div class="mt-2 flex items-center gap-1.5 text-[11px] text-zinc-600 dark:text-zinc-400 flex-wrap">
          ${d.clientName ? `
            <span class="inline-flex items-center gap-1 font-medium bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-[10px]">
              <svg class="w-3 h-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
              ${d.clientName}
            </span>
          ` : ''}
          ${d.projectName ? `
            <span class="inline-flex items-center gap-1 text-[10px] text-zinc-400 truncate max-w-[140px]" title="${d.projectName}">
              <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/></svg>
              ${d.projectName}
            </span>
          ` : ''}
        </div>
      ` : ''}

      <!-- CHECKLIST PROGRESS (SE HOUVER) -->
      ${checklist.length > 0 ? `
        <div class="mt-3">
          <div class="flex items-center justify-between text-[10px] text-zinc-400 mb-1">
            <span class="flex items-center gap-1 font-medium">
              <svg class="w-3 h-3 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/></svg>
              Checklist: ${completedChecks}/${checklist.length}
            </span>
            <span class="font-semibold">${checklistPercent}%</span>
          </div>
          <div class="w-full bg-zinc-200 dark:bg-zinc-700 h-1.5 rounded-full overflow-hidden">
            <div class="h-full bg-blue-600 rounded-full transition-all" style="width: ${checklistPercent}%"></div>
          </div>
        </div>
      ` : ''}

      <!-- RODAPÉ DO CARD: METADADOS & ASSIGNEE -->
      <div class="mt-3.5 pt-2.5 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between gap-2 text-zinc-400">
        <div class="flex items-center gap-3">
          ${dueBadge}
          ${filesCount > 0 ? `
            <span class="inline-flex items-center gap-0.5 text-[11px] text-zinc-400" title="${filesCount} anexos">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"/></svg> ${filesCount}
            </span>
          ` : ''}
          ${commentsCount > 0 ? `
            <span class="inline-flex items-center gap-0.5 text-[11px] text-zinc-400" title="${commentsCount} comentários">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg> ${commentsCount}
            </span>
          ` : ''}
        </div>

        <!-- RESPONSÁVEL -->
        <div class="flex items-center">
          <div class="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-300 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-[10px] font-bold" title="Responsável: ${d.assignee || 'Sem responsável'}">
            ${(d.assignee || 'A').slice(0, 2).toUpperCase()}
          </div>
        </div>
      </div>
    </div>
  `;
}

// ----------------------------------------------------
// RENDER LIST VIEW
// ----------------------------------------------------
function renderDeliveriesList(deliveries) {
  if (deliveries.length === 0) {
    return `
      <div class="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl p-12 text-center">
        <svg class="w-12 h-12 mx-auto text-zinc-300 dark:text-zinc-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>
        <h3 class="text-base font-semibold text-zinc-900 dark:text-zinc-100">Nenhuma entrega encontrada</h3>
        <p class="text-xs text-zinc-500 mt-1 max-w-md mx-auto">
          Tente ajustar os filtros ou clique em "+ Nova Entrega" para cadastrar sua primeira demanda operacional.
        </p>
        <button id="btn-empty-new-delivery" class="mt-4 px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors inline-flex items-center gap-1.5">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg> Nova Entrega
        </button>
      </div>
    `;
  }

  const columns = store.getState().deliveryColumns || [];

  return `
    <div class="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl shadow-2xs overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse text-xs">
          <thead>
            <tr class="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/40 text-[11px] text-zinc-500 uppercase tracking-wider font-semibold">
              <th class="py-3 px-4">Entrega</th>
              <th class="py-3 px-4">Cliente / Projeto</th>
              <th class="py-3 px-4">Status</th>
              <th class="py-3 px-4">Prioridade</th>
              <th class="py-3 px-4">Prazo</th>
              <th class="py-3 px-4">Checklist</th>
              <th class="py-3 px-4">Responsável</th>
              <th class="py-3 px-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-zinc-100 dark:divide-zinc-800">
            ${deliveries.map(d => {
              const checklist = d.checklist || [];
              const completedChecks = checklist.filter(c => c.completed).length;
              const checklistPercent = checklist.length > 0 ? Math.round((completedChecks / checklist.length) * 100) : 0;
              const col = columns.find(c => c.id === d.status) || { title: d.status, color: '#0000FF' };

              return `
                <tr class="hover:bg-zinc-50/70 dark:hover:bg-zinc-800/30 transition-colors group cursor-pointer btn-open-delivery-detail" data-delivery-id="${d.id}">
                  <td class="py-3.5 px-4 font-semibold text-zinc-900 dark:text-zinc-100">
                    <div class="flex items-center gap-2">
                      <span class="w-2 h-2 rounded-full flex-shrink-0" style="background-color: ${col.color || '#0000FF'}"></span>
                      <span class="hover:text-blue-600 transition-colors">${d.title}</span>
                    </div>
                  </td>
                  <td class="py-3.5 px-4 text-zinc-600 dark:text-zinc-400">
                    <div>
                      <span class="font-medium text-zinc-900 dark:text-zinc-100">${d.clientName || '—'}</span>
                      ${d.projectName ? `<div class="text-[10px] text-zinc-400">${d.projectName}</div>` : ''}
                    </div>
                  </td>
                  <td class="py-3.5 px-4" onclick="event.stopPropagation()">
                    <select 
                      class="quick-change-status text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg px-2 py-1 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-blue-600"
                      data-delivery-id="${d.id}"
                    >
                      ${columns.map(c => `
                        <option value="${c.id}" ${c.id === d.status ? 'selected' : ''}>${c.title}</option>
                      `).join('')}
                    </select>
                  </td>
                  <td class="py-3.5 px-4 capitalize font-medium">
                    <span class="px-2 py-0.5 rounded text-[10px] ${
                      d.priority === 'urgente' ? 'bg-rose-100 text-rose-700 font-bold' :
                      d.priority === 'alta' ? 'bg-amber-100 text-amber-800 font-semibold' :
                      d.priority === 'media' ? 'bg-blue-100 text-blue-800' :
                      'bg-zinc-200 text-zinc-700'
                    }">
                      ${d.priority}
                    </span>
                  </td>
                  <td class="py-3.5 px-4 text-zinc-600 dark:text-zinc-400 whitespace-nowrap">
                    ${d.dueDate ? d.dueDate.split('-').reverse().join('/') : '—'}
                  </td>
                  <td class="py-3.5 px-4">
                    ${checklist.length > 0 ? `
                      <div class="w-24">
                        <div class="flex justify-between text-[10px] text-zinc-400 mb-0.5">
                          <span>${completedChecks}/${checklist.length}</span>
                          <span>${checklistPercent}%</span>
                        </div>
                        <div class="w-full bg-zinc-200 dark:bg-zinc-700 h-1.5 rounded-full overflow-hidden">
                          <div class="h-full bg-blue-600 rounded-full" style="width: ${checklistPercent}%"></div>
                        </div>
                      </div>
                    ` : '<span class="text-zinc-400 text-[11px]">—</span>'}
                  </td>
                  <td class="py-3.5 px-4 text-zinc-600 dark:text-zinc-400">
                    <div class="flex items-center gap-1.5">
                      <div class="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-300 text-[10px] font-bold flex items-center justify-center">
                        ${(d.assignee || 'A').slice(0, 1).toUpperCase()}
                      </div>
                      <span class="truncate max-w-[100px]">${d.assignee || '—'}</span>
                    </div>
                  </td>
                  <td class="py-3.5 px-4 text-right" onclick="event.stopPropagation()">
                    <div class="flex items-center justify-end gap-1">
                      <button 
                        class="btn-duplicate-delivery p-1.5 text-zinc-400 hover:text-blue-600 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                        data-delivery-id="${d.id}"
                        title="Duplicar entrega"
                      >
                        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
                      </button>
                      <button 
                        class="btn-delete-delivery p-1.5 text-zinc-400 hover:text-rose-600 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                        data-delivery-id="${d.id}"
                        title="Excluir entrega"
                      >
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
  `;
}

// ----------------------------------------------------
// EVENT HANDLERS & BINDINGS
// ----------------------------------------------------
function setupDeliveriesEvents(container, onNavigate) {
  // Exportação Universal
  bindExportButton(container, 'deliveries-export-dropdown', () => {
    const deliveries = store.getState().deliveries || [];
    const headers = ['Título', 'Cliente', 'Projeto', 'Status', 'Prioridade', 'Prazo', 'Responsável'];
    const rows = deliveries.map(d => [
      d.title,
      d.clientName || '-',
      d.projectName || '-',
      (d.status || '').toUpperCase(),
      (d.priority || 'media').toUpperCase(),
      d.dueDate ? d.dueDate.split('-').reverse().join('/') : '-',
      d.assignee || '-'
    ]);
    const summary = [
      { label: 'Total de Demandas', value: deliveries.length },
      { label: 'Entregues/Aprovadas', value: deliveries.filter(d => d.status === 'entregue' || d.status === 'aprovado').length }
    ];
    return {
      filename: `entregas_${new Date().toISOString().split('T')[0]}`,
      title: 'Quadro Operacional de Entregas & Demandas',
      headers,
      rows,
      summary,
      filters: `Visualização: ${deliveryFilters.viewMode}`
    };
  });

  // Toggle View: Kanban / Lista
  const btnKanban = container.querySelector('#btn-view-kanban');
  const btnList = container.querySelector('#btn-view-list');
  if (btnKanban) {
    btnKanban.onclick = () => {
      deliveryFilters.viewMode = 'kanban';
      renderDeliveriesView(container, onNavigate);
    };
  }
  if (btnList) {
    btnList.onclick = () => {
      deliveryFilters.viewMode = 'list';
      renderDeliveriesView(container, onNavigate);
    };
  }

  // Busca e Filtros
  const searchInput = container.querySelector('#delivery-search-input');
  if (searchInput) {
    searchInput.oninput = (e) => {
      deliveryFilters.search = e.target.value;
      renderDeliveriesView(container, onNavigate);
    };
  }
  const btnClearSearch = container.querySelector('#btn-clear-search');
  if (btnClearSearch) {
    btnClearSearch.onclick = () => {
      deliveryFilters.search = '';
      renderDeliveriesView(container, onNavigate);
    };
  }

  const filterClient = container.querySelector('#filter-delivery-client');
  if (filterClient) {
    filterClient.onchange = (e) => {
      deliveryFilters.clientId = e.target.value;
      renderDeliveriesView(container, onNavigate);
    };
  }

  const filterProject = container.querySelector('#filter-delivery-project');
  if (filterProject) {
    filterProject.onchange = (e) => {
      deliveryFilters.projectId = e.target.value;
      renderDeliveriesView(container, onNavigate);
    };
  }

  const filterPriority = container.querySelector('#filter-delivery-priority');
  if (filterPriority) {
    filterPriority.onchange = (e) => {
      deliveryFilters.priority = e.target.value;
      renderDeliveriesView(container, onNavigate);
    };
  }

  const filterDue = container.querySelector('#filter-delivery-due');
  if (filterDue) {
    filterDue.onchange = (e) => {
      deliveryFilters.dueDate = e.target.value;
      renderDeliveriesView(container, onNavigate);
    };
  }

  const filterTag = container.querySelector('#filter-delivery-tag');
  if (filterTag) {
    filterTag.onchange = (e) => {
      deliveryFilters.tag = e.target.value;
      renderDeliveriesView(container, onNavigate);
    };
  }

  // Botões de Ação Principais
  const btnNewDelivery = container.querySelector('#btn-new-delivery');
  if (btnNewDelivery) {
    btnNewDelivery.onclick = () => openCreateDeliveryModal({}, () => renderDeliveriesView(container, onNavigate));
  }
  const btnEmptyNew = container.querySelector('#btn-empty-new-delivery');
  if (btnEmptyNew) {
    btnEmptyNew.onclick = () => openCreateDeliveryModal({}, () => renderDeliveriesView(container, onNavigate));
  }

  const btnManageTags = container.querySelector('#btn-manage-tags');
  if (btnManageTags) {
    btnManageTags.onclick = () => openManageTagsModal(() => renderDeliveriesView(container, onNavigate));
  }

  const btnAddCol = container.querySelector('#btn-add-kanban-column');
  if (btnAddCol) {
    btnAddCol.onclick = () => openAddColumnModal(() => renderDeliveriesView(container, onNavigate));
  }

  // Universal Export Dropdown
  bindExportButton(container, 'deliveries-export-dropdown', () => {
    const allDeliveries = store.getState().deliveries || [];
    const headers = ['Título', 'Cliente', 'Projeto', 'Status', 'Prioridade', 'Prazo', 'Responsável', 'Tarefas', 'Arquivos'];
    const rows = allDeliveries.map(d => [
      d.title || '',
      d.clientName || '-',
      d.projectName || '-',
      d.status || '',
      (d.priority || '').toUpperCase(),
      formatDate(d.dueDate),
      d.assignee || '-',
      `${(d.checklist || []).filter(c => c.completed).length}/${(d.checklist || []).length}`,
      (d.files || []).length
    ]);

    const metrics = store.getDeliveryMetrics();
    const summary = [
      { label: 'Total de Demandas', value: metrics.total },
      { label: 'Em Andamento', value: metrics.inProgress },
      { label: 'Em Revisão', value: metrics.inReview },
      { label: 'Entregues', value: metrics.delivered },
      { label: 'Atrasadas', value: metrics.overdue }
    ];

    return {
      filename: `entregas_operacoes_${new Date().toISOString().split('T')[0]}`,
      title: 'Relatório Operacional de Entregas & Demandas',
      headers,
      rows,
      summary,
      filters: `Total: ${allDeliveries.length} demandas cadastradas`
    };
  });

  // Drag and Drop
  if (deliveryFilters.viewMode === 'kanban') {
    setupKanbanDragAndDrop(container, onNavigate);
  }

  // Delegated events for cards & table rows
  container.querySelectorAll('.btn-open-delivery-detail').forEach(el => {
    el.onclick = (e) => {
      e.stopPropagation();
      const id = el.dataset.deliveryId;
      if (id) openDeliveryDetailModal(id, () => renderDeliveriesView(container, onNavigate));
    };
  });

  container.querySelectorAll('.btn-add-to-column').forEach(el => {
    el.onclick = (e) => {
      e.stopPropagation();
      const colId = el.dataset.columnId;
      openCreateDeliveryModal({ status: colId }, () => renderDeliveriesView(container, onNavigate));
    };
  });

  container.querySelectorAll('.btn-col-options').forEach(el => {
    el.onclick = (e) => {
      e.stopPropagation();
      const colId = el.dataset.columnId;
      const colTitle = el.dataset.columnTitle;
      openColumnOptionsModal(colId, colTitle, () => renderDeliveriesView(container, onNavigate));
    };
  });

  container.querySelectorAll('.btn-duplicate-delivery').forEach(el => {
    el.onclick = (e) => {
      e.stopPropagation();
      const id = el.dataset.deliveryId;
      store.duplicateDelivery(id);
      toast.show('Entrega duplicada com sucesso!', 'success');
      renderDeliveriesView(container, onNavigate);
    };
  });

  container.querySelectorAll('.btn-delete-delivery').forEach(el => {
    el.onclick = (e) => {
      e.stopPropagation();
      const id = el.dataset.deliveryId;
      if (confirm('Deseja realmente excluir esta entrega?')) {
        store.deleteDelivery(id);
        toast.show('Entrega excluída.', 'info');
        renderDeliveriesView(container, onNavigate);
      }
    };
  });

  container.querySelectorAll('.quick-change-status').forEach(el => {
    el.onchange = (e) => {
      const id = el.dataset.deliveryId;
      const newStatus = e.target.value;
      store.moveDeliveryStatus(id, newStatus);
      toast.show('Status da entrega atualizado!', 'success');
      renderDeliveriesView(container, onNavigate);
    };
  });

  container.querySelectorAll('.btn-delivery-card-menu').forEach(el => {
    el.onclick = (e) => {
      e.stopPropagation();
      const id = el.dataset.deliveryId;
      openDeliveryQuickActionsMenu(id, e, () => renderDeliveriesView(container, onNavigate));
    };
  });
}

// ----------------------------------------------------
// DRAG AND DROP KANBAN (HTML5 Native)
// ----------------------------------------------------
let draggedDeliveryId = null;

function setupKanbanDragAndDrop(container, onNavigate) {
  const cards = container.querySelectorAll('.delivery-card');
  const dropzones = container.querySelectorAll('.kanban-cards-dropzone');

  cards.forEach(card => {
    card.addEventListener('dragstart', (e) => {
      draggedDeliveryId = card.dataset.deliveryId;
      card.classList.add('opacity-40', 'scale-95');
      e.dataTransfer.setData('text/plain', draggedDeliveryId);
      e.dataTransfer.effectAllowed = 'move';
    });

    card.addEventListener('dragend', () => {
      card.classList.remove('opacity-40', 'scale-95');
      draggedDeliveryId = null;
    });
  });

  dropzones.forEach(zone => {
    zone.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      zone.classList.add('bg-blue-500/10', 'ring-2', 'ring-blue-500/30', 'rounded-xl');
    });

    zone.addEventListener('dragleave', () => {
      zone.classList.remove('bg-blue-500/10', 'ring-2', 'ring-blue-500/30', 'rounded-xl');
    });

    zone.addEventListener('drop', (e) => {
      e.preventDefault();
      zone.classList.remove('bg-blue-500/10', 'ring-2', 'ring-blue-500/30', 'rounded-xl');
      const targetColumnId = zone.dataset.columnId;
      const deliveryId = e.dataTransfer.getData('text/plain') || draggedDeliveryId;

      if (deliveryId && targetColumnId) {
        store.moveDeliveryStatus(deliveryId, targetColumnId);
        toast.show('Status atualizado via Kanban!', 'success');
        renderDeliveriesView(container, onNavigate);
      }
    });
  });
}

// ----------------------------------------------------
// MODAL: DETALHES COMPLETOS DA ENTREGA (TRELLO STYLE)
// ----------------------------------------------------
export function openDeliveryDetailModal(deliveryId, onUpdate) {
  const delivery = (store.getState().deliveries || []).find(d => d.id === deliveryId);
  if (!delivery) return;

  const clients = store.getState().clients || [];
  const projects = store.getState().projects || [];
  const columns = store.getState().deliveryColumns || [];
  const allTags = store.getState().deliveryTags || [];

  const modalEl = document.createElement('div');
  modalEl.id = 'delivery-detail-modal';
  modalEl.className = 'fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fadeIn';

  const checklist = delivery.checklist || [];
  const completedChecks = checklist.filter(c => c.completed).length;
  const checklistPercent = checklist.length > 0 ? Math.round((completedChecks / checklist.length) * 100) : 0;

  modalEl.innerHTML = `
    <div class="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden my-6 flex flex-col max-h-[92vh] animate-scaleUp">
      <!-- INPUTS DE UPLOAD REAL OCULTOS -->
      <input type="file" id="input-delivery-cover-file" accept="image/png,image/jpeg,image/jpg,image/webp" capture="environment" class="hidden" />
      <input type="file" id="input-delivery-file-upload" accept=".jpg,.jpeg,.png,.webp,.pdf,.xls,.xlsx,.csv,.doc,.docx" class="hidden" />

      <!-- HEADER / BANNER -->
      ${delivery.coverImage ? `
        <div class="w-full h-44 relative bg-zinc-100 dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-800 group">
          <img src="${delivery.coverImage}" alt="Capa" class="w-full h-full object-cover">
          <div class="absolute top-3 right-12 flex items-center gap-2">
            <button id="btn-change-cover-file" class="px-2.5 py-1 bg-black/70 hover:bg-black/90 text-white text-[11px] font-medium rounded-lg transition-colors backdrop-blur-xs flex items-center gap-1 shadow-sm cursor-pointer">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg> Alterar Capa
            </button>
            <button id="btn-remove-cover" class="px-2.5 py-1 bg-black/70 hover:bg-black/90 text-white text-[11px] font-medium rounded-lg transition-colors backdrop-blur-xs flex items-center gap-1 shadow-sm cursor-pointer">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg> Remover Capa
            </button>
          </div>
        </div>
      ` : ''}

      <div class="p-6 border-b border-zinc-200 dark:border-zinc-800 flex items-start justify-between gap-4">
        <div class="flex-1">
          <div class="flex items-center gap-2 mb-2 flex-wrap">
            <!-- Status Badge Selector -->
            <select id="modal-select-status" class="text-xs font-semibold bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 rounded-lg px-2.5 py-1 focus:outline-none cursor-pointer">
              ${columns.map(c => `
                <option value="${c.id}" ${c.id === delivery.status ? 'selected' : ''}>${c.title}</option>
              `).join('')}
            </select>

            <!-- Priority Selector -->
            <select id="modal-select-priority" class="text-xs font-semibold rounded-lg px-2.5 py-1 border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 focus:outline-none cursor-pointer capitalize">
              <option value="baixa" ${delivery.priority === 'baixa' ? 'selected' : ''}>Prioridade Baixa</option>
              <option value="media" ${delivery.priority === 'media' ? 'selected' : ''}>Prioridade Média</option>
              <option value="alta" ${delivery.priority === 'alta' ? 'selected' : ''}>Prioridade Alta</option>
              <option value="urgente" ${delivery.priority === 'urgente' ? 'selected' : ''}>Prioridade Urgente</option>
            </select>

            ${!delivery.coverImage ? `
              <button id="btn-add-cover-file" class="text-xs text-zinc-600 dark:text-zinc-400 hover:text-blue-600 flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-dashed border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg> Adicionar Capa
              </button>
            ` : ''}
          </div>

          <!-- Título Editável -->
          <input 
            type="text" 
            id="modal-delivery-title" 
            value="${delivery.title}" 
            class="text-xl font-bold text-zinc-900 dark:text-zinc-100 w-full bg-transparent border-b border-transparent hover:border-zinc-300 dark:hover:border-zinc-700 focus:border-blue-600 focus:outline-none transition-colors py-0.5"
          />
        </div>

        <button id="btn-close-modal" class="p-2 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
        </button>
      </div>

      <!-- CORPO PRINCIPAL COM 2 COLUNAS -->
      <div class="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-6 custom-scrollbar">
        <!-- COLUNA DA ESQUERDA: CONTEÚDO, CHECKLIST, ARQUIVOS, COMENTÁRIOS (2/3) -->
        <div class="lg:col-span-2 space-y-6">
          
          <!-- DESCRIÇÃO -->
          <div>
            <div class="flex items-center justify-between mb-2">
              <h4 class="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h7"/></svg> Descrição
              </h4>
              <button id="btn-save-desc" class="text-[11px] text-blue-600 dark:text-blue-400 hover:underline hidden font-medium">Salvar alterações</button>
            </div>
            <textarea 
              id="modal-delivery-desc" 
              rows="4" 
              placeholder="Adicione uma descrição detalhada, requisitos do cliente ou orientações operacionais..." 
              class="w-full text-xs p-3 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-600 text-zinc-900 dark:text-zinc-100 resize-y"
            >${delivery.description || ''}</textarea>
          </div>

          <!-- CHECKLIST INTERATIVO -->
          <div class="bg-zinc-50/50 dark:bg-zinc-800/30 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4">
            <div class="flex items-center justify-between mb-2">
              <h4 class="text-xs font-bold uppercase tracking-wider text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                <svg class="w-3.5 h-3.5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/></svg> Checklist de Tarefas
              </h4>
              <span class="text-xs font-semibold text-zinc-500">${completedChecks}/${checklist.length} (${checklistPercent}%)</span>
            </div>

            <!-- Barra de Progresso -->
            <div class="w-full bg-zinc-200 dark:bg-zinc-700 h-2 rounded-full overflow-hidden mb-4">
              <div class="h-full bg-blue-600 rounded-full transition-all duration-300" style="width: ${checklistPercent}%"></div>
            </div>

            <!-- Lista de Itens -->
            <div class="space-y-2 mb-3" id="checklist-items-container">
              ${checklist.map(item => `
                <div class="flex items-center justify-between gap-2 p-2 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 hover:border-blue-500/40 group">
                  <label class="flex items-center gap-2.5 flex-1 cursor-pointer">
                    <input 
                      type="checkbox" 
                      class="chk-item-toggle rounded border-zinc-300 dark:border-zinc-700 text-blue-600 focus:ring-blue-600 cursor-pointer" 
                      data-item-id="${item.id}"
                      ${item.completed ? 'checked' : ''}
                    />
                    <span class="text-xs text-zinc-800 dark:text-zinc-200 ${item.completed ? 'line-through text-zinc-400 dark:text-zinc-500' : ''}">${item.text}</span>
                  </label>
                  <button 
                    class="btn-del-checklist-item opacity-0 group-hover:opacity-100 p-1 text-zinc-400 hover:text-rose-600 transition-opacity"
                    data-item-id="${item.id}"
                    title="Remover item"
                  >
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                  </button>
                </div>
              `).join('')}
            </div>

            <!-- Adicionar Item ao Checklist -->
            <div class="flex gap-2">
              <input 
                type="text" 
                id="input-new-checklist-item" 
                placeholder="Adicionar novo item de verificação..." 
                class="flex-1 text-xs px-3 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-600 text-zinc-900 dark:text-zinc-100"
              />
              <button id="btn-add-checklist-item" class="px-3 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-1">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg> Adicionar
              </button>
            </div>
          </div>

          <!-- ARQUIVOS E ANEXOS COM SYNC DOCUMENTOS -->
          <div class="border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4">
            <div class="flex items-center justify-between mb-3 flex-wrap gap-2">
              <h4 class="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"/></svg> Arquivos & Anexos (${(delivery.files || []).length})
              </h4>
              <div class="flex items-center gap-2">
                <button id="btn-upload-delivery-file" class="px-2.5 py-1 text-xs font-semibold bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 hover:bg-blue-100 rounded-lg transition-colors flex items-center gap-1 cursor-pointer">
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg> + Fazer Upload Real
                </button>
                <button id="btn-show-add-file-form" class="text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 hover:underline flex items-center gap-1 cursor-pointer">
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/></svg> Link Externo
                </button>
              </div>
            </div>

            <!-- Formulário para Link Externo (Oculto inicialmente) -->
            <div id="add-file-form-container" class="hidden mb-4 p-3 bg-zinc-50 dark:bg-zinc-800/40 rounded-xl border border-zinc-200 dark:border-zinc-700 space-y-2.5">
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input type="text" id="input-file-name" placeholder="Nome do arquivo (ex: Figma Mockup)" class="text-xs px-2.5 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-blue-600" />
                <input type="text" id="input-file-url" placeholder="Link / URL do arquivo (Drive, Figma, CDN)" class="text-xs px-2.5 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-blue-600" />
              </div>
              <div class="flex items-center justify-between">
                <label class="flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-400 cursor-pointer">
                  <input type="checkbox" id="chk-sync-to-docs" checked class="rounded border-zinc-300 dark:border-zinc-700 text-blue-600 focus:ring-blue-600" />
                  <span>Sincronizar na Central de Documentos</span>
                </label>
                <div class="flex gap-2">
                  <button id="btn-cancel-add-file" class="px-2.5 py-1 text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 cursor-pointer">Cancelar</button>
                  <button id="btn-confirm-add-file" class="px-3 py-1 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium cursor-pointer">Salvar Link</button>
                </div>
              </div>
            </div>

            <!-- Lista de Arquivos -->
            <div class="space-y-2">
              ${(delivery.files || []).length === 0 ? `
                <p class="text-xs text-zinc-400 py-3 text-center italic border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl">Nenhum arquivo anexado a esta entrega. Faça o upload acima.</p>
              ` : (delivery.files || []).map(f => `
                <div class="flex items-center justify-between p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-700 hover:border-blue-500/40 transition-colors">
                  <div class="flex items-center gap-2.5 min-w-0">
                    <div class="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-300 flex items-center justify-center font-bold text-xs shrink-0 uppercase">
                      ${f.storageId ? (f.type || 'ARQ').slice(0, 3) : '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/></svg>'}
                    </div>
                    <div class="min-w-0">
                      <div class="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">${f.name}</div>
                      <div class="text-[10px] text-zinc-400 flex items-center gap-1.5">
                        <span>${f.size || '1 MB'}</span>
                        <span>•</span>
                        <span>${f.date || f.uploadedAt || 'hoje'}</span>
                        ${f.storageId ? '<span class="px-1 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 text-[9px] rounded font-medium">Local DB</span>' : ''}
                      </div>
                    </div>
                  </div>
                  <div class="flex items-center gap-1.5 shrink-0">
                    ${f.storageId ? `
                      <button class="btn-preview-file px-2 py-1 text-[11px] font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded-lg transition-colors flex items-center gap-1 cursor-pointer" data-storage-id="${f.storageId}" data-name="${f.name}">
                        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg> Visualizar
                      </button>
                      <button class="btn-download-file px-2 py-1 text-[11px] font-medium text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg transition-colors flex items-center gap-1 cursor-pointer" data-storage-id="${f.storageId}" data-name="${f.name}">
                        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg> Baixar
                      </button>
                    ` : `
                      <a href="${f.url || '#'}" target="_blank" class="px-2 py-1 text-[11px] font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded-lg transition-colors flex items-center gap-1">
                        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg> Abrir
                      </a>
                    `}
                    <button class="btn-delete-delivery-file p-1 text-zinc-400 hover:text-rose-600 transition-colors cursor-pointer" data-file-id="${f.id}" data-storage-id="${f.storageId || ''}" title="Excluir arquivo">
                      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                    </button>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- COMENTÁRIOS E FEEDBACK -->
          <div class="border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4">
            <h4 class="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5 mb-3">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg> Comentários & Diálogo Operacional (${(delivery.comments || []).length})
            </h4>

            <div class="space-y-3 mb-4 max-h-60 overflow-y-auto custom-scrollbar">
              ${(delivery.comments || []).length === 0 ? `
                <p class="text-xs text-zinc-400 py-2 italic">Nenhum comentário registrado ainda.</p>
              ` : (delivery.comments || []).map(comm => `
                <div class="p-3 bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800 rounded-xl space-y-1">
                  <div class="flex items-center justify-between">
                    <span class="text-xs font-bold text-zinc-900 dark:text-zinc-100">${comm.author || 'Usuário'}</span>
                    <div class="flex items-center gap-2">
                      <span class="text-[10px] text-zinc-400">${comm.createdAt || ''}</span>
                      <button class="btn-del-comment text-zinc-400 hover:text-rose-600 text-[10px]" data-comment-id="${comm.id}" title="Excluir">
                        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                      </button>
                    </div>
                  </div>
                  <p class="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed">${comm.text}</p>
                </div>
              `).join('')}
            </div>

            <!-- Adicionar Comentário -->
            <div class="flex gap-2">
              <input 
                type="text" 
                id="input-new-comment" 
                placeholder="Escreva um comentário ou feedback..." 
                class="flex-1 text-xs px-3 py-1.5 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-600 text-zinc-900 dark:text-zinc-100"
              />
              <button id="btn-add-comment" class="px-3 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-1">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg> Enviar
              </button>
            </div>
          </div>

          <!-- HISTÓRICO DE AUDITORIA -->
          <div>
            <h4 class="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5 mb-2">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg> Histórico de Atividades
            </h4>
            <div class="space-y-1.5 border-l-2 border-zinc-200 dark:border-zinc-700 pl-3 ml-2 text-[11px] text-zinc-400">
              ${(delivery.history || []).map(h => `
                <div>
                  <span class="font-medium text-zinc-700 dark:text-zinc-300">${h.date}:</span> ${h.text}
                </div>
              `).join('')}
            </div>
          </div>
        </div>

        <!-- COLUNA DA DIREITA: METADADOS & ASSOCIAÇÕES (1/3) -->
        <div class="space-y-5 bg-zinc-50/70 dark:bg-zinc-800/40 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 h-fit">
          <h4 class="text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-zinc-100 pb-2 border-b border-zinc-200 dark:border-zinc-700">
            Detalhes & Vínculos
          </h4>

          <!-- CLIENTE VINCULADO -->
          <div>
            <label class="block text-[11px] font-semibold text-zinc-400 uppercase mb-1">Cliente Vinculado</label>
            <select id="modal-select-client" class="w-full text-xs bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg p-2 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-blue-600">
              <option value="">Sem Cliente Vinculado</option>
              ${clients.map(c => `
                <option value="${c.id}" ${c.id === delivery.clientId ? 'selected' : ''}>${c.name}</option>
              `).join('')}
            </select>
          </div>

          <!-- PROJETO VINCULADO -->
          <div>
            <label class="block text-[11px] font-semibold text-zinc-400 uppercase mb-1">Projeto Vinculado</label>
            <select id="modal-select-project" class="w-full text-xs bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg p-2 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-blue-600">
              <option value="">Sem Projeto Vinculado</option>
              ${projects.map(p => `
                <option value="${p.id}" ${p.id === delivery.projectId ? 'selected' : ''}>${p.title}</option>
              `).join('')}
            </select>
            <p class="text-[10px] text-zinc-400 mt-1">Concluir entregas atualiza o % de progresso do projeto automaticamente.</p>
          </div>

          <!-- RESPONSÁVEL -->
          <div>
            <label class="block text-[11px] font-semibold text-zinc-400 uppercase mb-1">Responsável</label>
            <input 
              type="text" 
              id="modal-input-assignee" 
              value="${delivery.assignee || ''}" 
              placeholder="Nome do responsável" 
              class="w-full text-xs bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg p-2 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-blue-600"
            />
          </div>

          <!-- DATA DE PRAZO -->
          <div>
            <label class="block text-[11px] font-semibold text-zinc-400 uppercase mb-1">Prazo de Entrega</label>
            <input 
              type="date" 
              id="modal-input-due" 
              value="${delivery.dueDate || ''}" 
              class="w-full text-xs bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg p-2 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-blue-600"
            />
          </div>

          <!-- TAGS & ETIQUETAS -->
          <div>
            <div class="flex items-center justify-between mb-1.5">
              <label class="text-[11px] font-semibold text-zinc-400 uppercase">Etiquetas (Tags)</label>
              <button id="btn-modal-add-tag" class="text-[11px] text-blue-600 dark:text-blue-400 hover:underline">+ Nova Tag</button>
            </div>
            
            <div class="flex flex-wrap gap-1.5 mb-2" id="modal-active-tags">
              ${(delivery.tags || []).map(tag => `
                <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium border" style="background-color: ${tag.color ? tag.color + '15' : '#0000FF15'}; color: ${tag.color || '#0000FF'}; border-color: ${tag.color ? tag.color + '40' : '#0000FF40'}">
                  ${tag.name}
                  <button class="btn-remove-tag-from-delivery hover:opacity-80" data-tag-name="${tag.name}">
                    &times;
                  </button>
                </span>
              `).join('')}
            </div>

            <!-- Seletor de tags existentes -->
            <select id="modal-select-add-tag" class="w-full text-xs bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg p-1.5 text-zinc-600 dark:text-zinc-400 focus:outline-none">
              <option value="">+ Adicionar tag existente...</option>
              ${allTags.filter(t => !(delivery.tags || []).some(dt => dt.name === t.name)).map(t => `
                <option value="${t.name}">${t.name}</option>
              `).join('')}
            </select>
          </div>

          <!-- AÇÕES GERAIS -->
          <div class="pt-4 border-t border-zinc-200 dark:border-zinc-700 space-y-2">
            <button id="btn-modal-duplicate" class="w-full py-2 px-3 text-xs font-semibold bg-zinc-200/80 hover:bg-zinc-300 dark:bg-zinc-700 dark:hover:bg-zinc-600 text-zinc-800 dark:text-zinc-200 rounded-xl transition-colors flex items-center justify-center gap-1.5">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg> Duplicar Entrega
            </button>
            <button id="btn-modal-delete" class="w-full py-2 px-3 text-xs font-semibold bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:hover:bg-rose-950/70 dark:text-rose-300 rounded-xl transition-colors flex items-center justify-center gap-1.5">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg> Excluir Entrega
            </button>
          </div>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(modalEl);

  const closeModal = () => {
    modalEl.remove();
    if (onUpdate) onUpdate();
  };

  modalEl.querySelector('#btn-close-modal').onclick = closeModal;
  modalEl.onclick = (e) => {
    if (e.target === modalEl) closeModal();
  };

  // Alterar Status
  modalEl.querySelector('#modal-select-status').onchange = (e) => {
    store.moveDeliveryStatus(deliveryId, e.target.value);
    toast.show('Status atualizado!', 'success');
  };

  // Alterar Prioridade
  modalEl.querySelector('#modal-select-priority').onchange = (e) => {
    store.updateDelivery(deliveryId, { priority: e.target.value }, `Prioridade alterada para '${e.target.value}'.`);
    toast.show('Prioridade atualizada!', 'info');
  };

  // Alterar Título
  const inputTitle = modalEl.querySelector('#modal-delivery-title');
  inputTitle.onblur = () => {
    if (inputTitle.value.trim() && inputTitle.value.trim() !== delivery.title) {
      store.updateDelivery(deliveryId, { title: inputTitle.value.trim() }, `Título alterado para '${inputTitle.value.trim()}'.`);
    }
  };

  // Alterar Descrição
  const descArea = modalEl.querySelector('#modal-delivery-desc');
  const btnSaveDesc = modalEl.querySelector('#btn-save-desc');
  descArea.oninput = () => {
    btnSaveDesc.classList.remove('hidden');
  };
  btnSaveDesc.onclick = () => {
    store.updateDelivery(deliveryId, { description: descArea.value }, 'Descrição atualizada.');
    btnSaveDesc.classList.add('hidden');
    toast.show('Descrição salva!', 'success');
  };
  descArea.onblur = () => {
    store.updateDelivery(deliveryId, { description: descArea.value });
    btnSaveDesc.classList.add('hidden');
  };

  // Checklist interativo
  modalEl.querySelectorAll('.chk-item-toggle').forEach(chk => {
    chk.onchange = () => {
      store.toggleDeliveryChecklistItem(deliveryId, chk.dataset.itemId);
      closeModal();
      openDeliveryDetailModal(deliveryId, onUpdate);
    };
  });

  modalEl.querySelectorAll('.btn-del-checklist-item').forEach(btn => {
    btn.onclick = () => {
      store.deleteDeliveryChecklistItem(deliveryId, btn.dataset.itemId);
      closeModal();
      openDeliveryDetailModal(deliveryId, onUpdate);
    };
  });

  const inputCheck = modalEl.querySelector('#input-new-checklist-item');
  const btnAddCheck = modalEl.querySelector('#btn-add-checklist-item');
  const handleAddCheck = () => {
    const val = inputCheck.value.trim();
    if (val) {
      store.addDeliveryChecklistItem(deliveryId, val);
      closeModal();
      openDeliveryDetailModal(deliveryId, onUpdate);
    }
  };
  btnAddCheck.onclick = handleAddCheck;
  inputCheck.onkeydown = (e) => {
    if (e.key === 'Enter') handleAddCheck();
  };

  // Upload Real de Arquivo
  const inputFileUpload = modalEl.querySelector('#input-delivery-file-upload');
  const btnUploadFile = modalEl.querySelector('#btn-upload-delivery-file');
  if (btnUploadFile && inputFileUpload) {
    btnUploadFile.onclick = () => inputFileUpload.click();
  }
  if (inputFileUpload) {
    inputFileUpload.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      try {
        toast.show(`Enviando ${file.name}...`, 'info');
        const stored = await storageService.saveFile(file, {
          category: 'Entregas',
          deliveryId,
          deliveryTitle: delivery.title,
          clientId: delivery.clientId || '',
          clientName: delivery.clientName || '',
          projectId: delivery.projectId || '',
          projectName: delivery.projectName || ''
        });

        store.addDeliveryFile(deliveryId, {
          id: stored.id,
          name: stored.name,
          storageId: stored.id,
          size: stored.formattedSize,
          type: stored.extension || 'file',
          mimeType: stored.type,
          uploadedAt: new Date().toLocaleDateString('pt-BR')
        });

        toast.show('Arquivo anexado com sucesso!', 'success');
        closeModal();
        openDeliveryDetailModal(deliveryId, onUpdate);
      } catch (err) {
        toast.show('Erro ao salvar arquivo: ' + err.message, 'error');
      }
    };
  }

  // Visualizar Arquivo (Modal de Preview)
  modalEl.querySelectorAll('.btn-preview-file').forEach(btn => {
    btn.onclick = async () => {
      const storageId = btn.dataset.storageId;
      const fileName = btn.dataset.name;
      try {
        const objectUrl = await storageService.getObjectUrl(storageId);
        const storedFile = await storageService.getFile(storageId);
        const isPdf = storedFile?.type === 'application/pdf' || fileName.toLowerCase().endsWith('.pdf');
        const isImage = (storedFile?.type || '').startsWith('image/') || /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(fileName);

        modal.open({
          title: `Visualização: ${fileName}`,
          content: `
            <div class="space-y-4">
              <div class="flex items-center justify-between text-xs text-zinc-500 pb-2 border-b border-zinc-200 dark:border-zinc-800">
                <span>Tamanho: ${storedFile?.formattedSize || '-'}</span>
                <span>Entrega: ${delivery.title}</span>
              </div>
              ${isImage ? `
                <div class="max-h-[70vh] flex items-center justify-center overflow-hidden bg-zinc-950/5 dark:bg-zinc-950/40 rounded-xl p-2">
                  <img src="${objectUrl}" alt="${fileName}" class="max-w-full max-h-[65vh] object-contain rounded-lg shadow-sm" />
                </div>
              ` : isPdf ? `
                <div class="w-full h-[550px] bg-zinc-100 rounded-xl overflow-hidden">
                  <iframe src="${objectUrl}#toolbar=0" class="w-full h-full border-0"></iframe>
                </div>
              ` : `
                <div class="p-8 text-center bg-zinc-50 dark:bg-zinc-850 rounded-2xl border border-zinc-200 dark:border-zinc-800 space-y-3">
                  <div class="w-16 h-16 rounded-2xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 flex items-center justify-center font-bold text-2xl mx-auto">
                    ${fileName.split('.').pop().toUpperCase()}
                  </div>
                  <div>
                    <h4 class="font-bold text-sm text-zinc-900 dark:text-zinc-100">${fileName}</h4>
                    <p class="text-xs text-zinc-400 mt-1">Pré-visualização direta indisponível neste navegador.</p>
                  </div>
                  <button id="modal-delivery-download-direct" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs">
                    Baixar Arquivo Agora
                  </button>
                </div>
              `}
            </div>
          `,
          size: isPdf || isImage ? 'lg' : 'md'
        });

        const dlBtn = document.getElementById('modal-delivery-download-direct');
        if (dlBtn) {
          dlBtn.onclick = async () => {
            await storageService.downloadFile(storageId, fileName);
          };
        }
      } catch (err) {
        toast.show('Erro ao abrir visualização: ' + err.message, 'error');
      }
    };
  });

  // Download direto
  modalEl.querySelectorAll('.btn-download-file').forEach(btn => {
    btn.onclick = async () => {
      const storageId = btn.dataset.storageId;
      const fileName = btn.dataset.name;
      try {
        await storageService.downloadFile(storageId, fileName);
        toast.show(`Download de ${fileName} concluído!`, 'success');
      } catch (err) {
        toast.show('Erro ao realizar download: ' + err.message, 'error');
      }
    };
  });

  // Excluir Arquivo da Entrega
  modalEl.querySelectorAll('.btn-delete-delivery-file').forEach(btn => {
    btn.onclick = async () => {
      const fileId = btn.dataset.fileId;
      const storageId = btn.dataset.storageId;
      if (confirm('Deseja realmente remover este arquivo da entrega?')) {
        store.deleteDeliveryFile(deliveryId, fileId);
        if (storageId) {
          await storageService.deleteFile(storageId);
        }
        toast.show('Arquivo removido!', 'info');
        closeModal();
        openDeliveryDetailModal(deliveryId, onUpdate);
      }
    };
  });

  // Links externos (legado / opcional)
  const btnShowAddFile = modalEl.querySelector('#btn-show-add-file-form');
  const addFileForm = modalEl.querySelector('#add-file-form-container');
  if (btnShowAddFile) {
    btnShowAddFile.onclick = () => addFileForm.classList.toggle('hidden');
  }
  const btnCancelFile = modalEl.querySelector('#btn-cancel-add-file');
  if (btnCancelFile) {
    btnCancelFile.onclick = () => addFileForm.classList.add('hidden');
  }
  const btnConfirmFile = modalEl.querySelector('#btn-confirm-add-file');
  if (btnConfirmFile) {
    btnConfirmFile.onclick = () => {
      const name = modalEl.querySelector('#input-file-name').value.trim();
      const url = modalEl.querySelector('#input-file-url').value.trim();
      const syncToDocs = modalEl.querySelector('#chk-sync-to-docs').checked;

      if (!name) {
        alert('Informe o nome do link/arquivo.');
        return;
      }

      store.addDeliveryFile(deliveryId, {
        name,
        url: url || '#',
        syncToDocuments: syncToDocs
      });

      toast.show('Link salvo com sucesso!', 'success');
      closeModal();
      openDeliveryDetailModal(deliveryId, onUpdate);
    };
  }

  // Comentários
  const inputComm = modalEl.querySelector('#input-new-comment');
  const btnAddComm = modalEl.querySelector('#btn-add-comment');
  const handleAddComm = () => {
    const text = inputComm.value.trim();
    if (text) {
      store.addDeliveryComment(deliveryId, {
        text,
        author: store.getState().profile.name
      });
      closeModal();
      openDeliveryDetailModal(deliveryId, onUpdate);
    }
  };
  btnAddComm.onclick = handleAddComm;
  inputComm.onkeydown = (e) => {
    if (e.key === 'Enter') handleAddComm();
  };

  modalEl.querySelectorAll('.btn-del-comment').forEach(btn => {
    btn.onclick = () => {
      store.deleteDeliveryComment(deliveryId, btn.dataset.commentId);
      closeModal();
      openDeliveryDetailModal(deliveryId, onUpdate);
    };
  });

  // Metadados direita: Cliente
  modalEl.querySelector('#modal-select-client').onchange = (e) => {
    const cId = e.target.value;
    const client = clients.find(c => c.id === cId);
    store.updateDelivery(deliveryId, {
      clientId: cId || null,
      clientName: client ? client.name : null
    }, client ? `Cliente alterado para '${client.name}'.` : 'Cliente desvinculado.');
    toast.show('Cliente atualizado!', 'info');
  };

  // Projeto
  modalEl.querySelector('#modal-select-project').onchange = (e) => {
    const pId = e.target.value;
    const proj = projects.find(p => p.id === pId);
    store.updateDelivery(deliveryId, {
      projectId: pId || null,
      projectName: proj ? proj.title : null
    }, proj ? `Projeto alterado para '${proj.title}'.` : 'Projeto desvinculado.');
    toast.show('Projeto vinculado atualizado!', 'info');
  };

  // Responsável
  const inputAssignee = modalEl.querySelector('#modal-input-assignee');
  inputAssignee.onblur = () => {
    if (inputAssignee.value.trim() !== delivery.assignee) {
      store.updateDelivery(deliveryId, { assignee: inputAssignee.value.trim() });
    }
  };

  // Prazo
  const inputDue = modalEl.querySelector('#modal-input-due');
  inputDue.onchange = () => {
    store.updateDelivery(deliveryId, { dueDate: inputDue.value }, `Prazo alterado para ${inputDue.value}.`);
    toast.show('Prazo atualizado!', 'info');
  };

  // Capa Real Upload & Remoção
  const inputCoverFile = modalEl.querySelector('#input-delivery-cover-file');
  const btnAddCoverFile = modalEl.querySelector('#btn-add-cover-file');
  const btnChangeCoverFile = modalEl.querySelector('#btn-change-cover-file');
  const btnRemoveCover = modalEl.querySelector('#btn-remove-cover');

  if (btnAddCoverFile && inputCoverFile) {
    btnAddCoverFile.onclick = () => inputCoverFile.click();
  }
  if (btnChangeCoverFile && inputCoverFile) {
    btnChangeCoverFile.onclick = () => inputCoverFile.click();
  }
  if (inputCoverFile) {
    inputCoverFile.onchange = async (e) => {
      const file = e.target.files[0];
      if (file) {
        try {
          toast.show('Processando imagem de capa...', 'info');
          const base64 = await storageService.fileToBase64(file);
          store.updateDelivery(deliveryId, { coverImage: base64 }, 'Imagem de capa atualizada.');
          toast.show('Capa atualizada com sucesso!', 'success');
          closeModal();
          openDeliveryDetailModal(deliveryId, onUpdate);
        } catch (err) {
          toast.show('Erro ao processar imagem: ' + err.message, 'error');
        }
      }
    };
  }
  if (btnRemoveCover) {
    btnRemoveCover.onclick = () => {
      store.updateDelivery(deliveryId, { coverImage: '' }, 'Imagem de capa removida.');
      toast.show('Capa removida!', 'info');
      closeModal();
      openDeliveryDetailModal(deliveryId, onUpdate);
    };
  }

  // Tags
  modalEl.querySelectorAll('.btn-remove-tag-from-delivery').forEach(btn => {
    btn.onclick = () => {
      const tName = btn.dataset.tagName;
      const updatedTags = (delivery.tags || []).filter(t => t.name !== tName);
      store.updateDelivery(deliveryId, { tags: updatedTags });
      closeModal();
      openDeliveryDetailModal(deliveryId, onUpdate);
    };
  });

  const selectAddTag = modalEl.querySelector('#modal-select-add-tag');
  selectAddTag.onchange = (e) => {
    const tName = e.target.value;
    if (tName) {
      const tagObj = allTags.find(t => t.name === tName) || { name: tName, color: '#0000FF' };
      const updatedTags = [...(delivery.tags || []), tagObj];
      store.updateDelivery(deliveryId, { tags: updatedTags });
      closeModal();
      openDeliveryDetailModal(deliveryId, onUpdate);
    }
  };

  modalEl.querySelector('#btn-modal-add-tag').onclick = () => {
    openManageTagsModal(() => {
      closeModal();
      openDeliveryDetailModal(deliveryId, onUpdate);
    });
  };

  // Duplicar e Excluir
  modalEl.querySelector('#btn-modal-duplicate').onclick = () => {
    const dup = store.duplicateDelivery(deliveryId);
    toast.show('Entrega duplicada!', 'success');
    closeModal();
    if (dup) openDeliveryDetailModal(dup.id, onUpdate);
  };

  modalEl.querySelector('#btn-modal-delete').onclick = () => {
    if (confirm('Deseja realmente excluir esta entrega?')) {
      store.deleteDelivery(deliveryId);
      toast.show('Entrega excluída.', 'info');
      closeModal();
    }
  };
}

// ----------------------------------------------------
// MODAL: CRIAR NOVA ENTREGA
// ----------------------------------------------------
export function openCreateDeliveryModal(initialValues = {}, onDone) {
  const clients = store.getState().clients || [];
  const projects = store.getState().projects || [];
  const columns = store.getState().deliveryColumns || [];
  const allTags = store.getState().deliveryTags || [];

  const modalEl = document.createElement('div');
  modalEl.id = 'create-delivery-modal';
  modalEl.className = 'fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fadeIn';

  modalEl.innerHTML = `
    <div class="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden my-6 animate-scaleUp">
      <div class="p-6 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
        <div class="flex items-center gap-2.5">
          <div class="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-300 flex items-center justify-center font-bold">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>
          </div>
          <div>
            <h3 class="font-bold text-base text-zinc-900 dark:text-zinc-100">Nova Entrega</h3>
            <p class="text-xs text-zinc-500">Cadastre uma nova demanda ou entregável operacional.</p>
          </div>
        </div>
        <button id="btn-close-create-modal" class="p-2 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
        </button>
      </div>

      <form id="create-delivery-form" class="p-6 space-y-4 max-h-[80vh] overflow-y-auto custom-scrollbar">
        <!-- TÍTULO -->
        <div>
          <label class="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase mb-1">Título da Entrega *</label>
          <input 
            type="text" 
            name="title" 
            required 
            placeholder="Ex: Landing Page Figma V1, Carrossel Instagram, Edição de Vídeo..." 
            class="w-full text-xs p-2.5 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-600 text-zinc-900 dark:text-zinc-100"
          />
        </div>

        <!-- CLIENTE & PROJETO -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase mb-1">Cliente Vinculado</label>
            <select name="clientId" id="create-select-client" class="w-full text-xs p-2.5 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-blue-600">
              <option value="">Selecione um cliente (opcional)</option>
              ${clients.map(c => `<option value="${c.id}" ${initialValues.clientId === c.id ? 'selected' : ''}>${c.name}</option>`).join('')}
            </select>
          </div>

          <div>
            <label class="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase mb-1">Projeto Vinculado</label>
            <select name="projectId" id="create-select-project" class="w-full text-xs p-2.5 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-blue-600">
              <option value="">Selecione um projeto (opcional)</option>
              ${projects.map(p => `<option value="${p.id}" ${initialValues.projectId === p.id ? 'selected' : ''}>${p.title}</option>`).join('')}
            </select>
          </div>
        </div>

        <!-- STATUS INICIAL & PRIORIDADE -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase mb-1">Coluna / Status Inicial</label>
            <select name="status" class="w-full text-xs p-2.5 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-blue-600">
              ${columns.map(c => `<option value="${c.id}" ${initialValues.status === c.id ? 'selected' : ''}>${c.title}</option>`).join('')}
            </select>
          </div>

          <div>
            <label class="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase mb-1">Prioridade</label>
            <select name="priority" class="w-full text-xs p-2.5 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-blue-600">
              <option value="baixa">Baixa</option>
              <option value="media" selected>Média</option>
              <option value="alta">Alta</option>
              <option value="urgente">Urgente</option>
            </select>
          </div>
        </div>

        <!-- RESPONSÁVEL & PRAZO -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase mb-1">Responsável</label>
            <input 
              type="text" 
              name="assignee" 
              value="${store.getState().profile.name}" 
              placeholder="Nome do responsável" 
              class="w-full text-xs p-2.5 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-600 text-zinc-900 dark:text-zinc-100"
            />
          </div>

          <div>
            <label class="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase mb-1">Prazo de Entrega</label>
            <input 
              type="date" 
              name="dueDate" 
              value="${new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]}" 
              class="w-full text-xs p-2.5 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-600 text-zinc-900 dark:text-zinc-100"
            />
          </div>
        </div>

        <!-- TAGS -->
        <div>
          <label class="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase mb-1">Tags / Etiquetas</label>
          <div class="flex flex-wrap gap-2 pt-1" id="create-tags-container">
            ${allTags.map(tag => `
              <label class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-zinc-200 dark:border-zinc-700 text-xs cursor-pointer select-none hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                <input type="checkbox" name="tags" value="${tag.name}" class="rounded text-blue-600 focus:ring-blue-600" />
                <span class="font-medium" style="color: ${tag.color || '#0000FF'}">${tag.name}</span>
              </label>
            `).join('')}
          </div>
        </div>

        <!-- DESCRIÇÃO -->
        <div>
          <label class="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase mb-1">Descrição & Diretrizes</label>
          <textarea 
            name="description" 
            rows="3" 
            placeholder="Instruções para a entrega, links de referência, objetivos..." 
            class="w-full text-xs p-2.5 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-600 text-zinc-900 dark:text-zinc-100"
          ></textarea>
        </div>

        <!-- IMAGEM DE CAPA (UPLOAD OU URL) -->
        <div>
          <label class="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase mb-1">Imagem de Capa (Opcional)</label>
          <div class="flex items-center gap-2">
            <input 
              type="text" 
              name="coverImage" 
              id="create-delivery-cover-input"
              placeholder="Cole a URL ou faça upload de imagem..." 
              class="flex-1 text-xs p-2.5 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-600 text-zinc-900 dark:text-zinc-100"
            />
            <input type="file" id="create-delivery-file-pick" accept="image/png,image/jpeg,image/jpg,image/webp" capture="environment" class="hidden" />
            <button type="button" id="btn-create-pick-cover" class="px-3 py-2.5 text-xs font-medium border border-zinc-200 dark:border-zinc-700 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors flex items-center gap-1.5 cursor-pointer">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg> Upload
            </button>
          </div>
        </div>

        <!-- BOTÕES -->
        <div class="pt-4 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-end gap-3">
          <button type="button" id="btn-cancel-create" class="px-4 py-2 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100">
            Cancelar
          </button>
          <button type="submit" class="px-5 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all shadow-sm">
            Criar Entrega
          </button>
        </div>
      </form>
    </div>
  `;

  document.body.appendChild(modalEl);

  const closeModal = () => modalEl.remove();
  modalEl.querySelector('#btn-close-create-modal').onclick = closeModal;
  modalEl.querySelector('#btn-cancel-create').onclick = closeModal;
  modalEl.onclick = (e) => {
    if (e.target === modalEl) closeModal();
  };

  const btnPickCover = modalEl.querySelector('#btn-create-pick-cover');
  const filePick = modalEl.querySelector('#create-delivery-file-pick');
  const coverInput = modalEl.querySelector('#create-delivery-cover-input');
  if (btnPickCover && filePick) {
    btnPickCover.onclick = () => filePick.click();
    filePick.onchange = async (e) => {
      const f = e.target.files[0];
      if (f) {
        try {
          const b64 = await storageService.fileToBase64(f);
          coverInput.value = b64;
          toast.show('Capa carregada!', 'info');
        } catch (err) {
          toast.show('Erro ao processar imagem: ' + err.message, 'error');
        }
      }
    };
  }

  const form = modalEl.querySelector('#create-delivery-form');
  form.onsubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(form);

    const checkedTags = [];
    form.querySelectorAll('input[name="tags"]:checked').forEach(chk => {
      const tagObj = allTags.find(t => t.name === chk.value) || { name: chk.value, color: '#0000FF' };
      checkedTags.push(tagObj);
    });

    const newDelivery = store.addDelivery({
      title: formData.get('title'),
      clientId: formData.get('clientId') || null,
      projectId: formData.get('projectId') || null,
      status: formData.get('status') || 'backlog',
      priority: formData.get('priority') || 'media',
      assignee: formData.get('assignee') || store.getState().profile.name,
      dueDate: formData.get('dueDate') || null,
      description: formData.get('description') || '',
      coverImage: formData.get('coverImage') || '',
      tags: checkedTags,
      checklist: [],
      files: [],
      comments: []
    });

    toast.show('Entrega criada com sucesso!', 'success');
    closeModal();
    if (onDone) onDone();
    if (newDelivery) {
      openDeliveryDetailModal(newDelivery.id, onDone);
    }
  };
}

// ----------------------------------------------------
// MODAL: GERENCIAR TAGS
// ----------------------------------------------------
export function openManageTagsModal(onDone) {
  const allTags = store.getState().deliveryTags || [];

  const modalEl = document.createElement('div');
  modalEl.id = 'manage-tags-modal';
  modalEl.className = 'fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fadeIn';

  modalEl.innerHTML = `
    <div class="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden my-6 animate-scaleUp">
      <div class="p-5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
        <h3 class="font-bold text-sm text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
          <svg class="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"/></svg> Gerenciar Tags de Entrega
        </h3>
        <button id="btn-close-tags-modal" class="p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-lg transition-colors">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
        </button>
      </div>

      <div class="p-5 space-y-4">
        <!-- Criar Nova Tag -->
        <div class="space-y-3 pb-4 border-b border-zinc-200 dark:border-zinc-800">
          <span class="text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase">Criar Nova Tag</span>
          <div class="flex gap-2">
            <input 
              type="text" 
              id="new-tag-name-input" 
              placeholder="Nome da tag (ex: 3D Render, Copy...)" 
              class="flex-1 text-xs px-3 py-1.5 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-blue-600"
            />
            <input 
              type="color" 
              id="new-tag-color-input" 
              value="#0000FF" 
              class="w-9 h-8 p-0.5 rounded-lg border border-zinc-200 dark:border-zinc-700 cursor-pointer"
            />
            <button id="btn-submit-new-tag" class="px-3 py-1.5 text-xs font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              Adicionar
            </button>
          </div>
        </div>

        <!-- Lista de Tags Existentes -->
        <div class="space-y-2">
          <span class="text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase">Tags Atuais</span>
          <div class="flex flex-wrap gap-2 pt-1">
            ${allTags.map(t => `
              <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border" style="background-color: ${t.color ? t.color + '15' : '#0000FF15'}; color: ${t.color || '#0000FF'}; border-color: ${t.color ? t.color + '40' : '#0000FF40'}">
                <span class="w-2 h-2 rounded-full" style="background-color: ${t.color || '#0000FF'}"></span>
                ${t.name}
              </span>
            `).join('')}
          </div>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(modalEl);

  const closeModal = () => {
    modalEl.remove();
    if (onDone) onDone();
  };
  modalEl.querySelector('#btn-close-tags-modal').onclick = closeModal;
  modalEl.onclick = (e) => {
    if (e.target === modalEl) closeModal();
  };

  const btnAdd = modalEl.querySelector('#btn-submit-new-tag');
  const inputName = modalEl.querySelector('#new-tag-name-input');
  const inputColor = modalEl.querySelector('#new-tag-color-input');

  btnAdd.onclick = () => {
    const name = inputName.value.trim();
    const color = inputColor.value;
    if (name) {
      store.addDeliveryTag({ name, color });
      toast.show('Tag criada com sucesso!', 'success');
      closeModal();
      openManageTagsModal(onDone);
    }
  };
}

// ----------------------------------------------------
// MODAL: ADICIONAR COLUNA NO KANBAN
// ----------------------------------------------------
function openAddColumnModal(onDone) {
  const colName = prompt('Nome da nova coluna do Kanban:');
  if (colName && colName.trim()) {
    store.addDeliveryColumn(colName.trim());
    toast.show('Coluna adicionada!', 'success');
    if (onDone) onDone();
  }
}

// ----------------------------------------------------
// MODAL: OPÇÕES DA COLUNA
// ----------------------------------------------------
function openColumnOptionsModal(colId, colTitle, onDone) {
  const action = prompt(`Coluna: "${colTitle}"\nDigite:\n1 - Renomear coluna\n2 - Excluir coluna\n(ou Cancelar)`);
  if (action === '1') {
    const newName = prompt('Novo nome para a coluna:', colTitle);
    if (newName && newName.trim()) {
      store.renameDeliveryColumn(colId, newName.trim());
      toast.show('Coluna renomeada!', 'info');
      if (onDone) onDone();
    }
  } else if (action === '2') {
    if (confirm(`Deseja realmente excluir a coluna "${colTitle}"?`)) {
      store.deleteDeliveryColumn(colId);
      toast.show('Coluna removida.', 'info');
      if (onDone) onDone();
    }
  }
}

// ----------------------------------------------------
// MENU CONTEXTUAL RÁPIDO DO CARD
// ----------------------------------------------------
function openDeliveryQuickActionsMenu(deliveryId, event, onDone) {
  const existing = document.getElementById('card-quick-menu');
  if (existing) existing.remove();

  const menu = document.createElement('div');
  menu.id = 'card-quick-menu';
  menu.className = 'fixed z-50 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl py-1 text-xs w-44 animate-fadeIn';
  menu.style.top = `${event.clientY + 5}px`;
  menu.style.left = `${Math.min(event.clientX, window.innerWidth - 180)}px`;

  menu.innerHTML = `
    <button class="w-full text-left px-3 py-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-900 dark:text-zinc-100 flex items-center gap-2" id="qm-detail">
      <svg class="w-4 h-4 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg> Abrir Detalhes
    </button>
    <button class="w-full text-left px-3 py-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-900 dark:text-zinc-100 flex items-center gap-2" id="qm-dup">
      <svg class="w-4 h-4 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg> Duplicar
    </button>
    <div class="h-px bg-zinc-100 dark:bg-zinc-800 my-1"></div>
    <button class="w-full text-left px-3 py-2 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 flex items-center gap-2" id="qm-del">
      <svg class="w-4 h-4 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg> Excluir
    </button>
  `;

  document.body.appendChild(menu);

  menu.querySelector('#qm-detail').onclick = () => {
    menu.remove();
    openDeliveryDetailModal(deliveryId, onDone);
  };
  menu.querySelector('#qm-dup').onclick = () => {
    menu.remove();
    store.duplicateDelivery(deliveryId);
    toast.show('Entrega duplicada!', 'success');
    if (onDone) onDone();
  };
  menu.querySelector('#qm-del').onclick = () => {
    menu.remove();
    if (confirm('Deseja excluir esta entrega?')) {
      store.deleteDelivery(deliveryId);
      toast.show('Entrega excluída.', 'info');
      if (onDone) onDone();
    }
  };

  const closeMenu = (e) => {
    if (!menu.contains(e.target)) {
      menu.remove();
      document.removeEventListener('click', closeMenu);
    }
  };
  setTimeout(() => document.addEventListener('click', closeMenu), 50);
}
