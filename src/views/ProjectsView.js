import { store } from '../state/store.js';
import { modal } from '../components/Modal.js';
import { toast } from '../components/Toast.js';
import { formatCurrency, formatDate, getStatusBadge } from '../utils/formatters.js';
import { exportToCSV } from '../utils/exportUtils.js';

let projectViewMode = 'kanban'; // kanban | list

export function renderProjectsView(container, onNavigate) {
  const { projects, clients, services } = store.getState();

  const stages = [
    { id: 'proposta', title: 'Proposta' },
    { id: 'briefing', title: 'Briefing' },
    { id: 'em_andamento', title: 'Em Andamento' },
    { id: 'revisao', title: 'Revisão' },
    { id: 'finalizacao', title: 'Finalização' },
    { id: 'entrega', title: 'Entrega' },
    { id: 'pago', title: 'Pago' },
    { id: 'cancelado', title: 'Cancelado' }
  ];

  const activeCount = projects.filter(p => p.stage !== 'entrega' && p.stage !== 'pago' && p.stage !== 'cancelado').length;
  const completedCount = projects.filter(p => p.stage === 'entrega' || p.stage === 'pago').length;
  const urgentCount = projects.filter(p => p.priority === 'urgente' && p.stage !== 'entrega').length;
  const totalValue = projects.reduce((acc, p) => acc + (p.value || 0), 0);

  container.innerHTML = `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 class="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">Gerenciamento de Projetos</h2>
          <p class="text-xs text-zinc-500">Pipeline de produção criativa, checklists de entrega e cronogramas operacionais.</p>
        </div>
        <div class="flex items-center gap-2">
          <!-- View Toggle -->
          <div class="flex items-center p-1 bg-zinc-100 dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700">
            <button id="proj-view-kanban" class="px-3 py-1 text-xs font-medium rounded-lg transition-colors ${projectViewMode === 'kanban' ? 'bg-white dark:bg-zinc-700 text-blue-600 shadow-2xs font-semibold' : 'text-zinc-500'}">Kanban</button>
            <button id="proj-view-list" class="px-3 py-1 text-xs font-medium rounded-lg transition-colors ${projectViewMode === 'list' ? 'bg-white dark:bg-zinc-700 text-blue-600 shadow-2xs font-semibold' : 'text-zinc-500'}">Lista</button>
          </div>

          <button id="proj-export-btn" class="px-3 py-1.5 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-xl text-xs font-medium text-zinc-700 dark:text-zinc-300 transition-colors">
            Exportar
          </button>
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
          <div class="text-[11px] font-medium text-zinc-500">Urgentes / Finais</div>
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

  container.querySelector('#proj-export-btn').onclick = () => {
    const headers = ['Título', 'Cliente', 'Serviço', 'Valor', 'Estágio', 'Prioridade', 'Prazo'];
    const rows = projects.map(p => [p.title, p.clientName, p.serviceName, p.value, p.stage, p.priority, p.deadlineDate]);
    exportToCSV('projetos_app_teste', rows, headers);
    toast.success('Lista de projetos exportada!');
  };

  container.querySelector('#proj-new-btn').onclick = () => {
    openCreateProjectModal(() => renderProjectsView(container, onNavigate));
  };

  render();
}

function renderProjectsKanban(contentArea, projects, stages, onNavigate) {
  contentArea.innerHTML = `
    <div class="flex gap-4 overflow-x-auto pb-6 pt-1 snap-x select-none">
      ${stages.map(stg => {
        const stgProjects = projects.filter(p => p.stage === stg.id);
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
      openProjectDetailsModal(id, () => renderProjectsView(contentArea.parentElement.parentElement, onNavigate));
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
                  <button class="text-blue-600 hover:text-blue-700 font-medium px-2 py-1 rounded hover:bg-blue-50 dark:hover:bg-blue-950/40">Gerenciar</button>
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
      openProjectDetailsModal(id, () => renderProjectsView(contentArea.parentElement.parentElement, onNavigate));
    };
  });
}

