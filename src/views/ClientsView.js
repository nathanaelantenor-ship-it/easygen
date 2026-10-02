import { store } from '../state/store.js';
import { modal } from '../components/Modal.js';
import { toast } from '../components/Toast.js';
import { formatCurrency, formatDate } from '../utils/formatters.js';
import { exportToCSV } from '../utils/exportUtils.js';

let filterType = 'all';

export function renderClientsView(container, onNavigate) {
  const { clients, projects, proposals, transactions, documents } = store.getState();

  const filteredClients = filterType === 'all' 
    ? clients 
    : clients.filter(c => c.clientType === filterType);

  const totalLTV = clients.reduce((acc, c) => acc + (c.totalGenerated || 0), 0);
  const monthlyClients = clients.filter(c => c.clientType === 'mensal').length;
  const inactiveClients = clients.filter(c => c.clientType === 'inativo' || c.status === 'inactive');

  container.innerHTML = `
    <div class="space-y-6">
      <!-- Header & Actions -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 class="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">Clientes & Relacionamento</h2>
          <p class="text-xs text-zinc-500">Inteligência 360°, histórico integrado e saúde da carteira de clientes.</p>
        </div>
        <div class="flex items-center gap-2">
          <button id="clients-export-btn" class="px-3 py-1.5 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-xl text-xs font-medium text-zinc-700 dark:text-zinc-300 transition-colors">
            Exportar
          </button>
          <button id="clients-new-btn" class="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-medium transition-colors shadow-xs">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
            <span>Novo Cliente</span>
          </button>
        </div>
      </div>

      <!-- Intelligence & Health Stats -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div class="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-2xs">
          <div class="text-[11px] font-medium text-zinc-500">Base Ativa</div>
          <div class="text-lg font-bold text-zinc-900 dark:text-zinc-100 mt-1">${clients.length} clientes</div>
          <div class="text-[10px] text-zinc-400 mt-0.5">${monthlyClients} com contrato mensal</div>
        </div>

        <div class="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-2xs">
          <div class="text-[11px] font-medium text-zinc-500">Valor Total Gerado (LTV)</div>
          <div class="text-lg font-bold text-blue-600 dark:text-blue-400 mt-1">${formatCurrency(totalLTV)}</div>
          <div class="text-[10px] text-emerald-600 mt-0.5">Média: ${formatCurrency(totalLTV / (clients.length || 1))} / cliente</div>
        </div>

        <div class="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-2xs">
          <div class="text-[11px] font-medium text-zinc-500">Retenção & Recorrência</div>
          <div class="text-lg font-bold text-emerald-600 mt-1">${Math.round((monthlyClients / (clients.length || 1)) * 100)}%</div>
          <div class="text-[10px] text-zinc-400 mt-0.5">Previsibilidade de receita</div>
        </div>

        <div class="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-2xs">
          <div class="text-[11px] font-medium text-zinc-500">Alertas de Relacionamento</div>
          <div class="text-lg font-bold text-amber-600 mt-1">${inactiveClients.length} inativos</div>
          <div class="text-[10px] text-zinc-400 mt-0.5">Sem contratação há > 90 dias</div>
        </div>
      </div>

      <!-- Relationship Alerts Box -->
      ${inactiveClients.length > 0 ? `
        <div class="p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 flex items-start gap-3">
          <div class="p-1 rounded-lg bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-400 shrink-0">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
          </div>
          <div class="text-xs">
            <span class="font-bold text-amber-900 dark:text-amber-200">Oportunidade de Reativação:</span>
            <span class="text-amber-800 dark:text-amber-300 ml-1">
              ${inactiveClients.map(c => `<b>${c.name}</b> (${c.company})`).join(', ')} está sem novas contratações recentemente. Que tal enviar uma mensagem de acompanhamento?
            </span>
          </div>
        </div>
      ` : ''}

      <!-- Filters & Client List -->
      <div class="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-2xs">
        <!-- Filter Tabs -->
        <div class="flex items-center gap-2 p-3 border-b border-zinc-100 dark:border-zinc-800 overflow-x-auto text-xs">
          <button data-filter="all" class="px-3 py-1 rounded-lg font-medium transition-colors ${filterType === 'all' ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900' : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'}">Todos (${clients.length})</button>
          <button data-filter="mensal" class="px-3 py-1 rounded-lg font-medium transition-colors ${filterType === 'mensal' ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900' : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'}">Mensal</button>
          <button data-filter="recorrente" class="px-3 py-1 rounded-lg font-medium transition-colors ${filterType === 'recorrente' ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900' : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'}">Recorrente</button>
          <button data-filter="pontual" class="px-3 py-1 rounded-lg font-medium transition-colors ${filterType === 'pontual' ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900' : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'}">Pontual</button>
          <button data-filter="inativo" class="px-3 py-1 rounded-lg font-medium transition-colors ${filterType === 'inativo' ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900' : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'}">Inativo</button>
        </div>

        <!-- Table -->
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs text-zinc-600 dark:text-zinc-400">
            <thead class="bg-zinc-50 dark:bg-zinc-850 text-zinc-900 dark:text-zinc-200 border-b border-zinc-200 dark:border-zinc-800 font-semibold">
              <tr>
                <th class="p-3.5">Cliente / Empresa</th>
                <th class="p-3.5">Tipo</th>
                <th class="p-3.5">Total Gerado (LTV)</th>
                <th class="p-3.5">Projetos</th>
                <th class="p-3.5">Ticket Médio</th>
                <th class="p-3.5">Último Contato</th>
                <th class="p-3.5 text-right">Ação</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-zinc-100 dark:divide-zinc-800">
              ${filteredClients.map(c => `
                <tr class="hover:bg-zinc-50/70 dark:hover:bg-zinc-850/50 cursor-pointer transition-colors" data-client-id="${c.id}">
                  <td class="p-3.5 font-medium text-zinc-900 dark:text-zinc-100">
                    <div>${c.name}</div>
                    <div class="text-[11px] text-zinc-400">${c.company || c.phone}</div>
                  </td>
                  <td class="p-3.5">
                    <span class="capitalize px-2 py-0.5 rounded-full text-[11px] font-medium ${
                      c.clientType === 'mensal' ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300' :
                      c.clientType === 'recorrente' ? 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300' :
                      c.clientType === 'inativo' ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300' :
                      'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'
                    }">${c.clientType}</span>
                  </td>
                  <td class="p-3.5 font-bold text-zinc-900 dark:text-zinc-100">${formatCurrency(c.totalGenerated)}</td>
                  <td class="p-3.5">${c.projectsCount}</td>
                  <td class="p-3.5">${formatCurrency(c.averageTicket)}</td>
                  <td class="p-3.5">${formatDate(c.lastContactDate || c.entryDate)}</td>
                  <td class="p-3.5 text-right">
                    <button class="text-blue-600 hover:text-blue-700 font-medium px-2 py-1 rounded hover:bg-blue-50 dark:hover:bg-blue-950/40">Visão 360°</button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;

  // Filter click handlers
  container.querySelectorAll('button[data-filter]').forEach(btn => {
    btn.onclick = () => {
      filterType = btn.getAttribute('data-filter');
      renderClientsView(container, onNavigate);
    };
  });

  // Client row click
  container.querySelectorAll('tr[data-client-id]').forEach(row => {
    row.onclick = () => {
      const id = row.getAttribute('data-client-id');
      openClientProfileModal(id, onNavigate);
    };
  });

  // Export
  container.querySelector('#clients-export-btn').onclick = () => {
    const headers = ['Nome', 'Empresa', 'Documento', 'Telefone', 'Email', 'Tipo', 'LTV', 'Projetos', 'Entrada'];
    const rows = clients.map(c => [c.name, c.company, c.document, c.phone, c.email, c.clientType, c.totalGenerated, c.projectsCount, c.entryDate]);
    exportToCSV('clientes_app_teste', rows, headers);
    toast.success('Lista de clientes exportada!');
  };

  // New Client
  container.querySelector('#clients-new-btn').onclick = () => {
    openNewClientModal(() => renderClientsView(container, onNavigate));
  };
}

