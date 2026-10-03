import { store } from '../state/store.js';
import { modal } from '../components/Modal.js';
import { toast } from '../components/Toast.js';
import { formatCurrency, formatDate, getStatusBadge } from '../utils/formatters.js';
import { renderExportButtonHtml, bindExportButton } from '../components/ExportMenu.js';

let currentViewMode = 'kanban'; // kanban | table

export function renderCRMView(container, onNavigate) {
  const { leads, services } = store.getState();

  const columns = [
    { id: 'novo', title: 'Novo Lead', color: 'border-blue-500' },
    { id: 'contato', title: 'Primeiro Contato', color: 'border-indigo-500' },
    { id: 'diagnostico', title: 'Diagnóstico', color: 'border-purple-500' },
    { id: 'orcamento', title: 'Orçamento Enviado', color: 'border-amber-500' },
    { id: 'negociacao', title: 'Em Negociação', color: 'border-orange-500' },
    { id: 'aprovado', title: 'Lead Aprovado', color: 'border-emerald-500' },
    { id: 'cancelado', title: 'Cancelado', color: 'border-zinc-400' }
  ];

  container.innerHTML = `
    <div class="space-y-5">
      <!-- Header & Actions -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 class="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">CRM & Funil de Vendas</h2>
          <p class="text-xs text-zinc-500">Gestão de oportunidades comerciais, prospecção e pipeline de conversão.</p>
        </div>
        <div class="flex items-center gap-2">
          <!-- View Toggle -->
          <div class="flex items-center p-1 bg-zinc-100 dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700">
            <button id="view-kanban-btn" class="px-3 py-1 text-xs font-medium rounded-lg transition-colors ${currentViewMode === 'kanban' ? 'bg-white dark:bg-zinc-700 text-blue-600 shadow-2xs font-semibold' : 'text-zinc-500'}">Kanban</button>
            <button id="view-table-btn" class="px-3 py-1 text-xs font-medium rounded-lg transition-colors ${currentViewMode === 'table' ? 'bg-white dark:bg-zinc-700 text-blue-600 shadow-2xs font-semibold' : 'text-zinc-500'}">Tabela</button>
          </div>

          <!-- Universal Export Dropdown -->
          ${renderExportButtonHtml('crm-export-dropdown')}

          <!-- New Lead -->
          <button id="crm-new-lead-btn" class="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-medium transition-colors shadow-xs">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
            <span>Novo Lead</span>
          </button>
        </div>
      </div>

      <!-- Main CRM Content -->
      <div id="crm-content-area"></div>
    </div>
  `;

  const contentArea = container.querySelector('#crm-content-area');

  function renderView() {
    if (currentViewMode === 'kanban') {
      renderKanban(contentArea, leads, columns, onNavigate);
    } else {
      renderTable(contentArea, leads, onNavigate);
    }
  }

  // Toggle handlers
  container.querySelector('#view-kanban-btn').onclick = () => {
    currentViewMode = 'kanban';
    renderCRMView(container, onNavigate);
  };
  container.querySelector('#view-table-btn').onclick = () => {
    currentViewMode = 'table';
    renderCRMView(container, onNavigate);
  };

  // Universal Export Handler
  bindExportButton(container, 'crm-export-dropdown', () => {
    const headers = ['Nome', 'Empresa', 'Telefone', 'Email', 'Canal', 'Serviço', 'Valor Estimado', 'Status', 'Data'];
    const rows = leads.map(l => [
      l.name || '',
      l.company || '-',
      l.phone || '-',
      l.email || '-',
      l.channel || '-',
      l.serviceOfInterest || '-',
      formatCurrency(l.estimatedValue || 0),
      l.status || '',
      formatDate(l.createdAt)
    ]);
    const totalPipeline = leads.reduce((acc, l) => acc + (l.estimatedValue || 0), 0);
    const summary = [
      { label: 'Total de Oportunidades', value: leads.length },
      { label: 'Valor em Pipeline', value: formatCurrency(totalPipeline) },
      { label: 'Ganhos (Aprovados)', value: leads.filter(l => l.status === 'aprovado').length }
    ];
    return {
      filename: `leads_crm_${new Date().toISOString().split('T')[0]}`,
      title: 'CRM & Funil de Oportunidades Comerciais',
      headers,
      rows,
      summary,
      filters: `Total de Leads: ${leads.length}`
    };
  });

  // New Lead handler
  container.querySelector('#crm-new-lead-btn').onclick = () => {
    openNewLeadModal(() => renderCRMView(container, onNavigate));
  };

  renderView();
}