export function openProjectDetailsModal(projectId, onRefresh) {
  const proj = store.getState().projects.find(p => p.id === projectId);
  if (!proj) return;

  const projectDeliveries = (store.getState().deliveries || []).filter(d => d.projectId === proj.id);
  const completedDeliveries = projectDeliveries.filter(d => d.status === 'entregue').length;
  const deliveryProgressPercent = projectDeliveries.length > 0 
    ? Math.round((completedDeliveries / projectDeliveries.length) * 100) 
    : (proj.progress || 0);

  const content = `
    <div class="space-y-4">
      <!-- Header Info -->
      <div class="p-4 bg-zinc-50 dark:bg-zinc-800/40 rounded-xl border border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
        <div>
          <span class="text-zinc-400 text-[11px] block">Cliente Vinculado</span>
          <span class="font-bold text-zinc-900 dark:text-zinc-100">${proj.clientName}</span>
        </div>
        <div class="text-right">
          <span class="text-zinc-400 text-[11px] block">Valor do Projeto</span>
          <span class="font-bold text-blue-600 dark:text-blue-400 text-sm sm:text-base">${formatCurrency(proj.value)}</span>
        </div>
      </div>

      <!-- Entregas Operacionais do Projeto -->
      <div class="space-y-2 p-3.5 bg-blue-50/40 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-800/40 rounded-2xl">
        <div class="flex items-center justify-between text-xs">
          <div>
            <span class="font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
              <svg class="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/></svg>
              Entregas do Projeto (${completedDeliveries}/${projectDeliveries.length})
            </span>
            <span class="text-[10px] text-zinc-500">Progresso calculado automaticamente pelas entregas concluídas</span>
          </div>
          <span class="text-xs font-bold text-blue-600 dark:text-blue-400">${deliveryProgressPercent}%</span>
        </div>

        <div class="w-full bg-zinc-200 dark:bg-zinc-700 h-2 rounded-full overflow-hidden">
          <div class="h-full bg-blue-600 rounded-full transition-all" style="width: ${deliveryProgressPercent}%"></div>
        </div>

        <div class="space-y-1.5 max-h-40 overflow-y-auto pt-1">
          ${projectDeliveries.length === 0 ? `
            <p class="text-[11px] text-zinc-400 py-1 italic">Nenhuma entrega vinculada a este projeto ainda.</p>
          ` : projectDeliveries.map(d => `
            <div class="flex items-center justify-between p-2 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200/70 dark:border-zinc-800 text-xs">
              <div class="flex items-center gap-2">
                <span class="w-2 h-2 rounded-full ${d.status === 'entregue' ? 'bg-emerald-500' : 'bg-blue-600'}"></span>
                <span class="font-medium text-zinc-800 dark:text-zinc-200">${d.title}</span>
              </div>
              <div class="flex items-center gap-2">
                <span class="text-[10px] text-zinc-400">${d.dueDate ? d.dueDate.split('-').reverse().slice(0, 2).join('/') : ''}</span>
                <span class="text-[10px] font-semibold capitalize px-2 py-0.5 rounded ${d.status === 'entregue' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400' : 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'}">${d.status}</span>
              </div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Controls: Stage & Priority -->
      <div class="grid grid-cols-2 gap-3 text-xs">
        <div>
          <label class="block text-zinc-400 mb-1">Estágio do Projeto</label>
          <select id="proj-edit-stage" class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg">
            <option value="proposta" ${proj.stage === 'proposta' ? 'selected' : ''}>Proposta</option>
            <option value="briefing" ${proj.stage === 'briefing' ? 'selected' : ''}>Briefing</option>
            <option value="em_andamento" ${proj.stage === 'em_andamento' ? 'selected' : ''}>Em Andamento</option>
            <option value="revisao" ${proj.stage === 'revisao' ? 'selected' : ''}>Revisão</option>
            <option value="finalizacao" ${proj.stage === 'finalizacao' ? 'selected' : ''}>Finalização</option>
            <option value="entrega" ${proj.stage === 'entrega' ? 'selected' : ''}>Entrega</option>
            <option value="pago" ${proj.stage === 'pago' ? 'selected' : ''}>Pago</option>
            <option value="cancelado" ${proj.stage === 'cancelado' ? 'selected' : ''}>Cancelado</option>
          </select>
        </div>
        <div>
          <label class="block text-zinc-400 mb-1">Data Limite de Entrega</label>
          <input type="date" id="proj-edit-deadline" value="${proj.deadlineDate}" class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg">
        </div>
      </div>

      <!-- Checklist de Entregáveis -->
      <div class="space-y-2">
        <div class="flex items-center justify-between text-xs font-semibold text-zinc-900 dark:text-zinc-100">
          <span>Checklist de Tarefas & Entregáveis</span>
          <button id="add-task-item-btn" class="text-blue-600 hover:underline text-[11px]">+ Nova Tarefa</button>
        </div>
        <div id="project-tasks-list" class="space-y-1.5 max-h-48 overflow-y-auto">
          ${(proj.tasks || []).map((t, idx) => `
            <div class="flex items-center justify-between p-2.5 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-100 dark:border-zinc-800 text-xs">
              <label class="flex items-center gap-2 cursor-pointer flex-1">
                <input type="checkbox" data-task-idx="${idx}" ${t.completed ? 'checked' : ''} class="w-4 h-4 rounded text-blue-600 focus:ring-0">
                <span class="${t.completed ? 'line-through text-zinc-400' : 'text-zinc-800 dark:text-zinc-200'}">${t.title}</span>
              </label>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Notes -->
      <div>
        <label class="block text-xs text-zinc-400 mb-1">Observações do Projeto</label>
        <textarea id="proj-edit-notes" rows="2" class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs">${proj.notes || ''}</textarea>
      </div>

      <div class="flex justify-between items-center pt-2 border-t border-zinc-100 dark:border-zinc-800">
        <button id="proj-delete-btn" class="text-rose-600 hover:text-rose-700 text-xs font-medium">Excluir Projeto</button>
        <button id="proj-save-btn" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold">Salvar Alterações</button>
      </div>
    </div>
  `;

  const m = modal.open({
    title: proj.title,
    content,
    size: 'lg'
  });

  // Task check toggle
  m.panel.querySelectorAll('input[data-task-idx]').forEach(chk => {
    chk.onchange = () => {
      const idx = parseInt(chk.getAttribute('data-task-idx'));
      if (proj.tasks && proj.tasks[idx]) {
        proj.tasks[idx].completed = chk.checked;
        store.updateProject(proj.id, { tasks: proj.tasks });
        toast.info(chk.checked ? 'Tarefa concluída!' : 'Tarefa desmarcada.');
        if (onRefresh) onRefresh();
      }
    };
  });

  // Add Task
  m.panel.querySelector('#add-task-item-btn').onclick = () => {
    const title = prompt('Digite o título da nova tarefa do projeto:');
    if (title && title.trim()) {
      if (!proj.tasks) proj.tasks = [];
      proj.tasks.push({ id: 'pt-' + Date.now(), title: title.trim(), completed: false });
      store.updateProject(proj.id, { tasks: proj.tasks });
      toast.success('Tarefa adicionada ao checklist!');
      m.close();
      openProjectDetailsModal(proj.id, onRefresh);
    }
  };

  // Save changes
  m.panel.querySelector('#proj-save-btn').onclick = () => {
    const stage = m.panel.querySelector('#proj-edit-stage').value;
    const deadline = m.panel.querySelector('#proj-edit-deadline').value;
    const notes = m.panel.querySelector('#proj-edit-notes').value;

    store.updateProject(proj.id, {
      stage,
      deadlineDate: deadline,
      notes
    });

    toast.success('Projeto atualizado com sucesso!');
    m.close();
    if (onRefresh) onRefresh();
  };

  // Delete
  m.panel.querySelector('#proj-delete-btn').onclick = () => {
    if (confirm(`Deseja excluir o projeto '${proj.title}'?`)) {
      store.deleteProject(proj.id);
      toast.info('Projeto removido.');
      m.close();
      if (onRefresh) onRefresh();
    }
  };
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
            ${clients.map(c => `<option value="${c.id}">${c.name} (${c.company})</option>`).join('')}
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
          <input required type="number" name="value" class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs" placeholder="4500">
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
            <option value="briefing" selected>Briefing</option>
            <option value="em_andamento">Em Andamento</option>
            <option value="revisao">Revisão</option>
          </select>
        </div>
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

    store.addProject({
      title: fd.get('title'),
      clientId: clientId || null,
      clientName: client ? client.name : 'Cliente Direto',
      serviceId: serviceId || null,
      serviceName: service ? service.name : 'Personalizado',
      value: parseFloat(fd.get('value')) || 0,
      deadlineDate: fd.get('deadlineDate'),
      priority: fd.get('priority'),
      stage: fd.get('stage'),
      tasks: [
        { id: 'pt-1', title: 'Alinhamento de briefing e expectativas', completed: true },
        { id: 'pt-2', title: 'Desenvolvimento da primeira versão', completed: false },
        { id: 'pt-3', title: 'Revisão com o cliente e entrega final', completed: false }
      ]
    });

    toast.success('Projeto cadastrado e pronto para produção!');
    m.close();
    if (onSuccess) onSuccess();
  };
}