export function openClientProfileModal(clientId, onNavigate) {
  const state = store.getState();
  const client = state.clients.find(c => c.id === clientId);
  if (!client) return;

  const clientProjects = state.projects.filter(p => p.clientId === client.id);
  const clientDeliveries = (state.deliveries || []).filter(d => d.clientId === client.id);
  const clientProposals = state.proposals.filter(p => p.clientId === client.id);
  const clientTransactions = state.transactions.filter(t => t.clientId === client.id);
  const clientDocuments = state.documents.filter(d => d.clientId === client.id);

  const content = `
    <div class="space-y-4">
      <!-- Profile Header Summary -->
      <div class="p-4 bg-zinc-50 dark:bg-zinc-800/40 rounded-2xl border border-zinc-100 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div class="text-base font-bold text-zinc-900 dark:text-zinc-100">${client.name}</div>
          <div class="text-xs text-zinc-500">${client.company || 'Pessoa Física'} • CPF/CNPJ: ${client.document || 'Não informado'}</div>
          <div class="text-xs text-zinc-400 mt-1">Contato: ${client.phone} • ${client.email}</div>
        </div>
        <div class="text-left sm:text-right">
          <div class="text-[11px] text-zinc-400">Total Faturado (LTV)</div>
          <div class="text-lg font-bold text-blue-600 dark:text-blue-400">${formatCurrency(client.totalGenerated)}</div>
        </div>
      </div>

      <!-- Tab Buttons -->
      <div class="flex items-center gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-2 text-xs font-medium overflow-x-auto">
        <button id="tab-overview" class="profile-tab px-3 py-1.5 rounded-lg bg-blue-600 text-white shrink-0">Geral</button>
        <button id="tab-deliveries" class="profile-tab px-3 py-1.5 rounded-lg text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 shrink-0">Entregas (${clientDeliveries.length})</button>
        <button id="tab-projects" class="profile-tab px-3 py-1.5 rounded-lg text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 shrink-0">Projetos (${clientProjects.length})</button>
        <button id="tab-proposals" class="profile-tab px-3 py-1.5 rounded-lg text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 shrink-0">Propostas (${clientProposals.length})</button>
        <button id="tab-finance" class="profile-tab px-3 py-1.5 rounded-lg text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 shrink-0">Financeiro (${clientTransactions.length})</button>
        <button id="tab-docs" class="profile-tab px-3 py-1.5 rounded-lg text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 shrink-0">Documentos (${clientDocuments.length})</button>
      </div>

      <!-- Tab Content Area -->
      <div id="profile-tab-content" class="min-h-[220px] text-xs">
        <div class="space-y-3">
          <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div class="p-3 bg-zinc-50 dark:bg-zinc-800/40 rounded-xl">
              <span class="text-zinc-400 block text-[11px]">Tipo de Cliente</span>
              <span class="font-semibold capitalize text-zinc-800 dark:text-zinc-200">${client.clientType}</span>
            </div>
            <div class="p-3 bg-zinc-50 dark:bg-zinc-800/40 rounded-xl">
              <span class="text-zinc-400 block text-[11px]">Ticket Médio</span>
              <span class="font-semibold text-zinc-800 dark:text-zinc-200">${formatCurrency(client.averageTicket)}</span>
            </div>
            <div class="p-3 bg-zinc-50 dark:bg-zinc-800/40 rounded-xl">
              <span class="text-zinc-400 block text-[11px]">Canal de Entrada</span>
              <span class="font-semibold text-zinc-800 dark:text-zinc-200">${client.channel || 'Indicação'}</span>
            </div>
          </div>
          <div class="p-3 bg-zinc-50 dark:bg-zinc-800/40 rounded-xl">
            <span class="text-zinc-400 block text-[11px] mb-1">Notas & Preferências</span>
            <p class="text-zinc-700 dark:text-zinc-300">${client.notes || 'Sem observações cadastradas.'}</p>
          </div>
        </div>
      </div>
    </div>
  `;

  const m = modal.open({
    title: `Inteligência do Cliente`,
    content,
    size: 'xl'
  });

  const tabContainer = m.panel.querySelector('#profile-tab-content');
  const tabs = m.panel.querySelectorAll('.profile-tab');

  const setTab = (target) => {
    tabs.forEach(t => {
      t.className = 'profile-tab px-3 py-1.5 rounded-lg text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200';
    });
    target.className = 'profile-tab px-3 py-1.5 rounded-lg bg-blue-600 text-white';
  };

  m.panel.querySelector('#tab-overview').onclick = (e) => {
    setTab(e.target);
    tabContainer.innerHTML = `
      <div class="space-y-3">
        <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div class="p-3 bg-zinc-50 dark:bg-zinc-800/40 rounded-xl">
            <span class="text-zinc-400 block text-[11px]">Tipo de Cliente</span>
            <span class="font-semibold capitalize text-zinc-800 dark:text-zinc-200">${client.clientType}</span>
          </div>
          <div class="p-3 bg-zinc-50 dark:bg-zinc-800/40 rounded-xl">
            <span class="text-zinc-400 block text-[11px]">Ticket Médio</span>
            <span class="font-semibold text-zinc-800 dark:text-zinc-200">${formatCurrency(client.averageTicket)}</span>
          </div>
          <div class="p-3 bg-zinc-50 dark:bg-zinc-800/40 rounded-xl">
            <span class="text-zinc-400 block text-[11px]">Canal de Entrada</span>
            <span class="font-semibold text-zinc-800 dark:text-zinc-200">${client.channel || 'Indicação'}</span>
          </div>
        </div>
        <div class="p-3 bg-zinc-50 dark:bg-zinc-800/40 rounded-xl">
          <span class="text-zinc-400 block text-[11px] mb-1">Notas & Preferências</span>
          <p class="text-zinc-700 dark:text-zinc-300">${client.notes || 'Sem observações cadastradas.'}</p>
        </div>
      </div>
    `;
  };

  m.panel.querySelector('#tab-deliveries').onclick = (e) => {
    setTab(e.target);
    tabContainer.innerHTML = `
      <div class="space-y-2">
        ${clientDeliveries.length === 0 ? '<p class="text-zinc-400 py-6 text-center">Nenhuma entrega cadastrada para este cliente.</p>' : clientDeliveries.map(d => {
          const checklist = d.checklist || [];
          const completedChecks = checklist.filter(c => c.completed).length;
          const chkPercent = checklist.length > 0 ? Math.round((completedChecks / checklist.length) * 100) : 0;
          return `
            <div class="p-3 bg-zinc-50 dark:bg-zinc-800/40 rounded-xl border border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
              <div>
                <div class="font-semibold text-zinc-900 dark:text-zinc-100">${d.title}</div>
                <div class="text-[11px] text-zinc-400">
                  ${d.projectName ? `Projeto: ${d.projectName} • ` : ''}Prazo: ${d.dueDate ? d.dueDate.split('-').reverse().join('/') : 'Sem prazo'} • Checklist: ${completedChecks}/${checklist.length} (${chkPercent}%)
                </div>
              </div>
              <div class="flex items-center gap-2">
                <span class="px-2 py-0.5 rounded text-[10px] font-bold ${
                  d.priority === 'urgente' ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400' :
                  d.priority === 'alta' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400' :
                  'bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-400'
                }">${d.priority.toUpperCase()}</span>
                <span class="text-xs font-semibold text-blue-600 capitalize">${d.status}</span>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  };

  m.panel.querySelector('#tab-projects').onclick = (e) => {
    setTab(e.target);
    tabContainer.innerHTML = `
      <div class="space-y-2">
        ${clientProjects.length === 0 ? '<p class="text-zinc-400 py-6 text-center">Nenhum projeto associado.</p>' : clientProjects.map(p => `
          <div class="p-3 bg-zinc-50 dark:bg-zinc-800/40 rounded-xl border border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
            <div>
              <div class="font-semibold text-zinc-900 dark:text-zinc-100">${p.title}</div>
              <div class="text-[11px] text-zinc-400">Prazo: ${formatDate(p.deadlineDate)} • Valor: ${formatCurrency(p.value)}</div>
            </div>
            <span class="text-xs font-semibold text-blue-600">${p.stage}</span>
          </div>
        `).join('')}
      </div>
    `;
  };

  m.panel.querySelector('#tab-proposals').onclick = (e) => {
    setTab(e.target);
    tabContainer.innerHTML = `
      <div class="space-y-2">
        ${clientProposals.length === 0 ? '<p class="text-zinc-400 py-6 text-center">Nenhuma proposta vinculada.</p>' : clientProposals.map(p => `
          <div class="p-3 bg-zinc-50 dark:bg-zinc-800/40 rounded-xl border border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
            <div>
              <div class="font-semibold text-zinc-900 dark:text-zinc-100">${p.number} - ${p.serviceName}</div>
              <div class="text-[11px] text-zinc-400">Valor: ${formatCurrency(p.finalValue || p.value)} • Criada em: ${formatDate(p.createdAt)}</div>
            </div>
            <span class="text-xs font-semibold text-emerald-600 uppercase">${p.status}</span>
          </div>
        `).join('')}
      </div>
    `;
  };

  m.panel.querySelector('#tab-finance').onclick = (e) => {
    setTab(e.target);
    tabContainer.innerHTML = `
      <div class="space-y-2">
        ${clientTransactions.length === 0 ? '<p class="text-zinc-400 py-6 text-center">Nenhum lançamento financeiro para este cliente.</p>' : clientTransactions.map(t => `
          <div class="p-3 bg-zinc-50 dark:bg-zinc-800/40 rounded-xl border border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
            <div>
              <div class="font-semibold text-zinc-900 dark:text-zinc-100">${t.title}</div>
              <div class="text-[11px] text-zinc-400">${formatDate(t.date)} • ${t.paymentMethod} • ${t.category}</div>
            </div>
            <div class="font-bold text-emerald-600">${formatCurrency(t.amount)}</div>
          </div>
        `).join('')}
      </div>
    `;
  };

  m.panel.querySelector('#tab-docs').onclick = (e) => {
    setTab(e.target);
    tabContainer.innerHTML = `
      <div class="space-y-2">
        ${clientDocuments.length === 0 ? '<p class="text-zinc-400 py-6 text-center">Nenhum documento anexado.</p>' : clientDocuments.map(d => `
          <div class="p-3 bg-zinc-50 dark:bg-zinc-800/40 rounded-xl border border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
            <div>
              <div class="font-semibold text-zinc-900 dark:text-zinc-100">${d.name}</div>
              <div class="text-[11px] text-zinc-400">${d.category} • ${d.size} • ${formatDate(d.uploadDate)}</div>
            </div>
            <span class="text-[11px] text-blue-600 font-medium">Na Central de Docs</span>
          </div>
        `).join('')}
      </div>
    `;
  };
}

