import { store } from '../state/store.js';
import { modal } from '../components/Modal.js';
import { toast } from '../components/Toast.js';
import { formatCurrency, formatDate, getStatusBadge } from '../utils/formatters.js';
import { renderExportButtonHtml, bindExportButton } from '../components/ExportMenu.js';
import { getInstallmentStatusBadge, openEditTransactionModal, openTransactionModal } from './FinanceView.js';

let projectViewMode = 'kanban'; // kanban | list

export function renderProjectsView(container, onNavigate) {
  const { projects, clients, services } = store.getState();

  const stages = [
    { id: 'proposta', title: 'Proposta' },
    { id: 'briefing', title: 'Briefing' },
    { id: 'pesquisa', title: 'Pesquisa' },
    { id: 'conceito', title: 'Conceito' },
    { id: 'desenvolvimento', title: 'Desenvolvimento' },
    { id: 'revisao', title: 'Revisão' },
    { id: 'finalizacao', title: 'Finalização' },
    { id: 'entrega', title: 'Entrega' },
    { id: 'pago', title: 'Pago' },
    { id: 'cancelado', title: 'Cancelado' }
  ];

  const activeCount = projects.filter(p => p.stage !== 'entrega' && p.stage !== 'pago' && p.stage !== 'cancelado').length;
  const completedCount = projects.filter(p => p.stage === 'entrega' || p.stage === 'pago').length;
  const urgentCount = projects.filter(p => p.priority === 'urgente' && p.stage !== 'entrega' && p.stage !== 'pago').length;
  const totalValue = projects.reduce((acc, p) => acc + (p.value || 0), 0);

  container.innerHTML = `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 class="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">Gerenciamento de Projetos</h2>
          <p class="text-xs text-zinc-500">Pipeline de produção criativa de 10 etapas, centro operacional, checklists e financeiro integrado.</p>
        </div>
        <div class="flex items-center gap-2">
          <!-- View Toggle -->
          <div class="flex items-center p-1 bg-zinc-100 dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700">
            <button id="proj-view-kanban" class="px-3 py-1 text-xs font-medium rounded-lg transition-colors ${projectViewMode === 'kanban' ? 'bg-white dark:bg-zinc-700 text-blue-600 shadow-2xs font-semibold' : 'text-zinc-500'}">Kanban</button>
            <button id="proj-view-list" class="px-3 py-1 text-xs font-medium rounded-lg transition-colors ${projectViewMode === 'list' ? 'bg-white dark:bg-zinc-700 text-blue-600 shadow-2xs font-semibold' : 'text-zinc-500'}">Lista</button>
          </div>

          ${renderExportButtonHtml('projects-export-dropdown')}

          <button id="proj-new-btn" class="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition-colors shadow-xs">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
            <span>Novo Projeto</span>
          </button>
        </div>
      </div>

      <!-- Indicators -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div class="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-2xs">
          <div class="text-[11px] font-medium text-zinc-500">Projetos Ativos</div>
          <div class="text-lg font-bold text-blue-600 dark:text-blue-400 mt-1">${activeCount} em produção</div>
          <div class="text-[10px] text-zinc-400 mt-0.5">Fluxo de trabalho aberto</div>
        </div>

        <div class="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-2xs">
          <div class="text-[11px] font-medium text-zinc-500">Urgentes / Atenção</div>
          <div class="text-lg font-bold text-rose-600 mt-1">${urgentCount} projetos</div>
          <div class="text-[10px] text-zinc-400 mt-0.5">Atenção ao prazo</div>
        </div>

        <div class="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-2xs">
          <div class="text-[11px] font-medium text-zinc-500">Concluídos / Entregues</div>
          <div class="text-lg font-bold text-emerald-600 mt-1">${completedCount} concluídos</div>
          <div class="text-[10px] text-zinc-400 mt-0.5">Finalizados com sucesso</div>
        </div>

        <div class="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-2xs">
          <div class="text-[11px] font-medium text-zinc-500">Receita em Projetos</div>
          <div class="text-lg font-bold text-zinc-900 dark:text-zinc-100 mt-1">${formatCurrency(totalValue)}</div>
          <div class="text-[10px] text-zinc-400 mt-0.5">Valor global contratado</div>
        </div>
      </div>

      <!-- Main Content Area -->
      <div id="projects-content-area"></div>
    </div>
  `;

  const contentArea = container.querySelector('#projects-content-area');

  function render() {
    if (projectViewMode === 'kanban') {
      renderProjectsKanban(contentArea, projects, stages, onNavigate);
    } else {
      renderProjectsList(contentArea, projects, onNavigate);
    }
  }

  container.querySelector('#proj-view-kanban').onclick = () => {
    projectViewMode = 'kanban';
    renderProjectsView(container, onNavigate);
  };
  container.querySelector('#proj-view-list').onclick = () => {
    projectViewMode = 'list';
    renderProjectsView(container, onNavigate);
  };

  // Universal Export Handler
  bindExportButton(container, 'projects-export-dropdown', () => {
    const headers = ['Título', 'Cliente', 'Serviço', 'Valor', 'Estágio', 'Prioridade', 'Prazo', 'Progresso'];
    const rows = projects.map(p => [
      p.title || '',
      p.clientName || '-',
      p.serviceName || '-',
      formatCurrency(p.value || 0),
      p.stage || '',
      (p.priority || '').toUpperCase(),
      formatDate(p.deadlineDate),
      `${p.progress || 0}%`
    ]);

    const summary = [
      { label: 'Total de Projetos', value: projects.length },
      { label: 'Projetos Ativos', value: activeCount },
      { label: 'Concluídos', value: completedCount },
      { label: 'Receita Total Contratada', value: formatCurrency(totalValue) }
    ];

    return {
      filename: `projetos_${new Date().toISOString().split('T')[0]}`,
      title: 'Relatório Geral de Gerenciamento de Projetos',
      headers,
      rows,
      summary,
      filters: `Total de Projetos: ${projects.length}`
    };
  });

  container.querySelector('#proj-new-btn').onclick = () => {
    openCreateProjectModal(() => renderProjectsView(container, onNavigate));
  };

  render();
}

