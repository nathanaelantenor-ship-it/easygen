import { store } from '../state/store.js';
import { modal } from '../components/Modal.js';
import { toast } from '../components/Toast.js';
import { formatCurrency, formatDate, getStatusBadge } from '../utils/formatters.js';
import { exportToCSV, exportToExcel } from '../utils/exportUtils.js';

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

          <!-- Export -->
          <button id="crm-export-btn" class="px-3 py-1.5 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-xl text-xs font-medium text-zinc-700 dark:text-zinc-300 transition-colors">
            Exportar
          </button>

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

  // Export handler
  container.querySelector('#crm-export-btn').onclick = () => {
    const headers = ['Nome', 'Empresa', 'Telefone', 'Email', 'Canal', 'Serviço', 'Valor Estimado', 'Status', 'Data'];
    const rows = leads.map(l => [l.name, l.company, l.phone, l.email, l.channel, l.serviceOfInterest, l.estimatedValue, l.status, l.createdAt]);
    exportToCSV('leads_crm', rows, headers);
    toast.success('Leads exportados com sucesso!');
  };

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

  const content = `
    <div class="space-y-4">
      <!-- Status & Header Info -->
      <div class="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
        <div>
          <span class="text-xs text-zinc-400">Status Atual:</span>
          <div class="mt-1">${getStatusBadge(lead.status)}</div>
        </div>
        <div class="text-right">
          <span class="text-xs text-zinc-400">Valor Estimado:</span>
          <div class="text-base font-bold text-blue-600 dark:text-blue-400">${formatCurrency(lead.estimatedValue)}</div>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="flex flex-wrap gap-2 pt-1 pb-3 border-b border-zinc-100 dark:border-zinc-800">
        <button id="drawer-convert-btn" class="flex-1 min-w-[140px] px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-xs">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
          <span>Converter em Cliente</span>
        </button>

        <button id="drawer-proposal-btn" class="flex-1 min-w-[140px] px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-xs">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
          <span>Criar Proposta</span>
        </button>
      </div>

      <!-- Lead Details List -->
      <div class="space-y-3 text-xs">
        <div class="grid grid-cols-2 gap-3 p-3 bg-zinc-50 dark:bg-zinc-800/40 rounded-xl border border-zinc-100 dark:border-zinc-800">
          <div>
            <span class="text-zinc-400 block mb-0.5">Empresa</span>
            <span class="font-medium text-zinc-800 dark:text-zinc-200">${lead.company || 'Pessoa Física'}</span>
          </div>
          <div>
            <span class="text-zinc-400 block mb-0.5">Origem / Canal</span>
            <span class="font-medium text-zinc-800 dark:text-zinc-200">${lead.channel}</span>
          </div>
          <div>
            <span class="text-zinc-400 block mb-0.5">Telefone / WhatsApp</span>
            <span class="font-medium text-zinc-800 dark:text-zinc-200">${lead.phone || '-'}</span>
          </div>
          <div>
            <span class="text-zinc-400 block mb-0.5">E-mail</span>
            <span class="font-medium text-zinc-800 dark:text-zinc-200">${lead.email || '-'}</span>
          </div>
        </div>

        <div>
          <span class="text-zinc-400 block mb-1">Serviço de Interesse</span>
          <div class="p-3 bg-zinc-50 dark:bg-zinc-800/40 rounded-xl border border-zinc-100 dark:border-zinc-800 font-medium text-zinc-800 dark:text-zinc-200">
            ${lead.serviceOfInterest}
          </div>
        </div>

        <div>
          <span class="text-zinc-400 block mb-1">Notas & Diagnóstico</span>
          <div class="p-3 bg-zinc-50 dark:bg-zinc-800/40 rounded-xl border border-zinc-100 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap leading-relaxed">
            ${lead.notes || 'Sem observações adicionais.'}
          </div>
        </div>

        <div class="flex items-center justify-between text-[11px] text-zinc-400 pt-2">
          <span>Criado em: ${formatDate(lead.createdAt)}</span>
          <span>Responsável: ${lead.responsible || 'Nathan'}</span>
        </div>
      </div>

      <!-- Delete Lead Option -->
      <div class="pt-4 border-t border-zinc-100 dark:border-zinc-800 flex justify-between">
        <button id="drawer-delete-lead-btn" class="text-rose-600 hover:text-rose-700 text-xs font-medium">Excluir Lead</button>
      </div>
    </div>
  `;

  const drawer = modal.open({
    title: lead.name,
    content,
    isDrawer: true
  });

  // Convert to Client
  drawer.panel.querySelector('#drawer-convert-btn').onclick = () => {
    store.convertLeadToClient(lead.id);
    toast.success(`${lead.name} foi convertido em cliente com sucesso!`);
    drawer.close();
    if (onNavigate) onNavigate('clients');
  };

  // Create Proposal
  drawer.panel.querySelector('#drawer-proposal-btn').onclick = () => {
    const prop = store.addProposal({
      clientName: `${lead.name} (${lead.company || 'PF'})`,
      serviceName: lead.serviceOfInterest,
      value: lead.estimatedValue,
      description: `Proposta gerada a partir do lead no CRM: ${lead.notes || ''}`
    });
    toast.success(`Proposta ${prop.number} gerada!`);
    drawer.close();
    if (onNavigate) onNavigate('proposals');
  };

  // Delete Lead
  drawer.panel.querySelector('#drawer-delete-lead-btn').onclick = () => {
    if (confirm(`Tem certeza que deseja excluir o lead ${lead.name}?`)) {
      store.deleteLead(lead.id);
      toast.info('Lead removido.');
      drawer.close();
      if (onNavigate) onNavigate('crm');
    }
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