function renderKanban(contentArea, leads, columns, onNavigate) {
  contentArea.innerHTML = `
    <div class="flex gap-4 overflow-x-auto pb-6 pt-2 snap-x select-none">
      ${columns.map(col => {
        const colLeads = leads.filter(l => l.status === col.id);
        const colTotal = colLeads.reduce((acc, l) => acc + (l.estimatedValue || 0), 0);
        return `
          <div class="w-72 shrink-0 flex flex-col bg-zinc-50/80 dark:bg-zinc-900/60 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 p-3 min-h-[500px]" data-column="${col.id}">
            <!-- Column Header -->
            <div class="flex items-center justify-between pb-3 border-b border-zinc-200/60 dark:border-zinc-800/80 px-1">
              <div class="flex items-center gap-2">
                <span class="w-2.5 h-2.5 rounded-full ${col.color.replace('border-', 'bg-')}"></span>
                <span class="text-xs font-bold text-zinc-900 dark:text-zinc-100">${col.title}</span>
                <span class="text-[10px] bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 px-1.5 py-0.5 rounded-full font-semibold text-zinc-500">${colLeads.length}</span>
              </div>
            </div>
            <div class="text-[10px] text-zinc-400 font-medium px-1 py-1.5">
              Total: ${formatCurrency(colTotal)}
            </div>

            <!-- Column Dropzone & Cards -->
            <div class="flex-1 space-y-2.5 overflow-y-auto pt-2 kanban-dropzone" data-status="${col.id}">
              ${colLeads.length === 0 ? `
                <div class="h-28 border-2 border-dashed border-zinc-200/60 dark:border-zinc-800/60 rounded-xl flex items-center justify-center text-[11px] text-zinc-400">
                  Arraste cards para cá
                </div>
              ` : colLeads.map(lead => `
                <div 
                  draggable="true" 
                  data-lead-id="${lead.id}" 
                  class="kanban-card p-3.5 rounded-xl bg-white dark:bg-zinc-850 border border-zinc-200/70 dark:border-zinc-800 shadow-2xs hover:shadow-xs hover:border-blue-400 dark:hover:border-blue-600 cursor-grab active:cursor-grabbing transition-all"
                >
                  <div class="flex items-start justify-between gap-1 mb-1.5">
                    <span class="font-semibold text-xs text-zinc-900 dark:text-zinc-100">${lead.name}</span>
                    <span class="text-[10px] font-bold text-blue-600 dark:text-blue-400">${formatCurrency(lead.estimatedValue)}</span>
                  </div>
                  <div class="text-[11px] text-zinc-500 dark:text-zinc-400 truncate mb-2">
                    ${lead.company || 'Pessoa Física'}
                  </div>
                  <div class="text-[10px] bg-zinc-50 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 px-2 py-1 rounded-md truncate mb-2 border border-zinc-100 dark:border-zinc-750">
                    ${lead.serviceOfInterest}
                  </div>
                  <div class="flex items-center justify-between text-[10px] text-zinc-400 pt-1 border-t border-zinc-100 dark:border-zinc-800">
                    <span class="flex items-center gap-1">
                      <span class="w-1.5 h-1.5 rounded-full bg-zinc-400"></span> ${lead.channel}
                    </span>
                    <span>${formatDate(lead.lastContact || lead.createdAt)}</span>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;

  // Attach Drag & Drop handlers
  setupKanbanDragAndDrop(contentArea, onNavigate);
}

function setupKanbanDragAndDrop(contentArea, onNavigate) {
  let draggedLeadId = null;

  contentArea.querySelectorAll('.kanban-card').forEach(card => {
    card.addEventListener('dragstart', (e) => {
      draggedLeadId = card.getAttribute('data-lead-id');
      card.classList.add('opacity-40');
      e.dataTransfer.setData('text/plain', draggedLeadId);
    });

    card.addEventListener('dragend', () => {
      card.classList.remove('opacity-40');
    });

    card.onclick = () => {
      const id = card.getAttribute('data-lead-id');
      openLeadDetailDrawer(id, onNavigate);
    };
  });

  contentArea.querySelectorAll('.kanban-dropzone').forEach(zone => {
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
      const targetStatus = zone.getAttribute('data-status');
      if (draggedLeadId && targetStatus) {
        store.updateLead(draggedLeadId, { status: targetStatus });
        toast.info(`Status do lead atualizado para ${targetStatus.toUpperCase()}!`);
        renderCRMView(contentArea.parentElement.parentElement, onNavigate);
      }
    });
  });
}

function renderTable(contentArea, leads, onNavigate) {
  contentArea.innerHTML = `
    <div class="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-2xs">
      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs text-zinc-600 dark:text-zinc-400">
          <thead class="bg-zinc-50 dark:bg-zinc-850 text-zinc-900 dark:text-zinc-200 border-b border-zinc-200 dark:border-zinc-800 font-semibold">
            <tr>
              <th class="p-3.5">Nome / Contato</th>
              <th class="p-3.5">Empresa</th>
              <th class="p-3.5">Serviço de Interesse</th>
              <th class="p-3.5">Valor Estimado</th>
              <th class="p-3.5">Status</th>
              <th class="p-3.5">Origem</th>
              <th class="p-3.5">Último Contato</th>
              <th class="p-3.5 text-right">Ações</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-zinc-100 dark:divide-zinc-800">
            ${leads.map(lead => `
              <tr class="hover:bg-zinc-50/70 dark:hover:bg-zinc-850/50 cursor-pointer transition-colors" data-lead-id="${lead.id}">
                <td class="p-3.5 font-medium text-zinc-900 dark:text-zinc-100">
                  <div>${lead.name}</div>
                  <div class="text-[11px] text-zinc-400">${lead.phone || lead.email}</div>
                </td>
                <td class="p-3.5">${lead.company || '-'}</td>
                <td class="p-3.5 max-w-[180px] truncate">${lead.serviceOfInterest}</td>
                <td class="p-3.5 font-bold text-zinc-900 dark:text-zinc-100">${formatCurrency(lead.estimatedValue)}</td>
                <td class="p-3.5">${getStatusBadge(lead.status)}</td>
                <td class="p-3.5">${lead.channel}</td>
                <td class="p-3.5">${formatDate(lead.lastContact || lead.createdAt)}</td>
                <td class="p-3.5 text-right">
                  <button data-action="view" data-id="${lead.id}" class="text-blue-600 hover:text-blue-700 font-medium px-2 py-1 rounded hover:bg-blue-50 dark:hover:bg-blue-950/40">Detalhes</button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;

  contentArea.querySelectorAll('tr[data-lead-id]').forEach(row => {
    row.onclick = () => {
      const id = row.getAttribute('data-lead-id');
      openLeadDetailDrawer(id, onNavigate);
    };
  });
}

export function openLeadDetailDrawer(leadId, onNavigate) {
  const lead = store.getState().leads.find(l => l.id === leadId);
  if (!lead) return;

  const phoneDigits = (lead.phone || '').replace(/\D/g, '');
  const waUrl = phoneDigits ? `https://wa.me/55${phoneDigits}` : null;
  const activities = lead.activities || [];

  const columns = [
    { id: 'novo', title: 'Novo Lead' },
    { id: 'contato', title: 'Primeiro Contato' },
    { id: 'diagnostico', title: 'Diagnóstico' },
    { id: 'orcamento', title: 'Orçamento Enviado' },
    { id: 'negociacao', title: 'Em Negociação' },
    { id: 'aprovado', title: 'Lead Aprovado' },
    { id: 'cancelado', title: 'Cancelado' }
  ];

  const content = `
    <div class="space-y-4">
      <!-- Status & Header Info -->
      <div class="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
        <div>
          <span class="text-[10px] text-zinc-400 uppercase font-semibold">Estágio do Funil:</span>
          <div class="mt-1">
            <select id="drawer-stage-select" class="text-xs font-semibold px-2.5 py-1 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 focus:outline-none">
              ${columns.map(c => `<option value="${c.id}" ${lead.status === c.id ? 'selected' : ''}>${c.title}</option>`).join('')}
            </select>
          </div>
        </div>
        <div class="text-right">
          <span class="text-[10px] text-zinc-400 uppercase font-semibold">Valor Estimado:</span>
          <div class="text-base font-bold text-blue-600 dark:text-blue-400">${formatCurrency(lead.estimatedValue)}</div>
        </div>
      </div>

      <!-- Quick Action Buttons -->
      <div class="flex flex-wrap gap-2 pt-1 pb-3 border-b border-zinc-100 dark:border-zinc-800">
        <button id="drawer-convert-btn" class="flex-1 min-w-[130px] px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-xs">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
          <span>Converter em Cliente</span>
        </button>

        <button id="drawer-proposal-btn" class="flex-1 min-w-[130px] px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-xs">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
          <span>Criar Proposta</span>
        </button>

        ${waUrl ? `
          <a href="${waUrl}" target="_blank" rel="noopener noreferrer" class="px-3 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1 transition-colors shadow-xs" title="Conversar no WhatsApp">
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.312.045-.698.077-1.127-.061-.264-.085-.607-.204-1.042-.395-1.844-.808-3.04-2.678-3.133-2.801-.093-.123-.751-1.001-.751-1.908 0-.907.476-1.353.646-1.538.17-.185.372-.231.497-.231.124 0 .248.001.356.006.114.005.267-.043.418.32.155.372.531 1.296.577 1.39.047.093.078.202.016.326-.062.124-.093.201-.186.31-.093.109-.196.243-.28.326-.093.093-.19.195-.082.381.109.186.483.797 1.036 1.29.712.636 1.312.833 1.498.926.186.093.295.078.404-.047.109-.124.466-.543.59-.73.124-.186.248-.155.419-.093.171.062 1.086.512 1.272.605.186.093.31.14.356.217.046.078.046.45-.098.855z"/></svg>
            <span>WhatsApp</span>
          </a>
        ` : ''}
      </div>

      <!-- Lead Details -->
      <div class="space-y-3 text-xs">
        <div class="grid grid-cols-2 gap-2.5 p-3 bg-zinc-50 dark:bg-zinc-800/40 rounded-xl border border-zinc-100 dark:border-zinc-800">
          <div>
            <span class="text-zinc-400 block mb-0.5 text-[10px] uppercase font-medium">Empresa</span>
            <span class="font-medium text-zinc-800 dark:text-zinc-200">${lead.company || 'Pessoa Física'}</span>
          </div>
          <div>
            <span class="text-zinc-400 block mb-0.5 text-[10px] uppercase font-medium">Origem / Canal</span>
            <span class="font-medium text-zinc-800 dark:text-zinc-200">${lead.channel || 'Direto'}</span>
          </div>
          <div>
            <span class="text-zinc-400 block mb-0.5 text-[10px] uppercase font-medium">Telefone</span>
            <span class="font-medium text-zinc-800 dark:text-zinc-200">${lead.phone || '-'}</span>
          </div>
          <div>
            <span class="text-zinc-400 block mb-0.5 text-[10px] uppercase font-medium">E-mail</span>
            <a href="mailto:${lead.email || ''}" class="font-medium text-blue-600 hover:underline truncate block">${lead.email || '-'}</a>
          </div>
          <div>
            <span class="text-zinc-400 block mb-0.5 text-[10px] uppercase font-medium">Responsável</span>
            <span class="font-medium text-zinc-800 dark:text-zinc-200">${lead.responsible || 'Nathan'}</span>
          </div>
          <div>
            <span class="text-zinc-400 block mb-0.5 text-[10px] uppercase font-medium">Previsão Fechamento</span>
            <span class="font-medium text-zinc-800 dark:text-zinc-200">${lead.nextContact ? formatDate(lead.nextContact) : 'Em até 15 dias'}</span>
          </div>
        </div>

        <div>
          <span class="text-zinc-400 block mb-1 text-[10px] uppercase font-semibold">Serviço de Interesse</span>
          <div class="p-3 bg-zinc-50 dark:bg-zinc-800/40 rounded-xl border border-zinc-100 dark:border-zinc-800 font-medium text-zinc-800 dark:text-zinc-200">
            ${lead.serviceOfInterest || 'Geral'}
          </div>
        </div>

        <div>
          <span class="text-zinc-400 block mb-1 text-[10px] uppercase font-semibold">Notas & Diagnóstico</span>
          <div class="p-3 bg-zinc-50 dark:bg-zinc-800/40 rounded-xl border border-zinc-100 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap leading-relaxed">
            ${lead.notes || 'Sem observações adicionais.'}
          </div>
        </div>

        <!-- SECTION: ATIVIDADES & HISTÓRICO (V2) -->
        <div class="pt-2">
          <div class="flex items-center justify-between mb-2">
            <span class="text-[10px] text-zinc-400 uppercase font-bold tracking-wider">Histórico de Atividades (${activities.length})</span>
            <button id="drawer-add-activity-btn" class="px-2.5 py-1 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 text-blue-600 dark:text-blue-300 rounded-lg text-[11px] font-semibold transition-colors">
              + Nova Atividade
            </button>
          </div>

          <div class="space-y-2 max-h-56 overflow-y-auto pr-1">
            ${activities.length > 0 ? activities.map(act => `
              <div class="p-2.5 bg-white dark:bg-zinc-850 rounded-xl border border-zinc-200/70 dark:border-zinc-700/70 flex items-start gap-2.5 text-xs">
                <span class="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
                  act.type === 'whatsapp' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400' :
                  act.type === 'call' ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400' :
                  act.type === 'meeting' ? 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-400' :
                  'bg-zinc-100 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-300'
                } font-bold text-[10px]">
                  ${act.type === 'whatsapp' ? 'WA' : act.type === 'call' ? 'TEL' : act.type === 'meeting' ? 'REU' : 'NOT'}
                </span>
                <div class="flex-1">
                  <div class="flex items-center justify-between">
                    <span class="font-semibold text-zinc-900 dark:text-zinc-100">${act.title}</span>
                    <span class="text-[10px] text-zinc-400">${act.date}</span>
                  </div>
                  ${act.notes ? `<p class="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5 leading-snug">${act.notes}</p>` : ''}
                </div>
              </div>
            `).join('') : `
              <div class="p-3 bg-zinc-50 dark:bg-zinc-800/40 rounded-xl text-center text-[11px] text-zinc-400">
                Nenhuma interação registrada ainda. Clique em "+ Nova Atividade" para registrar ligação, WhatsApp ou reunião.
              </div>
            `}

            <!-- Evento inicial de criação -->
            <div class="p-2.5 bg-zinc-50 dark:bg-zinc-800/20 rounded-xl border border-zinc-100 dark:border-zinc-800 flex items-start gap-2.5 text-xs text-zinc-500">
              <span class="w-6 h-6 rounded-lg bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-400 flex items-center justify-center shrink-0 text-[10px] font-bold">CRM</span>
              <div>
                <span class="font-medium text-zinc-700 dark:text-zinc-300">Lead registrado no sistema</span>
                <span class="text-[10px] text-zinc-400 block">${formatDate(lead.createdAt)}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="flex items-center justify-between text-[11px] text-zinc-400 pt-3 border-t border-zinc-100 dark:border-zinc-800">
          <span>Criado em: ${formatDate(lead.createdAt)}</span>
          <button id="drawer-delete-lead-btn" class="text-rose-600 hover:text-rose-700 font-medium">Excluir Lead</button>
        </div>
      </div>
    </div>
  `;

  const drawer = modal.open({
    title: lead.name,
    content,
    isDrawer: true
  });

  // Stage Switcher
  const stageSelect = drawer.panel.querySelector('#drawer-stage-select');
  if (stageSelect) {
    stageSelect.onchange = (e) => {
      const newStatus = e.target.value;
      store.updateLead(lead.id, { status: newStatus });
      store.addLeadActivity(lead.id, {
        type: 'stage',
        title: `Estágio alterado para '${columns.find(c => c.id === newStatus)?.title}'`
      });
      toast.info(`Estágio alterado com sucesso!`);
    };
  }

  // Add Activity Button
  const addActBtn = drawer.panel.querySelector('#drawer-add-activity-btn');
  if (addActBtn) {
    addActBtn.onclick = () => {
      openAddLeadActivityModal(lead.id, () => {
        drawer.close();
        openLeadDetailDrawer(lead.id, onNavigate);
      });
    };
  }

  // Convert to Client
  drawer.panel.querySelector('#drawer-convert-btn').onclick = () => {
    store.convertLeadToClient(lead.id);
    toast.success(`${lead.name} foi convertido em cliente com sucesso! (+30 XP)`);
    drawer.close();
    if (onNavigate) onNavigate('clients');
  };

  // Create Proposal
  drawer.panel.querySelector('#drawer-proposal-btn').onclick = () => {
    const prop = store.addProposal({
      clientId: null,
      clientName: `${lead.name} (${lead.company || 'PF'})`,
      serviceName: lead.serviceOfInterest || 'Serviço Personalizado',
      value: lead.estimatedValue || 3500,
      description: `Proposta comercial elaborada para o lead ${lead.name}. Observações: ${lead.notes || ''}`
    });
    store.addLeadActivity(lead.id, {
      type: 'proposal',
      title: `Proposta ${prop.number} criada no valor de ${formatCurrency(prop.value)}`
    });
    toast.success(`Proposta ${prop.number} gerada com sucesso!`);
    drawer.close();
    if (onNavigate) onNavigate('proposals');
  };

  // Delete Lead
  drawer.panel.querySelector('#drawer-delete-lead-btn').onclick = () => {
    if (confirm(`Tem certeza que deseja excluir o lead ${lead.name}?`)) {
      store.deleteLead(lead.id);
      toast.info('Lead removido do funil.');
      drawer.close();
      if (onNavigate) onNavigate('crm');
    }
  };
}

function openAddLeadActivityModal(leadId, onSuccess) {
  const content = `
    <div class="space-y-3">
      <div>
        <label class="block text-xs font-medium text-zinc-600 dark:text-zinc-300 mb-1">Tipo de Interação</label>
        <select id="new-act-type" class="w-full px-3 py-2 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:border-blue-600">
          <option value="whatsapp">WhatsApp / Mensagem</option>
          <option value="call">Ligação Telefônica</option>
          <option value="meeting">Reunião / Call de Alinhamento</option>
          <option value="email">E-mail Comercial</option>
          <option value="note">Anotação / Diagnóstico</option>
        </select>
      </div>

      <div>
        <label class="block text-xs font-medium text-zinc-600 dark:text-zinc-300 mb-1">Título da Atividade *</label>
        <input id="new-act-title" class="w-full px-3 py-2 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:border-blue-600" placeholder="Ex: Call de diagnóstico de branding realizada">
      </div>

      <div>
        <label class="block text-xs font-medium text-zinc-600 dark:text-zinc-300 mb-1">Observações e Próximos Passos</label>
        <textarea id="new-act-notes" rows="3" class="w-full px-3 py-2 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:border-blue-600" placeholder="Resumo do alinhamento, expectativas e respostas do cliente..."></textarea>
      </div>

      <div class="flex justify-end gap-2 pt-2">
        <button id="save-new-act-btn" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition-colors">
          Registrar Atividade (+15 XP)
        </button>
      </div>
    </div>
  `;

  const m = modal.open({
    title: '📝 Registrar Nova Atividade',
    content,
    size: 'md'
  });

  m.panel.querySelector('#save-new-act-btn').onclick = () => {
    const type = m.panel.querySelector('#new-act-type').value;
    const title = m.panel.querySelector('#new-act-title').value.trim();
    const notes = m.panel.querySelector('#new-act-notes').value.trim();

    if (!title) {
      toast.warning('Informe um título para a atividade.');
      return;
    }

    store.addLeadActivity(leadId, { type, title, notes });
    toast.success('Atividade comercial registrada!');
    m.close();
    if (onSuccess) onSuccess();
  };
}

function openNewLeadModal(onSuccess) {
  const state = store.getState();
  const content = `
    <form id="crm-create-lead-form" class="space-y-3">
      <div>
        <label class="block text-xs font-medium text-zinc-600 dark:text-zinc-300 mb-1">Nome Completo *</label>
        <input required name="name" class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs" placeholder="Ex: Camila Rocha">
      </div>
      <div class="grid grid-cols-2 gap-2">
        <div>
          <label class="block text-xs font-medium text-zinc-600 dark:text-zinc-300 mb-1">Empresa</label>
          <input name="company" class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs" placeholder="Ex: Estúdio Aurora">
        </div>
        <div>
          <label class="block text-xs font-medium text-zinc-600 dark:text-zinc-300 mb-1">Telefone / WhatsApp</label>
          <input name="phone" class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs" placeholder="(11) 98765-4321">
        </div>
      </div>
      <div class="grid grid-cols-2 gap-2">
        <div>
          <label class="block text-xs font-medium text-zinc-600 dark:text-zinc-300 mb-1">E-mail</label>
          <input type="email" name="email" class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs" placeholder="contato@empresa.com">
        </div>
        <div>
          <label class="block text-xs font-medium text-zinc-600 dark:text-zinc-300 mb-1">Canal de Origem</label>
          <select name="channel" class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs">
            <option value="Instagram">Instagram</option>
            <option value="Indicação">Indicação</option>
            <option value="Google">Google</option>
            <option value="LinkedIn">LinkedIn</option>
            <option value="WhatsApp">WhatsApp</option>
            <option value="Site">Site</option>
            <option value="Outro">Outro</option>
          </select>
        </div>
      </div>
      <div class="grid grid-cols-2 gap-2">
        <div>
          <label class="block text-xs font-medium text-zinc-600 dark:text-zinc-300 mb-1">Serviço de Interesse</label>
          <select name="serviceOfInterest" class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs">
            ${state.services.map(s => `<option value="${s.name}">${s.name}</option>`).join('')}
          </select>
        </div>
        <div>
          <label class="block text-xs font-medium text-zinc-600 dark:text-zinc-300 mb-1">Valor Estimado (R$)</label>
          <input type="number" name="estimatedValue" class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs" placeholder="4500">
        </div>
      </div>
      <div>
        <label class="block text-xs font-medium text-zinc-600 dark:text-zinc-300 mb-1">Notas / Diagnóstico Inicial</label>
        <textarea name="notes" rows="3" class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs" placeholder="Detalhes da conversa, necessidades e objetivos..."></textarea>
      </div>
      <div class="pt-2 flex justify-end gap-2">
        <button type="submit" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors">Salvar Lead</button>
      </div>
    </form>
  `;

  const m = modal.open({
    title: 'Novo Lead',
    content,
    size: 'md'
  });

  m.panel.querySelector('#crm-create-lead-form').onsubmit = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    store.addLead({
      name: fd.get('name'),
      company: fd.get('company'),
      phone: fd.get('phone'),
      email: fd.get('email'),
      channel: fd.get('channel'),
      serviceOfInterest: fd.get('serviceOfInterest'),
      estimatedValue: parseFloat(fd.get('estimatedValue')) || 0,
      notes: fd.get('notes')
    });
    toast.success('Lead cadastrado no funil!');
    m.close();
    if (onSuccess) onSuccess();
  };
}