function renderProjectsKanban(contentArea, projects, stages, onNavigate) {
  contentArea.innerHTML = `
    <div class="flex gap-4 overflow-x-auto pb-6 pt-1 snap-x select-none">
      ${stages.map(stg => {
        const stgProjects = projects.filter(p => p.stage === stg.id || (stg.id === 'desenvolvimento' && p.stage === 'em_andamento'));
        return `
          <div class="w-72 shrink-0 flex flex-col bg-zinc-50/80 dark:bg-zinc-900/60 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 p-3 min-h-[500px]" data-stage="${stg.id}">
            <div class="flex items-center justify-between pb-3 border-b border-zinc-200/60 dark:border-zinc-800/80 px-1">
              <span class="text-xs font-bold text-zinc-900 dark:text-zinc-100">${stg.title}</span>
              <span class="text-[10px] bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 px-1.5 py-0.5 rounded-full font-semibold text-zinc-500">${stgProjects.length}</span>
            </div>

            <!-- Dropzone -->
            <div class="flex-1 space-y-2.5 overflow-y-auto pt-2 proj-dropzone" data-target-stage="${stg.id}">
              ${stgProjects.length === 0 ? `
                <div class="h-28 border-2 border-dashed border-zinc-200/60 dark:border-zinc-800/60 rounded-xl flex items-center justify-center text-[11px] text-zinc-400">
                  Vazio
                </div>
              ` : stgProjects.map(proj => {
                const completedTasks = proj.tasks ? proj.tasks.filter(t => t.completed).length : 0;
                const totalTasks = proj.tasks ? proj.tasks.length : 1;
                const percent = Math.round((completedTasks / totalTasks) * 100);

                return `
                  <div 
                    draggable="true" 
                    data-project-id="${proj.id}" 
                    class="proj-card p-3.5 rounded-xl bg-white dark:bg-zinc-850 border border-zinc-200/70 dark:border-zinc-800 shadow-2xs hover:shadow-xs hover:border-blue-400 dark:hover:border-blue-600 cursor-grab active:cursor-grabbing transition-all"
                  >
                    <div class="flex items-start justify-between gap-1 mb-1.5">
                      <span class="font-semibold text-xs text-zinc-900 dark:text-zinc-100 leading-tight">${proj.title}</span>
                      <span class="text-[10px] font-bold text-blue-600 dark:text-blue-400 shrink-0">${formatCurrency(proj.value)}</span>
                    </div>

                    <div class="text-[11px] text-zinc-500 dark:text-zinc-400 truncate mb-2">
                      ${proj.clientName}
                    </div>

                    <!-- Progress Bar -->
                    <div class="space-y-1 mb-2">
                      <div class="flex justify-between text-[10px] text-zinc-400">
                        <span>Checklist: ${completedTasks}/${totalTasks}</span>
                        <span>${percent}%</span>
                      </div>
                      <div class="w-full bg-zinc-100 dark:bg-zinc-700 h-1.5 rounded-full overflow-hidden">
                        <div class="bg-blue-600 h-full rounded-full transition-all" style="width: ${percent}%"></div>
                      </div>
                    </div>

                    <div class="flex items-center justify-between text-[10px] text-zinc-400 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                      <span>Prazo: ${formatDate(proj.deadlineDate)}</span>
                      ${getStatusBadge(proj.priority)}
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;

  setupProjectsDragAndDrop(contentArea, onNavigate);
}

function setupProjectsDragAndDrop(contentArea, onNavigate) {
  let draggedProjId = null;

  contentArea.querySelectorAll('.proj-card').forEach(card => {
    card.addEventListener('dragstart', (e) => {
      draggedProjId = card.getAttribute('data-project-id');
      card.classList.add('opacity-40');
      e.dataTransfer.setData('text/plain', draggedProjId);
    });

    card.addEventListener('dragend', () => {
      card.classList.remove('opacity-40');
    });

    card.onclick = () => {
      const id = card.getAttribute('data-project-id');
      openProjectDetailsModal(id, () => renderProjectsView(contentArea.parentElement.parentElement, onNavigate), onNavigate);
    };
  });

  contentArea.querySelectorAll('.proj-dropzone').forEach(zone => {
    zone.addEventListener('dragover', (e) => {
      e.preventDefault();
      zone.classList.add('bg-blue-50/40', 'dark:bg-blue-950/20', 'rounded-xl');
    });

    zone.addEventListener('dragleave', () => {
      zone.classList.remove('bg-blue-50/40', 'dark:bg-blue-950/20', 'rounded-xl');
    });

    zone.addEventListener('drop', (e) => {
      e.preventDefault();
      zone.classList.remove('bg-blue-50/40', 'dark:bg-blue-950/20', 'rounded-xl');
      const targetStage = zone.getAttribute('data-target-stage');
      if (draggedProjId && targetStage) {
        store.updateProject(draggedProjId, { stage: targetStage });
        toast.info(`Projeto movido para ${targetStage.replace('_', ' ').toUpperCase()}!`);
        renderProjectsView(contentArea.parentElement.parentElement, onNavigate);
      }
    });
  });
}

function renderProjectsList(contentArea, projects, onNavigate) {
  contentArea.innerHTML = `
    <div class="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-2xs">
      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs text-zinc-600 dark:text-zinc-400">
          <thead class="bg-zinc-50 dark:bg-zinc-850 text-zinc-900 dark:text-zinc-200 border-b border-zinc-200 dark:border-zinc-800 font-semibold">
            <tr>
              <th class="p-3.5">Projeto</th>
              <th class="p-3.5">Cliente</th>
              <th class="p-3.5">Valor</th>
              <th class="p-3.5">Estágio</th>
              <th class="p-3.5">Prioridade</th>
              <th class="p-3.5">Prazo de Entrega</th>
              <th class="p-3.5 text-right">Ação</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-zinc-100 dark:divide-zinc-800">
            ${projects.map(p => `
              <tr class="hover:bg-zinc-50/70 dark:hover:bg-zinc-850/50 cursor-pointer transition-colors" data-project-id="${p.id}">
                <td class="p-3.5 font-bold text-zinc-900 dark:text-zinc-100">${p.title}</td>
                <td class="p-3.5">${p.clientName}</td>
                <td class="p-3.5 font-bold text-blue-600 dark:text-blue-400">${formatCurrency(p.value)}</td>
                <td class="p-3.5">${getStatusBadge(p.stage)}</td>
                <td class="p-3.5">${getStatusBadge(p.priority)}</td>
                <td class="p-3.5">${formatDate(p.deadlineDate)}</td>
                <td class="p-3.5 text-right">
                  <button class="text-blue-600 hover:text-blue-700 font-medium px-2 py-1 rounded hover:bg-blue-50 dark:hover:bg-blue-950/40">Central 360°</button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;

  contentArea.querySelectorAll('tr[data-project-id]').forEach(row => {
    row.onclick = () => {
      const id = row.getAttribute('data-project-id');
      openProjectDetailsModal(id, () => renderProjectsView(contentArea.parentElement.parentElement, onNavigate), onNavigate);
    };
  });
}

export function openProjectDetailsModal(projectId, onRefresh, onNavigate) {
  const state = store.getState();
  const proj = state.projects.find(p => p.id === projectId);
  if (!proj) return;

  const projectDeliveries = (state.deliveries || []).filter(d => d.projectId === proj.id || (d.projectName && d.projectName.toLowerCase() === proj.title.toLowerCase()));
  const completedDeliveries = projectDeliveries.filter(d => d.status === 'entregue').length;

  const projectTransactions = (state.transactions || []).filter(t => t.projectId === proj.id || (t.title && t.title.toLowerCase().includes(proj.title.toLowerCase())));
  const totalPaid = projectTransactions.filter(t => t.type === 'income' && t.status === 'paid').reduce((acc, t) => acc + (t.amount || 0), 0);
  const totalPending = (proj.value || 0) - totalPaid > 0 ? (proj.value || 0) - totalPaid : 0;

  const projectDocuments = (state.documents || []).filter(d => d.projectId === proj.id || (proj.clientId && d.clientId === proj.clientId));

  const stagesList = [
    { id: 'proposta', title: 'Proposta' },
    { id: 'briefing', title: 'Briefing' },
    { id: 'pesquisa', title: 'Pesquisa' },
    { id: 'conceito', title: 'Conceito' },
    { id: 'desenvolvimento', title: 'Desenvolvimento' },
    { id: 'revisao', title: 'Revisão' },
    { id: 'finalizacao', title: 'Finalização' },
    { id: 'entrega', title: 'Entrega' },
    { id: 'pago', title: 'Pago' },
    { id: 'cancelado', title: 'Cancelado' }
  ];

  const currentStageIndex = stagesList.findIndex(s => s.id === proj.stage || (s.id === 'desenvolvimento' && proj.stage === 'em_andamento'));

  // Calculate overall operational progress
  const tasks = proj.tasks || [];
  const completedTasks = tasks.filter(t => t.completed).length;
  const totalItems = (tasks.length + projectDeliveries.length) || 1;
  const totalCompleted = completedTasks + completedDeliveries;
  const globalProgress = Math.round((totalCompleted / totalItems) * 100);

  const links = proj.links || {};

  const content = `
    <div class="space-y-4">
      <!-- Header Info Strip -->
      <div class="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 space-y-3">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div class="flex items-center gap-2 flex-wrap">
              <span class="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100">${proj.title}</span>
              <select id="proj-drawer-stage-select" class="px-2 py-0.5 text-xs font-semibold rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-850 text-zinc-800 dark:text-zinc-200 cursor-pointer shadow-2xs">
                ${stagesList.map(s => `
                  <option value="${s.id}" ${(proj.stage === s.id || (s.id === 'desenvolvimento' && proj.stage === 'em_andamento')) ? 'selected' : ''}>
                    ${s.title}
                  </option>
                `).join('')}
              </select>
              ${getStatusBadge(proj.priority)}
            </div>
            <div class="text-xs text-zinc-500 dark:text-zinc-400 mt-1 flex items-center gap-2">
              <span>Cliente: <b class="text-zinc-800 dark:text-zinc-200">${proj.clientName || 'Cliente Direto'}</b></span>
              ${proj.clientId ? `
                <button id="proj-open-client-btn" class="text-blue-600 hover:underline font-medium text-[11px]">Ver 360° do Cliente</button>
              ` : ''}
            </div>
          </div>

          <div class="text-left sm:text-right">
            <span class="text-[10px] text-zinc-400 uppercase font-bold block">Valor do Projeto</span>
            <span class="text-base sm:text-lg font-bold text-blue-600 dark:text-blue-400">${formatCurrency(proj.value)}</span>
          </div>
        </div>

        <!-- Quick Project Actions Strip -->
        <div class="flex items-center gap-2 overflow-x-auto pt-2 border-t border-zinc-200/60 dark:border-zinc-700/60 text-xs">
          <button id="quick-add-proj-delivery" class="px-2.5 py-1 bg-white dark:bg-zinc-850 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg font-medium text-zinc-700 dark:text-zinc-300 shrink-0 transition-colors flex items-center gap-1">
            <svg class="w-3.5 h-3.5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
            <span>+ Nova Entrega</span>
          </button>
          <button id="quick-add-proj-task" class="px-2.5 py-1 bg-white dark:bg-zinc-850 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg font-medium text-zinc-700 dark:text-zinc-300 shrink-0 transition-colors flex items-center gap-1">
            <svg class="w-3.5 h-3.5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
            <span>+ Nova Tarefa</span>
          </button>
          <button id="quick-add-proj-finance" class="px-2.5 py-1 bg-white dark:bg-zinc-850 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg font-medium text-zinc-700 dark:text-zinc-300 shrink-0 transition-colors flex items-center gap-1">
            <svg class="w-3.5 h-3.5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            <span>+ Lançar Receita</span>
          </button>
          <button id="quick-advance-stage" class="px-2.5 py-1 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 border border-blue-200 dark:border-blue-800/60 rounded-lg font-semibold text-blue-700 dark:text-blue-300 shrink-0 transition-colors flex items-center gap-1">
            <span>Avançar Etapa ➔</span>
          </button>
        </div>
      </div>

      <!-- Tab Buttons -->
      <div class="flex items-center gap-1.5 border-b border-zinc-200 dark:border-zinc-800 pb-2 text-xs font-medium overflow-x-auto">
        <button id="ptab-overview" class="proj-tab px-3 py-1.5 rounded-lg bg-blue-600 text-white shrink-0 font-semibold shadow-2xs">Visão Geral</button>
        <button id="ptab-schedule" class="proj-tab px-3 py-1.5 rounded-lg text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 shrink-0">Etapas (10)</button>
        <button id="ptab-deliveries" class="proj-tab px-3 py-1.5 rounded-lg text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 shrink-0">Entregas (${projectDeliveries.length})</button>
        <button id="ptab-tasks" class="proj-tab px-3 py-1.5 rounded-lg text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 shrink-0">Tarefas (${tasks.length})</button>
        <button id="ptab-finance" class="proj-tab px-3 py-1.5 rounded-lg text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 shrink-0">Financeiro (${projectTransactions.length})</button>
        <button id="ptab-docs" class="proj-tab px-3 py-1.5 rounded-lg text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 shrink-0">Arquivos (${projectDocuments.length})</button>
      </div>

      <!-- Tab Content Container -->
      <div id="proj-tab-content" class="min-h-[280px] text-xs"></div>
    </div>
  `;

  const drawer = modal.open({
    title: `Centro de Comando — ${proj.title}`,
    content,
    isDrawer: true
  });

  const tabContainer = drawer.panel.querySelector('#proj-tab-content');
  const tabs = drawer.panel.querySelectorAll('.proj-tab');

  const setTab = (target) => {
    tabs.forEach(t => {
      t.className = 'proj-tab px-3 py-1.5 rounded-lg text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 shrink-0 font-medium transition-colors';
    });
    target.className = 'proj-tab px-3 py-1.5 rounded-lg bg-blue-600 text-white shrink-0 font-semibold shadow-2xs';
  };

  function renderOverview() {
    tabContainer.innerHTML = `
      <div class="space-y-4">
        <!-- 4 Project Metrics Cards -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div class="p-3 bg-zinc-50 dark:bg-zinc-800/40 rounded-xl border border-zinc-100 dark:border-zinc-800">
            <span class="text-zinc-400 block text-[10px] uppercase font-bold">Valor Total</span>
            <span class="text-base font-bold text-blue-600 dark:text-blue-400 mt-0.5 block">${formatCurrency(proj.value)}</span>
          </div>
          <div class="p-3 bg-zinc-50 dark:bg-zinc-800/40 rounded-xl border border-zinc-100 dark:border-zinc-800">
            <span class="text-zinc-400 block text-[10px] uppercase font-bold">Total Recebido</span>
            <span class="text-base font-bold text-emerald-600 mt-0.5 block">${formatCurrency(totalPaid)}</span>
          </div>
          <div class="p-3 bg-zinc-50 dark:bg-zinc-800/40 rounded-xl border border-zinc-100 dark:border-zinc-800">
            <span class="text-zinc-400 block text-[10px] uppercase font-bold">Saldo a Receber</span>
            <span class="text-base font-bold text-amber-600 mt-0.5 block">${formatCurrency(totalPending)}</span>
          </div>
          <div class="p-3 bg-zinc-50 dark:bg-zinc-800/40 rounded-xl border border-zinc-100 dark:border-zinc-800">
            <span class="text-zinc-400 block text-[10px] uppercase font-bold">Progresso Geral</span>
            <span class="text-base font-bold text-zinc-900 dark:text-zinc-100 mt-0.5 block">${globalProgress}%</span>
          </div>
        </div>

        <!-- Project Schedule & Details -->
        <div class="p-3.5 bg-zinc-50 dark:bg-zinc-800/40 rounded-xl border border-zinc-100 dark:border-zinc-800 space-y-2.5">
          <span class="text-zinc-400 block text-[10px] uppercase font-bold tracking-wider">Cronograma & Informações</span>
          <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div>
              <span class="text-zinc-400 block text-[11px]">Data de Início</span>
              <span class="font-medium text-zinc-800 dark:text-zinc-200">${formatDate(proj.startDate || proj.createdAt)}</span>
            </div>
            <div>
              <span class="text-zinc-400 block text-[11px]">Prazo de Entrega</span>
              <span class="font-medium text-zinc-800 dark:text-zinc-200">${formatDate(proj.deadlineDate)}</span>
            </div>
            <div>
              <span class="text-zinc-400 block text-[11px]">Responsável</span>
              <span class="font-medium text-zinc-800 dark:text-zinc-200">${proj.responsible || 'Nathan Antenor'}</span>
            </div>
          </div>
        </div>

        <!-- External Tools & Links -->
        <div class="p-3.5 bg-zinc-50 dark:bg-zinc-800/40 rounded-xl border border-zinc-100 dark:border-zinc-800 space-y-2.5">
          <div class="flex items-center justify-between">
            <span class="text-zinc-400 block text-[10px] uppercase font-bold tracking-wider">Links & Ferramentas do Projeto</span>
            <button id="save-proj-links-btn" class="text-blue-600 hover:underline text-[11px] font-semibold">Salvar Links</button>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <div class="flex items-center gap-1.5">
              <span class="w-16 text-zinc-400 shrink-0 font-medium">Figma:</span>
              <input id="link-figma" value="${links.figma || ''}" placeholder="https://figma.com/file/..." class="flex-1 px-2.5 py-1 bg-white dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs">
              ${links.figma ? `<a href="${links.figma}" target="_blank" class="p-1 text-blue-600 hover:bg-blue-50 rounded">↗</a>` : ''}
            </div>
            <div class="flex items-center gap-1.5">
              <span class="w-16 text-zinc-400 shrink-0 font-medium">Drive:</span>
              <input id="link-drive" value="${links.drive || ''}" placeholder="https://drive.google.com/..." class="flex-1 px-2.5 py-1 bg-white dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs">
              ${links.drive ? `<a href="${links.drive}" target="_blank" class="p-1 text-blue-600 hover:bg-blue-50 rounded">↗</a>` : ''}
            </div>
            <div class="flex items-center gap-1.5">
              <span class="w-16 text-zinc-400 shrink-0 font-medium">Notion:</span>
              <input id="link-notion" value="${links.notion || ''}" placeholder="https://notion.so/..." class="flex-1 px-2.5 py-1 bg-white dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs">
              ${links.notion ? `<a href="${links.notion}" target="_blank" class="p-1 text-blue-600 hover:bg-blue-50 rounded">↗</a>` : ''}
            </div>
            <div class="flex items-center gap-1.5">
              <span class="w-16 text-zinc-400 shrink-0 font-medium">GitHub:</span>
              <input id="link-github" value="${links.github || ''}" placeholder="https://github.com/..." class="flex-1 px-2.5 py-1 bg-white dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs">
              ${links.github ? `<a href="${links.github}" target="_blank" class="p-1 text-blue-600 hover:bg-blue-50 rounded">↗</a>` : ''}
            </div>
          </div>
        </div>

        <!-- Notes / Briefing -->
        <div class="p-3.5 bg-zinc-50 dark:bg-zinc-800/40 rounded-xl border border-zinc-100 dark:border-zinc-800">
          <span class="text-zinc-400 block text-[10px] uppercase font-bold tracking-wider mb-1">Briefing & Observações</span>
          <textarea id="proj-drawer-notes" rows="3" class="w-full px-3 py-2 bg-white dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs text-zinc-800 dark:text-zinc-200 leading-relaxed">${proj.notes || ''}</textarea>
          <div class="flex justify-end mt-2">
            <button id="save-proj-notes-btn" class="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold">Salvar Notas</button>
          </div>
        </div>

        <div class="flex justify-between items-center pt-2 border-t border-zinc-100 dark:border-zinc-800">
          <button id="proj-delete-action-btn" class="text-rose-600 hover:text-rose-700 text-xs font-medium">Excluir Projeto</button>
        </div>
      </div>
    `;

    // Save links
    const saveLinksBtn = tabContainer.querySelector('#save-proj-links-btn');
    if (saveLinksBtn) {
      saveLinksBtn.onclick = () => {
        const updatedLinks = {
          figma: tabContainer.querySelector('#link-figma').value.trim(),
          drive: tabContainer.querySelector('#link-drive').value.trim(),
          notion: tabContainer.querySelector('#link-notion').value.trim(),
          github: tabContainer.querySelector('#link-github').value.trim()
        };
        store.updateProject(proj.id, { links: updatedLinks });
        toast.success('Links do projeto atualizados!');
        renderOverview();
      };
    }

    // Save notes
    const saveNotesBtn = tabContainer.querySelector('#save-proj-notes-btn');
    if (saveNotesBtn) {
      saveNotesBtn.onclick = () => {
        const notes = tabContainer.querySelector('#proj-drawer-notes').value;
        store.updateProject(proj.id, { notes });
        toast.success('Notas salvas com sucesso!');
      };
    }

    // Delete
    const deleteBtn = tabContainer.querySelector('#proj-delete-action-btn');
    if (deleteBtn) {
      deleteBtn.onclick = () => {
        if (confirm(`Deseja excluir permanentemente o projeto '${proj.title}'?`)) {
          store.deleteProject(proj.id);
          toast.info('Projeto removido.');
          drawer.close();
          if (onRefresh) onRefresh();
        }
      };
    }
  }

  function renderSchedule() {
    tabContainer.innerHTML = `
      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <div>
            <span class="text-xs font-bold text-zinc-900 dark:text-zinc-100 block">Linha de Produção Criativa (10 Etapas)</span>
            <span class="text-[11px] text-zinc-400">Estágio atual: <b class="text-blue-600 capitalize">${proj.stage.replace('_', ' ')}</b></span>
          </div>
          <button id="step-advance-btn" class="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-2xs transition-colors">
            Avançar Próxima Etapa ➔
          </button>
        </div>

        <!-- 10 Steps Pipeline -->
        <div class="space-y-2">
          ${stagesList.map((stg, i) => {
            const isCurrent = stg.id === proj.stage || (stg.id === 'desenvolvimento' && proj.stage === 'em_andamento');
            const isPast = currentStageIndex > i;
            return `
              <div class="p-3 rounded-xl border flex items-center justify-between transition-all ${
                isCurrent ? 'bg-blue-50/80 dark:bg-blue-950/40 border-blue-400 dark:border-blue-600 shadow-2xs' :
                isPast ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40 opacity-80' :
                'bg-zinc-50 dark:bg-zinc-800/30 border-zinc-200/60 dark:border-zinc-800 opacity-60'
              }">
                <div class="flex items-center gap-3">
                  <div class="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    isCurrent ? 'bg-blue-600 text-white' :
                    isPast ? 'bg-emerald-600 text-white' :
                    'bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300'
                  }">
                    ${isPast ? '✓' : (i + 1)}
                  </div>
                  <div>
                    <span class="font-bold text-xs ${isCurrent ? 'text-blue-900 dark:text-blue-200' : 'text-zinc-800 dark:text-zinc-200'}">${stg.title}</span>
                    <span class="text-[10px] text-zinc-400 block">${
                      isCurrent ? 'Fase em execução ativa' :
                      isPast ? 'Fase concluída com sucesso' :
                      'Aguardando conclusão de etapas anteriores'
                    }</span>
                  </div>
                </div>
                <div>
                  ${!isCurrent ? `
                    <button class="set-stage-btn px-2.5 py-1 text-[11px] font-semibold text-zinc-500 hover:text-blue-600 hover:bg-white dark:hover:bg-zinc-700 rounded-lg transition-colors border border-transparent hover:border-zinc-200 dark:hover:border-zinc-700" data-stage="${stg.id}">
                      Mudar para cá
                    </button>
                  ` : `
                    <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300">EM ANDAMENTO</span>
                  `}
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;

    // Advance button
    const advBtn = tabContainer.querySelector('#step-advance-btn');
    if (advBtn) {
      advBtn.onclick = () => {
        if (currentStageIndex < stagesList.length - 1) {
          const nextStage = stagesList[currentStageIndex + 1].id;
          store.updateProject(proj.id, { stage: nextStage });
          toast.success(`Projeto avançado para '${stagesList[currentStageIndex + 1].title}'! (+20 XP)`);
          store.addXP(20, `Projeto avançado de etapa`);
          drawer.close();
          openProjectDetailsModal(proj.id, onRefresh, onNavigate);
          if (onRefresh) onRefresh();
        } else {
          toast.info('Projeto já está na etapa final.');
        }
      };
    }

    // Set stage buttons
    tabContainer.querySelectorAll('.set-stage-btn').forEach(btn => {
      btn.onclick = () => {
        const targetStg = btn.getAttribute('data-stage');
        store.updateProject(proj.id, { stage: targetStg });
        toast.info(`Estágio alterado para ${targetStg.toUpperCase()}`);
        drawer.close();
        openProjectDetailsModal(proj.id, onRefresh, onNavigate);
        if (onRefresh) onRefresh();
      };
    });
  }

  function renderDeliveries() {
    tabContainer.innerHTML = `
      <div class="space-y-3">
        <div class="flex items-center justify-between">
          <div>
            <span class="text-xs font-bold text-zinc-900 dark:text-zinc-100 block">Entregas & Demandas Operacionais (${completedDeliveries}/${projectDeliveries.length})</span>
            <span class="text-[10px] text-zinc-400">Demandas integradas ao módulo Entregas com checklist e prazos</span>
          </div>
          <button id="add-proj-deliv-btn" class="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition-colors">
            + Nova Entrega
          </button>
        </div>

        ${projectDeliveries.length === 0 ? `
          <div class="p-6 text-center bg-zinc-50 dark:bg-zinc-850 rounded-2xl border border-zinc-200 dark:border-zinc-800">
            <p class="text-zinc-400 text-xs">Nenhum entregável cadastrado para este projeto.</p>
            <button id="empty-add-proj-deliv" class="mt-2.5 px-3 py-1.5 bg-indigo-600 text-white rounded-xl text-xs font-semibold">Cadastrar Primeira Entrega</button>
          </div>
        ` : `
          <div class="space-y-2">
            ${projectDeliveries.map(d => {
              const checklist = d.checklist || [];
              const checksDone = checklist.filter(c => c.completed).length;
              return `
                <div class="p-3 bg-zinc-50 dark:bg-zinc-800/40 rounded-xl border border-zinc-100 dark:border-zinc-800 flex items-center justify-between gap-3">
                  <div>
                    <div class="font-semibold text-zinc-900 dark:text-zinc-100 text-xs">${d.title}</div>
                    <div class="text-[11px] text-zinc-400 mt-0.5">
                      Prazo: ${d.dueDate ? d.dueDate.split('-').reverse().join('/') : 'Sem prazo'} • Checklist: ${checksDone}/${checklist.length}
                    </div>
                  </div>
                  <div class="flex items-center gap-2 shrink-0">
                    <span class="px-2 py-0.5 rounded text-[10px] font-bold ${
                      d.priority === 'urgente' ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400' :
                      d.priority === 'alta' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400' :
                      'bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-400'
                    }">${(d.priority || 'media').toUpperCase()}</span>
                    <span class="text-xs font-semibold text-indigo-600 capitalize">${d.status}</span>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        `}
      </div>
    `;

    const addBtn = tabContainer.querySelector('#add-proj-deliv-btn');
    if (addBtn) addBtn.onclick = () => openCreateDeliveryForProjectModal(proj, () => { drawer.close(); openProjectDetailsModal(proj.id, onRefresh, onNavigate); });
    const emptyBtn = tabContainer.querySelector('#empty-add-proj-deliv');
    if (emptyBtn) emptyBtn.onclick = () => openCreateDeliveryForProjectModal(proj, () => { drawer.close(); openProjectDetailsModal(proj.id, onRefresh, onNavigate); });
  }

  function renderTasks() {
    tabContainer.innerHTML = `
      <div class="space-y-3">
        <div class="flex items-center justify-between">
          <span class="text-xs font-bold text-zinc-900 dark:text-zinc-100">Tarefas & Checklists (${completedTasks}/${tasks.length})</span>
          <span class="text-[11px] text-zinc-400">${tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0}% concluído</span>
        </div>

        <!-- Add Task Field -->
        <div class="flex gap-2">
          <input id="new-task-title-input" placeholder="Nova etapa ou tarefa do projeto..." class="flex-1 px-3 py-1.5 bg-white dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs text-zinc-800 dark:text-zinc-200">
          <button id="add-proj-task-btn" class="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors shrink-0">
            + Adicionar (+10 XP)
          </button>
        </div>

        <div class="space-y-1.5 max-h-56 overflow-y-auto pt-1">
          ${tasks.length === 0 ? `
            <p class="text-zinc-400 text-xs py-4 text-center">Nenhuma tarefa adicionada. Use o campo acima para criar checklists operacionais.</p>
          ` : tasks.map((t, idx) => `
            <div class="flex items-center justify-between p-2.5 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-100 dark:border-zinc-800 text-xs">
              <label class="flex items-center gap-2 cursor-pointer flex-1">
                <input type="checkbox" data-task-idx="${idx}" ${t.completed ? 'checked' : ''} class="w-4 h-4 rounded text-blue-600 focus:ring-0">
                <span class="${t.completed ? 'line-through text-zinc-400' : 'text-zinc-800 dark:text-zinc-200'}">${t.title}</span>
              </label>
              <button class="delete-task-btn text-zinc-400 hover:text-rose-600 p-1" data-task-idx="${idx}" title="Excluir">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
              </button>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    // Task check toggles
    tabContainer.querySelectorAll('input[data-task-idx]').forEach(chk => {
      chk.onchange = () => {
        const idx = parseInt(chk.getAttribute('data-task-idx'));
        if (proj.tasks && proj.tasks[idx]) {
          proj.tasks[idx].completed = chk.checked;
          store.updateProject(proj.id, { tasks: proj.tasks });
          if (chk.checked) store.addXP(10, 'Etapa de projeto concluída');
          renderTasks();
          if (onRefresh) onRefresh();
        }
      };
    });

    // Add task
    const addBtn = tabContainer.querySelector('#add-proj-task-btn');
    if (addBtn) {
      addBtn.onclick = () => {
        const titleInput = tabContainer.querySelector('#new-task-title-input');
        const title = titleInput.value.trim();
        if (title) {
          if (!proj.tasks) proj.tasks = [];
          proj.tasks.push({ id: 'pt-' + Date.now(), title, completed: false });
          store.updateProject(proj.id, { tasks: proj.tasks });
          store.addXP(10, 'Nova tarefa adicionada ao projeto');
          toast.success('Tarefa adicionada com sucesso!');
          renderTasks();
          if (onRefresh) onRefresh();
        }
      };
    }

    // Delete task
    tabContainer.querySelectorAll('.delete-task-btn').forEach(btn => {
      btn.onclick = () => {
        const idx = parseInt(btn.getAttribute('data-task-idx'));
        proj.tasks.splice(idx, 1);
        store.updateProject(proj.id, { tasks: proj.tasks });
        renderTasks();
        if (onRefresh) onRefresh();
      };
    });
  }

  function renderFinance() {
    const liveState = store.getState();
    const liveProj = liveState.projects.find(p => p.id === proj.id) || proj;
    const liveTxs = liveState.transactions.filter(t => t.projectId === proj.id || (t.clientId === proj.clientId && t.isInstallment && t.title.toLowerCase().includes(proj.title.toLowerCase())));
    const validIncomes = liveTxs.filter(t => t.type === 'income' && t.status !== 'cancelled');

    const projPaid = validIncomes.filter(t => t.status === 'paid').reduce((acc, t) => acc + (t.amount || 0), 0);
    const projPending = validIncomes.filter(t => t.status === 'pending' || t.status === 'overdue').reduce((acc, t) => acc + (t.amount || 0), 0);
    const projTotal = (proj.value || 0) > 0 ? proj.value : (projPaid + projPending);

    // Condição acordada
    let agreedCondition = liveProj.paymentCondition;
    if (!agreedCondition) {
      const instList = validIncomes.filter(t => t.isInstallment);
      const hasDown = instList.some(t => t.installmentNumber === 0 || (t.title && t.title.toLowerCase().includes('entrada')));
      const instCount = instList.filter(t => t.installmentNumber > 0).length;
      if (hasDown && instCount > 0) {
        agreedCondition = `Entrada + ${instCount} parcelas`;
      } else if (instCount > 0) {
        agreedCondition = `${instCount} parcelas`;
      } else if (validIncomes.some(t => t.isRecurring)) {
        agreedCondition = 'Recorrente';
      } else {
        agreedCondition = 'Pagamento Único';
      }
    }

    tabContainer.innerHTML = `
      <div class="space-y-4">
        <!-- Header & Action -->
        <div class="flex items-center justify-between">
          <div>
            <span class="text-xs font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider block">Financeiro do Projeto</span>
            <span class="text-[11px] text-zinc-400">Condições contratuais, parcelas e controle de recebimentos</span>
          </div>
          <button id="add-proj-tx-btn" class="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 shadow-2xs">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
            <span>+ Lançar Parcela / Receita</span>
          </button>
        </div>

        <!-- 4 KPI Cards -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <div class="p-2.5 bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/80 dark:border-zinc-800 rounded-xl">
            <span class="text-[10px] text-zinc-400 font-semibold uppercase block">Valor Total</span>
            <div class="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100 mt-0.5">${formatCurrency(projTotal)}</div>
          </div>
          <div class="p-2.5 bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 rounded-xl">
            <span class="text-[10px] text-emerald-800 dark:text-emerald-300 font-semibold uppercase block">Já Recebido</span>
            <div class="text-xs sm:text-sm font-bold text-emerald-600 mt-0.5">${formatCurrency(projPaid)}</div>
          </div>
          <div class="p-2.5 bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 rounded-xl">
            <span class="text-[10px] text-amber-800 dark:text-amber-300 font-semibold uppercase block">Pendente</span>
            <div class="text-xs sm:text-sm font-bold text-amber-600 mt-0.5">${formatCurrency(projPending)}</div>
          </div>
          <div class="p-2.5 bg-purple-50/60 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900/40 rounded-xl">
            <span class="text-[10px] text-purple-800 dark:text-purple-300 font-semibold uppercase block">Condição Acordada</span>
            <div class="text-xs font-bold text-purple-700 dark:text-purple-300 mt-0.5 truncate" title="${agreedCondition}">${agreedCondition}</div>
          </div>
        </div>

        <!-- Lista das Parcelas do Projeto -->
        <div class="space-y-2 pt-1">
          <span class="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider block">Lista de Parcelas & Vencimentos (${validIncomes.length})</span>
          ${validIncomes.length === 0 ? `
            <div class="p-5 text-center bg-zinc-50 dark:bg-zinc-800/20 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800 text-xs text-zinc-400">
              Nenhuma receita ou parcela vinculada a este projeto ainda. Use o botão acima para lançar parcelas.
            </div>
          ` : `
            <div class="divide-y divide-zinc-100 dark:divide-zinc-800 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden bg-white dark:bg-zinc-850 shadow-2xs">
              ${validIncomes.map(t => {
                const isDown = t.installmentNumber === 0 || (t.title && t.title.toLowerCase().includes('entrada'));
                const label = isDown ? 'Entrada / Sinal' : (t.installmentNumber ? `Parcela ${t.installmentNumber}/${t.installmentTotal || validIncomes.length}` : t.title);

                return `
                  <div class="p-3 flex items-center justify-between gap-3 text-xs hover:bg-zinc-50/50 dark:hover:bg-zinc-800/40 transition-colors">
                    <div class="flex items-center gap-2.5">
                      <span class="w-6 h-6 rounded-lg ${isDown ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300' : 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'} font-bold text-[10px] flex items-center justify-center shrink-0">
                        ${isDown ? 'ENT' : (t.installmentNumber || 'REC')}
                      </span>
                      <div>
                        <div class="font-semibold text-zinc-900 dark:text-zinc-100">${label}</div>
                        <div class="text-[10px] text-zinc-400 mt-0.5">Vencimento: <b class="text-zinc-600 dark:text-zinc-300">${formatDate(t.dueDate || t.date)}</b> • ${t.paymentMethod || 'PIX'}</div>
                      </div>
                    </div>

                    <div class="flex items-center gap-3 shrink-0">
                      <div class="text-right">
                        <div class="font-bold text-zinc-900 dark:text-zinc-100 text-xs">${formatCurrency(t.amount)}</div>
                        <div class="mt-0.5">${getInstallmentStatusBadge(t.installmentStatus || t.status, t.dueDate)}</div>
                      </div>

                      <div class="flex items-center gap-1">
                        ${t.receiptUrl ? `
                          <a href="${t.receiptUrl}" target="_blank" class="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg" title="Comprovante">
                            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"/></svg>
                          </a>
                        ` : ''}

                        ${t.status !== 'paid' ? `
                          <button class="mark-proj-paid-btn px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-semibold transition-colors shadow-2xs" data-id="${t.id}" title="Dar baixa nesta parcela">
                            Baixar
                          </button>
                        ` : ''}

                        <button class="edit-proj-tx-btn p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors" data-id="${t.id}" title="Editar Parcela">
                          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
                        </button>
                      </div>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          `}
        </div>
      </div>
    `;

    // Mark paid handler
    tabContainer.querySelectorAll('.mark-proj-paid-btn').forEach(btn => {
      btn.onclick = () => {
        const id = btn.getAttribute('data-id');
        store.updateInstallmentStatus(id, 'Recebida');
        toast.success('Parcela baixada com sucesso! Projeto, Cliente e Fluxo de Caixa atualizados.');
        renderFinance();
        if (onRefresh) onRefresh();
      };
    });

    // Edit tx handler
    tabContainer.querySelectorAll('.edit-proj-tx-btn').forEach(btn => {
      btn.onclick = () => {
        const id = btn.getAttribute('data-id');
        openEditTransactionModal(id, () => {
          renderFinance();
          if (onRefresh) onRefresh();
        });
      };
    });

    const addTxBtn = tabContainer.querySelector('#add-proj-tx-btn');
    if (addTxBtn) addTxBtn.onclick = () => openCreateTransactionForProjectModal(proj, () => { renderFinance(); if (onRefresh) onRefresh(); });
  }

  function renderDocs() {
    tabContainer.innerHTML = `
      <div class="space-y-3">
        <div class="flex items-center justify-between">
          <span class="text-xs font-bold text-zinc-900 dark:text-zinc-100">Arquivos e Documentos do Projeto (${projectDocuments.length})</span>
          <button id="add-proj-doc-btn" class="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors">
            + Anexar Documento
          </button>
        </div>

        <div class="space-y-2">
          ${projectDocuments.length === 0 ? `
            <div class="p-5 text-center bg-zinc-50 dark:bg-zinc-800/20 rounded-xl text-xs text-zinc-400">
              Nenhum documento anexado diretamente a este projeto.
            </div>
          ` : projectDocuments.map(d => `
            <div class="p-3 bg-zinc-50 dark:bg-zinc-800/40 rounded-xl border border-zinc-100 dark:border-zinc-800 flex items-center justify-between gap-3">
              <div class="flex items-center gap-2.5">
                <div class="p-2 bg-blue-50 dark:bg-blue-950/40 text-blue-600 rounded-lg">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/></svg>
                </div>
                <div>
                  <div class="font-semibold text-zinc-900 dark:text-zinc-100 text-xs">${d.name}</div>
                  <div class="text-[11px] text-zinc-400">${d.category || 'Geral'} • ${d.size || '1.5 MB'} • ${formatDate(d.uploadDate)}</div>
                </div>
              </div>
              <span class="text-[11px] text-blue-600 font-semibold cursor-pointer hover:underline">Download</span>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    const addDocBtn = tabContainer.querySelector('#add-proj-doc-btn');
    if (addDocBtn) addDocBtn.onclick = () => openAddDocumentForProjectModal(proj, () => { renderDocs(); });
  }

  // Initial tab
  renderOverview();

  // Tab switch handlers
  drawer.panel.querySelector('#ptab-overview').onclick = (e) => { setTab(e.target); renderOverview(); };
  drawer.panel.querySelector('#ptab-schedule').onclick = (e) => { setTab(e.target); renderSchedule(); };
  drawer.panel.querySelector('#ptab-deliveries').onclick = (e) => { setTab(e.target); renderDeliveries(); };
  drawer.panel.querySelector('#ptab-tasks').onclick = (e) => { setTab(e.target); renderTasks(); };
  drawer.panel.querySelector('#ptab-finance').onclick = (e) => { setTab(e.target); renderFinance(); };
  drawer.panel.querySelector('#ptab-docs').onclick = (e) => { setTab(e.target); renderDocs(); };

  // Stage select in header
  const stageSelect = drawer.panel.querySelector('#proj-drawer-stage-select');
  if (stageSelect) {
    stageSelect.onchange = (e) => {
      const newStg = e.target.value;
      store.updateProject(proj.id, { stage: newStg });
      toast.info(`Estágio alterado para ${newStg.toUpperCase()}`);
      if (onRefresh) onRefresh();
    };
  }

  // Quick Action Buttons
  drawer.panel.querySelector('#quick-add-proj-delivery').onclick = () => {
    openCreateDeliveryForProjectModal(proj, () => {
      drawer.close();
      openProjectDetailsModal(proj.id, onRefresh, onNavigate);
    });
  };

  drawer.panel.querySelector('#quick-add-proj-task').onclick = () => {
    setTab(drawer.panel.querySelector('#ptab-tasks'));
    renderTasks();
  };

  drawer.panel.querySelector('#quick-add-proj-finance').onclick = () => {
    openCreateTransactionForProjectModal(proj, () => {
      drawer.close();
      openProjectDetailsModal(proj.id, onRefresh, onNavigate);
    });
  };

  drawer.panel.querySelector('#quick-advance-stage').onclick = () => {
    if (currentStageIndex < stagesList.length - 1) {
      const nextStage = stagesList[currentStageIndex + 1].id;
      store.updateProject(proj.id, { stage: nextStage });
      store.addXP(20, `Projeto avançado de etapa`);
      toast.success(`Projeto avançado para '${stagesList[currentStageIndex + 1].title}'! (+20 XP)`);
      drawer.close();
      openProjectDetailsModal(proj.id, onRefresh, onNavigate);
      if (onRefresh) onRefresh();
    }
  };

  const openClientBtn = drawer.panel.querySelector('#proj-open-client-btn');
  if (openClientBtn && proj.clientId) {
    openClientBtn.onclick = () => {
      drawer.close();
      if (onNavigate) onNavigate('clients');
    };
  }
}

function openCreateProjectModal(onSuccess) {
  const { clients, services } = store.getState();
  const content = `
    <form id="proj-create-modal-form" class="space-y-3">
      <div>
        <label class="block text-xs font-medium text-zinc-600 dark:text-zinc-300 mb-1">Título do Projeto *</label>
        <input required name="title" class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs" placeholder="Ex: Redesign de Identidade Visual">
      </div>
      <div class="grid grid-cols-2 gap-2">
        <div>
          <label class="block text-xs font-medium text-zinc-600 dark:text-zinc-300 mb-1">Cliente Vinculado</label>
          <select name="clientId" class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs">
            <option value="">Selecione um cliente...</option>
            ${clients.map(c => `<option value="${c.id}">${c.name} (${c.company || 'PF'})</option>`).join('')}
          </select>
        </div>
        <div>
          <label class="block text-xs font-medium text-zinc-600 dark:text-zinc-300 mb-1">Serviço Base</label>
          <select name="serviceId" class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs">
            <option value="">Selecione o serviço...</option>
            ${services.map(s => `<option value="${s.id}">${s.name}</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="grid grid-cols-2 gap-2">
        <div>
          <label class="block text-xs font-medium text-zinc-600 dark:text-zinc-300 mb-1">Valor do Projeto (R$) *</label>
          <input required type="number" step="0.01" name="value" class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs" placeholder="4500">
        </div>
        <div>
          <label class="block text-xs font-medium text-zinc-600 dark:text-zinc-300 mb-1">Prazo de Entrega</label>
          <input type="date" name="deadlineDate" value="${new Date(Date.now() + 20 * 86400000).toISOString().split('T')[0]}" class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs">
        </div>
      </div>
      <div class="grid grid-cols-2 gap-2">
        <div>
          <label class="block text-xs font-medium text-zinc-600 dark:text-zinc-300 mb-1">Prioridade</label>
          <select name="priority" class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs">
            <option value="baixa">Baixa</option>
            <option value="media" selected>Média</option>
            <option value="alta">Alta</option>
            <option value="urgente">Urgente</option>
          </select>
        </div>
        <div>
          <label class="block text-xs font-medium text-zinc-600 dark:text-zinc-300 mb-1">Estágio Inicial</label>
          <select name="stage" class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs">
            <option value="proposta">Proposta</option>
            <option value="briefing" selected>Briefing</option>
            <option value="pesquisa">Pesquisa</option>
            <option value="conceito">Conceito</option>
            <option value="desenvolvimento">Desenvolvimento</option>
          </select>
        </div>
      </div>
      <div>
        <label class="block text-xs font-medium text-zinc-600 dark:text-zinc-300 mb-1">Briefing / Observações Iniciais</label>
        <textarea name="notes" rows="2" class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs" placeholder="Objetivo do projeto, referências e escopo contratado..."></textarea>
      </div>
      <div class="pt-2 flex justify-end gap-2">
        <button type="submit" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors">Criar Projeto</button>
      </div>
    </form>
  `;

  const m = modal.open({
    title: 'Iniciar Novo Projeto',
    content,
    size: 'md'
  });

  m.panel.querySelector('#proj-create-modal-form').onsubmit = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const clientId = fd.get('clientId');
    const serviceId = fd.get('serviceId');
    const client = clients.find(c => c.id === clientId);
    const service = services.find(s => s.id === serviceId);

    const newProj = store.addProject({
      title: fd.get('title'),
      clientId: clientId || null,
      clientName: client ? client.name : 'Cliente Direto',
      serviceId: serviceId || null,
      serviceName: service ? service.name : 'Personalizado',
      value: parseFloat(fd.get('value')) || 0,
      deadlineDate: fd.get('deadlineDate'),
      priority: fd.get('priority'),
      stage: fd.get('stage'),
      notes: fd.get('notes'),
      tasks: [
        { id: 'pt-1', title: 'Alinhamento de briefing e expectativas', completed: true },
        { id: 'pt-2', title: 'Desenvolvimento da primeira versão', completed: false },
        { id: 'pt-3', title: 'Revisão com o cliente e entrega final', completed: false }
      ]
    });

    if (clientId) {
      store.addClientActivity(clientId, {
        type: 'project',
        title: `Novo projeto iniciado: '${newProj.title}'`
      });
    }

    toast.success('Projeto cadastrado e pronto para produção! (+30 XP)');
    store.addXP(30, 'Novo projeto criado');
    m.close();
    if (onSuccess) onSuccess();
  };
}

function openCreateDeliveryForProjectModal(proj, onSuccess) {
  const content = `
    <form id="proj-create-deliv-form" class="space-y-3">
      <div>
        <label class="block text-xs font-medium text-zinc-600 dark:text-zinc-300 mb-1">Título da Entrega / Demanda *</label>
        <input required name="title" placeholder="Ex: Entrega do Manual da Marca (PDF)" class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs">
      </div>
      <div class="grid grid-cols-2 gap-2">
        <div>
          <label class="block text-xs font-medium text-zinc-600 dark:text-zinc-300 mb-1">Prioridade</label>
          <select name="priority" class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs">
            <option value="baixa">Baixa</option>
            <option value="media" selected>Média</option>
            <option value="alta">Alta</option>
            <option value="urgente">Urgente</option>
          </select>
        </div>
        <div>
          <label class="block text-xs font-medium text-zinc-600 dark:text-zinc-300 mb-1">Prazo de Entrega</label>
          <input required type="date" name="dueDate" value="${proj.deadlineDate || new Date().toISOString().split('T')[0]}" class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs">
        </div>
      </div>
      <div class="pt-2 flex justify-end gap-2">
        <button type="submit" class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition-colors">Criar Entrega</button>
      </div>
    </form>
  `;

  const m = modal.open({
    title: `Nova Entrega para ${proj.title}`,
    content,
    size: 'md'
  });

  m.panel.querySelector('#proj-create-deliv-form').onsubmit = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    store.addDelivery({
      title: fd.get('title'),
      projectId: proj.id,
      projectName: proj.title,
      clientId: proj.clientId,
      clientName: proj.clientName,
      priority: fd.get('priority'),
      dueDate: fd.get('dueDate'),
      status: 'backlog',
      checklist: [{ id: 'chk-1', title: 'Produção inicial', completed: false }]
    });
    toast.success('Entrega vinculada ao projeto com sucesso!');
    m.close();
    if (onSuccess) onSuccess();
  };
}

function openCreateTransactionForProjectModal(proj, onSuccess) {
  openTransactionModal('income', 'business', () => {
    if (onSuccess) onSuccess();
  }, { clientId: proj.clientId, projectId: proj.id, amount: proj.value, title: `Projeto - ${proj.title}` });
}

function openAddDocumentForProjectModal(proj, onSuccess) {
  const content = `
    <form id="proj-create-doc-form" class="space-y-3">
      <div>
        <label class="block text-xs font-medium text-zinc-600 dark:text-zinc-300 mb-1">Nome do Arquivo / Documento *</label>
        <input required name="name" placeholder="Ex: Moodboard e Referências Visuais.pdf" class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs">
      </div>
      <div class="grid grid-cols-2 gap-2">
        <div>
          <label class="block text-xs font-medium text-zinc-600 dark:text-zinc-300 mb-1">Categoria</label>
          <select name="category" class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs">
            <option value="Projetos" selected>Projetos</option>
            <option value="Briefings">Briefings</option>
            <option value="Finais">Arquivos Finais</option>
          </select>
        </div>
        <div>
          <label class="block text-xs font-medium text-zinc-600 dark:text-zinc-300 mb-1">Tamanho</label>
          <input name="size" value="2.4 MB" class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs">
        </div>
      </div>
      <div class="pt-2 flex justify-end gap-2">
        <button type="submit" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors">Anexar Documento</button>
      </div>
    </form>
  `;

  const m = modal.open({
    title: `Anexar ao Projeto ${proj.title}`,
    content,
    size: 'md'
  });

  m.panel.querySelector('#proj-create-doc-form').onsubmit = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    store.addDocument({
      name: fd.get('name'),
      category: fd.get('category'),
      size: fd.get('size'),
      projectId: proj.id,
      clientId: proj.clientId,
      clientName: proj.clientName
    });
    toast.success('Documento anexado ao projeto!');
    m.close();
    if (onSuccess) onSuccess();
  };
}