function openNewClientModal(onSuccess) {
  const content = `
    <form id="clients-create-form" class="space-y-3">
      <div>
        <label class="block text-xs font-medium text-zinc-600 dark:text-zinc-300 mb-1">Nome do Cliente / Responsável *</label>
        <input required name="name" class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs" placeholder="Ex: Laura Vasconcelos">
      </div>
      <div class="grid grid-cols-2 gap-2">
        <div>
          <label class="block text-xs font-medium text-zinc-600 dark:text-zinc-300 mb-1">Nome da Empresa</label>
          <input name="company" class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs" placeholder="Ex: Studio Lumina">
        </div>
        <div>
          <label class="block text-xs font-medium text-zinc-600 dark:text-zinc-300 mb-1">CPF ou CNPJ</label>
          <input name="document" class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs" placeholder="00.000.000/0001-00">
        </div>
      </div>
      <div class="grid grid-cols-2 gap-2">
        <div>
          <label class="block text-xs font-medium text-zinc-600 dark:text-zinc-300 mb-1">Telefone / WhatsApp</label>
          <input name="phone" class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs" placeholder="(11) 98765-4321">
        </div>
        <div>
          <label class="block text-xs font-medium text-zinc-600 dark:text-zinc-300 mb-1">E-mail</label>
          <input type="email" name="email" class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs" placeholder="cliente@empresa.com">
        </div>
      </div>
      <div class="grid grid-cols-2 gap-2">
        <div>
          <label class="block text-xs font-medium text-zinc-600 dark:text-zinc-300 mb-1">Tipo de Cliente</label>
          <select name="clientType" class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs">
            <option value="mensal">Cliente Mensal</option>
            <option value="recorrente">Cliente Recorrente</option>
            <option value="pontual" selected>Cliente Pontual</option>
            <option value="freelancer">Cliente Freelancer</option>
            <option value="inativo">Cliente Inativo</option>
            <option value="prospect">Prospect</option>
          </select>
        </div>
        <div>
          <label class="block text-xs font-medium text-zinc-600 dark:text-zinc-300 mb-1">Canal de Aquisição</label>
          <input name="channel" class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs" placeholder="Indicação, Instagram, etc.">
        </div>
      </div>
      <div>
        <label class="block text-xs font-medium text-zinc-600 dark:text-zinc-300 mb-1">Observações do Cliente</label>
        <textarea name="notes" rows="2" class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs" placeholder="Histórico, preferências, detalhes do contrato..."></textarea>
      </div>
      <div class="pt-2 flex justify-end gap-2">
        <button type="submit" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors">Cadastrar Cliente</button>
      </div>
    </form>
  `;

  const m = modal.open({
    title: 'Novo Cliente',
    content,
    size: 'md'
  });

  m.panel.querySelector('#clients-create-form').onsubmit = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    store.addClient({
      name: fd.get('name'),
      company: fd.get('company'),
      document: fd.get('document'),
      phone: fd.get('phone'),
      whatsapp: fd.get('phone'),
      email: fd.get('email'),
      clientType: fd.get('clientType'),
      channel: fd.get('channel'),
      notes: fd.get('notes')
    });
    toast.success('Cliente cadastrado com sucesso!');
    m.close();
    if (onSuccess) onSuccess();
  };
}
