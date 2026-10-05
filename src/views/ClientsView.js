import { store } from '../state/store.js';
import { modal } from '../components/Modal.js';
import { toast } from '../components/Toast.js';
import { formatCurrency, formatDate, getStatusBadge } from '../utils/formatters.js';
import { renderExportButtonHtml, bindExportButton } from '../components/ExportMenu.js';
import { getInstallmentStatusBadge, openEditTransactionModal, openTransactionModal } from './FinanceView.js';

let filterType = 'all';

export function renderClientsView(container, onNavigate) {
  const { clients, projects, proposals, transactions, documents, deliveries } = store.getState();

  const filteredClients = filterType === 'all' 
    ? clients 
    : filterType === 'freelancer'
      ? clients.filter(c => c.clientType === 'freelancer' || c.clientType === 'freelance')
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
          ${renderExportButtonHtml('clients-export-dropdown', 'Exportar')}
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
              ${inactiveClients.map(c => `<b>${c.name}</b> (${c.company || 'PF'})`).join(', ')} está sem novas contratações recentemente. Que tal enviar uma mensagem de acompanhamento?
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
          <button data-filter="freelancer" class="px-3 py-1 rounded-lg font-medium transition-colors ${filterType === 'freelancer' ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900' : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'}">Freelancer</button>
          <button data-filter="inativo" class="px-3 py-1 rounded-lg font-medium transition-colors ${filterType === 'inativo' ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900' : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'}">Inativo</button>
          <button data-filter="prospect" class="px-3 py-1 rounded-lg font-medium transition-colors ${filterType === 'prospect' ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900' : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'}">Prospect</button>
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
              ${filteredClients.length > 0 ? filteredClients.map(c => {
                const initials = c.name ? c.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() : 'CL';
                const cleanPhone = (c.phone || c.whatsapp || '').replace(/\D/g, '');
                return `
                  <tr class="hover:bg-zinc-50/70 dark:hover:bg-zinc-850/50 cursor-pointer transition-colors" data-client-id="${c.id}">
                    <td class="p-3.5 font-medium text-zinc-900 dark:text-zinc-100">
                      <div class="flex items-center gap-2.5">
                        <div class="w-8 h-8 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 font-bold text-xs flex items-center justify-center shrink-0">
                          ${initials}
                        </div>
                        <div>
                          <div class="font-semibold text-zinc-900 dark:text-zinc-100">${c.name}</div>
                          <div class="text-[11px] text-zinc-400">${c.company || c.phone || 'Pessoa Física'}</div>
                        </div>
                      </div>
                    </td>
                    <td class="p-3.5">
                      <span class="capitalize px-2 py-0.5 rounded-full text-[11px] font-medium ${
                        c.clientType === 'mensal' ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300' :
                        c.clientType === 'recorrente' ? 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300' :
                        c.clientType === 'inativo' ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300' :
                        c.clientType === 'prospect' ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300' :
                        'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'
                      }">${c.clientType}</span>
                    </td>
                    <td class="p-3.5 font-bold text-zinc-900 dark:text-zinc-100">${formatCurrency(c.totalGenerated)}</td>
                    <td class="p-3.5">${c.projectsCount || 0}</td>
                    <td class="p-3.5">${formatCurrency(c.averageTicket)}</td>
                    <td class="p-3.5">${formatDate(c.lastContactDate || c.entryDate)}</td>
                    <td class="p-3.5 text-right">
                      <div class="flex items-center justify-end gap-1.5" onclick="event.stopPropagation()">
                        ${cleanPhone ? `
                          <a href="https://wa.me/55${cleanPhone}" target="_blank" title="WhatsApp" class="p-1.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-lg transition-colors">
                            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z"/></svg>
                          </a>
                        ` : ''}
                        <button class="client-detail-btn text-blue-600 hover:text-blue-700 font-semibold px-2 py-1 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/40" data-id="${c.id}">
                          Visão 360°
                        </button>
                      </div>
                    </td>
                  </tr>
                `;
              }).join('') : `
                <tr>
                  <td colspan="7" class="p-8 text-center">
                    <div class="max-w-xs mx-auto space-y-3">
                      <div class="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto text-xl font-bold">
                        👥
                      </div>
                      <div>
                        <h4 class="text-xs font-bold text-zinc-900 dark:text-zinc-100">Nenhum cliente cadastrado ainda</h4>
                        <p class="text-[11px] text-zinc-400 mt-1">Cadastre seus clientes para gerenciar projetos, orçamentos e faturamento integrado.</p>
                      </div>
                      <button id="clients-empty-new-btn" class="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs cursor-pointer">
                        + Cadastrar Primeiro Cliente
                      </button>
                    </div>
                  </td>
                </tr>
              `}
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
      openClientProfileModal(id, onNavigate, () => renderClientsView(container, onNavigate));
    };
  });

  // Client detail button click
  container.querySelectorAll('.client-detail-btn').forEach(btn => {
    btn.onclick = (e) => {
      e.stopPropagation();
      const id = btn.getAttribute('data-id');
      openClientProfileModal(id, onNavigate, () => renderClientsView(container, onNavigate));
    };
  });

  // Exportação Universal (PDF, CSV, Excel)
  bindExportButton(container, 'clients-export-dropdown', () => {
    const headers = ['Nome', 'Empresa', 'Documento', 'Telefone', 'Email', 'Tipo', 'LTV (R$)', 'Projetos', 'Data Entrada'];
    const rows = filteredClients.map(c => [
      c.name,
      c.company || '-',
      c.document || '-',
      c.phone || '-',
      c.email || '-',
      c.clientType,
      (c.totalGenerated || 0).toFixed(2).replace('.', ','),
      c.projectsCount || 0,
      formatDate(c.entryDate)
    ]);
    const summary = [
      { label: 'Total de Clientes', value: filteredClients.length },
      { label: 'LTV Consolidado', value: formatCurrency(totalLTV) },
      { label: 'Contratos Mensais', value: monthlyClients }
    ];
    return {
      filename: `clientes_${new Date().toISOString().split('T')[0]}`,
      title: 'Carteira de Clientes & Relacionamento',
      headers,
      rows,
      summary,
      filters: filterType !== 'all' ? `Tipo: ${filterType}` : 'Todos os clientes'
    };
  });

  // New Client
  container.querySelector('#clients-new-btn').onclick = () => {
    openNewClientModal(() => renderClientsView(container, onNavigate));
  };

  const emptyBtn = container.querySelector('#clients-empty-new-btn');
  if (emptyBtn) {
    emptyBtn.onclick = () => {
      openNewClientModal(() => renderClientsView(container, onNavigate));
    };
  }
}

export function openClientProfileModal(clientId, onNavigate, onRefreshList) {
  const state = store.getState();
  const client = state.clients.find(c => c.id === clientId);
  if (!client) return;

  const clientProjects = state.projects.filter(p => p.clientId === client.id || (p.clientName && p.clientName.toLowerCase().includes(client.name.toLowerCase())));
  const clientDeliveries = (state.deliveries || []).filter(d => d.clientId === client.id || (d.clientName && d.clientName.toLowerCase().includes(client.name.toLowerCase())));
  const clientProposals = state.proposals.filter(p => p.clientId === client.id || (p.clientName && p.clientName.toLowerCase().includes(client.name.toLowerCase())));
  const clientTransactions = state.transactions.filter(t => t.clientId === client.id || (t.clientName && t.clientName.toLowerCase().includes(client.name.toLowerCase())));
  const clientDocuments = state.documents.filter(d => d.clientId === client.id);
  const clientActivities = client.activities || [];

  // Financial summary for this client
  const totalPaid = clientTransactions.filter(t => t.type === 'income' && t.status === 'paid').reduce((acc, t) => acc + (t.amount || 0), 0);
  const totalPending = clientTransactions.filter(t => t.type === 'income' && t.status === 'pending').reduce((acc, t) => acc + (t.amount || 0), 0);

  const cleanPhone = (client.phone || client.whatsapp || '').replace(/\D/g, '');
  const initials = client.name ? client.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() : 'CL';

  const content = `
    <div class="space-y-4">
      <!-- Top 360 Header Bar -->
      <div class="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 space-y-3">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 rounded-2xl bg-blue-600 text-white font-bold text-lg flex items-center justify-center shrink-0 shadow-xs">
              ${initials}
            </div>
            <div>
              <div class="flex items-center gap-2 flex-wrap">
                <span class="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100">${client.name}</span>
                <select id="drawer-client-type-select" class="px-2 py-0.5 text-xs font-semibold rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-850 text-zinc-800 dark:text-zinc-200 cursor-pointer shadow-2xs">
                  <option value="mensal" ${client.clientType === 'mensal' ? 'selected' : ''}>Contrato Mensal</option>
                  <option value="recorrente" ${client.clientType === 'recorrente' ? 'selected' : ''}>Recorrente</option>
                  <option value="pontual" ${client.clientType === 'pontual' ? 'selected' : ''}>Pontual</option>
                  <option value="freelancer" ${client.clientType === 'freelancer' || client.clientType === 'freelance' ? 'selected' : ''}>Freelancer</option>
                  <option value="inativo" ${client.clientType === 'inativo' ? 'selected' : ''}>Inativo</option>
                  <option value="prospect" ${client.clientType === 'prospect' ? 'selected' : ''}>Prospect</option>
                </select>
              </div>
              <div class="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                ${client.company ? `<span class="font-medium text-zinc-700 dark:text-zinc-300">${client.company}</span> • ` : ''}CPF/CNPJ: ${client.document || 'Não informado'}
              </div>
            </div>
          </div>

          <!-- Direct Communication Actions -->
          <div class="flex items-center gap-2">
            ${cleanPhone ? `
              <a href="https://wa.me/55${cleanPhone}" target="_blank" class="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-2xs transition-colors">
                <svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z"/></svg>
                <span>WhatsApp</span>
              </a>
            ` : ''}
            ${client.email ? `
              <a href="mailto:${client.email}" class="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600 text-zinc-800 dark:text-zinc-200 rounded-xl text-xs font-semibold transition-colors">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                <span>E-mail</span>
              </a>
            ` : ''}
            <button id="drawer-edit-client-btn" class="p-1.5 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700" title="Editar Cadastro">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
            </button>
          </div>
        </div>

        <!-- Quick Operational Actions Strip -->
        <div class="flex items-center gap-2 overflow-x-auto pt-2 border-t border-zinc-200/60 dark:border-zinc-700/60 text-xs">
          <button id="quick-add-project" class="px-2.5 py-1 bg-white dark:bg-zinc-850 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg font-medium text-zinc-700 dark:text-zinc-300 shrink-0 transition-colors flex items-center gap-1">
            <svg class="w-3.5 h-3.5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
            <span>Novo Projeto</span>
          </button>
          <button id="quick-add-delivery" class="px-2.5 py-1 bg-white dark:bg-zinc-850 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg font-medium text-zinc-700 dark:text-zinc-300 shrink-0 transition-colors flex items-center gap-1">
            <svg class="w-3.5 h-3.5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
            <span>Nova Entrega</span>
          </button>
          <button id="quick-add-proposal" class="px-2.5 py-1 bg-white dark:bg-zinc-850 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg font-medium text-zinc-700 dark:text-zinc-300 shrink-0 transition-colors flex items-center gap-1">
            <svg class="w-3.5 h-3.5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
            <span>Nova Proposta</span>
          </button>
          <button id="quick-add-transaction" class="px-2.5 py-1 bg-white dark:bg-zinc-850 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg font-medium text-zinc-700 dark:text-zinc-300 shrink-0 transition-colors flex items-center gap-1">
            <svg class="w-3.5 h-3.5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            <span>Lançar Receita</span>
          </button>
        </div>
      </div>

      <!-- Tab Navigation -->
      <div class="flex items-center gap-1.5 border-b border-zinc-200 dark:border-zinc-800 pb-2 text-xs font-medium overflow-x-auto">
        <button id="tab-overview" class="profile-tab px-3 py-1.5 rounded-lg bg-blue-600 text-white shrink-0 font-semibold shadow-2xs">Visão Geral</button>
        <button id="tab-projects" class="profile-tab px-3 py-1.5 rounded-lg text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 shrink-0">Projetos (${clientProjects.length})</button>
        <button id="tab-deliveries" class="profile-tab px-3 py-1.5 rounded-lg text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 shrink-0">Entregas (${clientDeliveries.length})</button>
        <button id="tab-finance" class="profile-tab px-3 py-1.5 rounded-lg text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 shrink-0">Financeiro (${clientTransactions.length})</button>
        <button id="tab-proposals" class="profile-tab px-3 py-1.5 rounded-lg text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 shrink-0">Propostas (${clientProposals.length})</button>
        <button id="tab-docs" class="profile-tab px-3 py-1.5 rounded-lg text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 shrink-0">Documentos (${clientDocuments.length})</button>
        <button id="tab-timeline" class="profile-tab px-3 py-1.5 rounded-lg text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 shrink-0">Histórico (${clientActivities.length})</button>
      </div>

      <!-- Tab Content Area -->
      <div id="profile-tab-content" class="min-h-[300px] text-xs"></div>
    </div>
  `;

  const drawer = modal.open({
    title: `Inteligência 360° — ${client.name}`,
    content,
    isDrawer: true
  });

  const tabContainer = drawer.panel.querySelector('#profile-tab-content');
  const tabs = drawer.panel.querySelectorAll('.profile-tab');

  const setTab = (target) => {
    tabs.forEach(t => {
      t.className = 'profile-tab px-3 py-1.5 rounded-lg text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 shrink-0 font-medium transition-colors';
    });
    target.className = 'profile-tab px-3 py-1.5 rounded-lg bg-blue-600 text-white shrink-0 font-semibold shadow-2xs';
  };

  // Renderers for each tab
  function renderOverviewTab() {
    tabContainer.innerHTML = `
      <div class="space-y-4">
        <!-- 4 Health KPIs -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div class="p-3 bg-zinc-50 dark:bg-zinc-800/40 rounded-xl border border-zinc-100 dark:border-zinc-800">
            <span class="text-zinc-400 block text-[10px] uppercase font-bold">LTV Gerado</span>
            <span class="text-base font-bold text-blue-600 dark:text-blue-400 mt-0.5 block">${formatCurrency(client.totalGenerated || 0)}</span>
          </div>
          <div class="p-3 bg-zinc-50 dark:bg-zinc-800/40 rounded-xl border border-zinc-100 dark:border-zinc-800">
            <span class="text-zinc-400 block text-[10px] uppercase font-bold">Ticket Médio</span>
            <span class="text-base font-bold text-zinc-900 dark:text-zinc-100 mt-0.5 block">${formatCurrency(client.averageTicket || 0)}</span>
          </div>
          <div class="p-3 bg-zinc-50 dark:bg-zinc-800/40 rounded-xl border border-zinc-100 dark:border-zinc-800">
            <span class="text-zinc-400 block text-[10px] uppercase font-bold">A Receber</span>
            <span class="text-base font-bold text-amber-600 mt-0.5 block">${formatCurrency(totalPending)}</span>
          </div>
          <div class="p-3 bg-zinc-50 dark:bg-zinc-800/40 rounded-xl border border-zinc-100 dark:border-zinc-800">
            <span class="text-zinc-400 block text-[10px] uppercase font-bold">Projetos Ativos</span>
            <span class="text-base font-bold text-emerald-600 mt-0.5 block">${clientProjects.length}</span>
          </div>
        </div>

        <!-- Contact & Fiscal Data -->
        <div class="p-3.5 bg-zinc-50 dark:bg-zinc-800/40 rounded-xl border border-zinc-100 dark:border-zinc-800 space-y-2.5">
          <span class="text-zinc-400 block text-[10px] uppercase font-bold tracking-wider">Dados de Contato & Cadastrais</span>
          <div class="grid grid-cols-2 gap-3 text-xs">
            <div>
              <span class="text-zinc-400 block text-[11px]">Telefone / WhatsApp</span>
              <span class="font-medium text-zinc-800 dark:text-zinc-200">${client.phone || client.whatsapp || 'Não informado'}</span>
            </div>
            <div>
              <span class="text-zinc-400 block text-[11px]">E-mail</span>
              <a href="mailto:${client.email}" class="font-medium text-blue-600 hover:underline truncate block">${client.email || 'Não informado'}</a>
            </div>
            <div>
              <span class="text-zinc-400 block text-[11px]">Endereço</span>
              <span class="font-medium text-zinc-800 dark:text-zinc-200">${client.address || 'Não cadastrado'}</span>
            </div>
            <div>
              <span class="text-zinc-400 block text-[11px]">Instagram / Web</span>
              <span class="font-medium text-zinc-800 dark:text-zinc-200">${client.instagram || client.website || '-'}</span>
            </div>
          </div>
        </div>

        <!-- Intelligence & Acquisition -->
        <div class="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          <div class="p-3 bg-zinc-50 dark:bg-zinc-800/40 rounded-xl border border-zinc-100 dark:border-zinc-800">
            <span class="text-zinc-400 block text-[10px] uppercase font-bold">Canal de Entrada</span>
            <span class="font-semibold text-zinc-800 dark:text-zinc-200 mt-0.5 block">${client.channel || 'Indicação'}</span>
          </div>
          <div class="p-3 bg-zinc-50 dark:bg-zinc-800/40 rounded-xl border border-zinc-100 dark:border-zinc-800">
            <span class="text-zinc-400 block text-[10px] uppercase font-bold">Cliente Desde</span>
            <span class="font-semibold text-zinc-800 dark:text-zinc-200 mt-0.5 block">${formatDate(client.entryDate)}</span>
          </div>
          <div class="p-3 bg-zinc-50 dark:bg-zinc-800/40 rounded-xl border border-zinc-100 dark:border-zinc-800">
            <span class="text-zinc-400 block text-[10px] uppercase font-bold">Último Contato</span>
            <span class="font-semibold text-zinc-800 dark:text-zinc-200 mt-0.5 block">${formatDate(client.lastContactDate || client.entryDate)}</span>
          </div>
        </div>

        <!-- Notes -->
        <div class="p-3.5 bg-zinc-50 dark:bg-zinc-800/40 rounded-xl border border-zinc-100 dark:border-zinc-800">
          <div class="flex items-center justify-between mb-1.5">
            <span class="text-zinc-400 block text-[10px] uppercase font-bold tracking-wider">Notas Estratégicas & Preferências</span>
          </div>
          <p class="text-zinc-700 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap">${client.notes || 'Sem anotações cadastradas para este cliente.'}</p>
        </div>
      </div>
    `;
  }

  function renderProjectsTab() {
    tabContainer.innerHTML = `
      <div class="space-y-3">
        <div class="flex items-center justify-between">
          <span class="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Projetos do Cliente (${clientProjects.length})</span>
          <button id="tab-add-project-btn" class="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors">
            + Novo Projeto
          </button>
        </div>

        ${clientProjects.length === 0 ? `
          <div class="p-6 text-center bg-zinc-50 dark:bg-zinc-850 rounded-2xl border border-zinc-200 dark:border-zinc-800">
            <p class="text-zinc-400 text-xs">Nenhum projeto cadastrado para este cliente.</p>
            <button id="empty-add-proj" class="mt-2.5 px-3 py-1.5 bg-blue-600 text-white rounded-xl text-xs font-semibold">Iniciar Primeiro Projeto</button>
          </div>
        ` : `
          <div class="space-y-2">
            ${clientProjects.map(p => {
              const tasks = p.tasks || [];
              const completedTasks = tasks.filter(t => t.completed).length;
              const progressPct = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;
              return `
                <div class="p-3 bg-zinc-50 dark:bg-zinc-800/40 rounded-xl border border-zinc-100 dark:border-zinc-800 space-y-2">
                  <div class="flex items-start justify-between gap-2">
                    <div>
                      <div class="font-semibold text-zinc-900 dark:text-zinc-100 text-xs">${p.title}</div>
                      <div class="text-[11px] text-zinc-400 mt-0.5">
                        Prazo: <span class="font-medium text-zinc-600 dark:text-zinc-300">${formatDate(p.deadlineDate)}</span> • Valor: <span class="font-semibold text-blue-600">${formatCurrency(p.value)}</span>
                      </div>
                    </div>
                    <div>${getStatusBadge(p.stage)}</div>
                  </div>
                  <!-- Progress Bar -->
                  <div class="space-y-1">
                    <div class="flex items-center justify-between text-[10px] text-zinc-400">
                      <span>Progresso (${completedTasks}/${tasks.length} etapas)</span>
                      <span>${progressPct}%</span>
                    </div>
                    <div class="w-full bg-zinc-200 dark:bg-zinc-700 h-1.5 rounded-full overflow-hidden">
                      <div class="bg-blue-600 h-1.5 rounded-full transition-all" style="width: ${progressPct}%"></div>
                    </div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        `}
      </div>
    `;

    const addProjBtn = tabContainer.querySelector('#tab-add-project-btn');
    if (addProjBtn) addProjBtn.onclick = () => openCreateProjectForClientModal(client, () => { drawer.close(); openClientProfileModal(client.id, onNavigate, onRefreshList); });
    const emptyAddProj = tabContainer.querySelector('#empty-add-proj');
    if (emptyAddProj) emptyAddProj.onclick = () => openCreateProjectForClientModal(client, () => { drawer.close(); openClientProfileModal(client.id, onNavigate, onRefreshList); });
  }

  function renderDeliveriesTab() {
    tabContainer.innerHTML = `
      <div class="space-y-3">
        <div class="flex items-center justify-between">
          <span class="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Entregas & Demandas (${clientDeliveries.length})</span>
          <button id="tab-add-delivery-btn" class="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition-colors">
            + Nova Entrega
          </button>
        </div>

        ${clientDeliveries.length === 0 ? `
          <div class="p-6 text-center bg-zinc-50 dark:bg-zinc-850 rounded-2xl border border-zinc-200 dark:border-zinc-800">
            <p class="text-zinc-400 text-xs">Nenhum entregável cadastrado para este cliente.</p>
            <button id="empty-add-deliv" class="mt-2.5 px-3 py-1.5 bg-indigo-600 text-white rounded-xl text-xs font-semibold">Cadastrar Primeira Entrega</button>
          </div>
        ` : `
          <div class="space-y-2">
            ${clientDeliveries.map(d => {
              const checklist = d.checklist || [];
              const completedChecks = checklist.filter(c => c.completed).length;
              const chkPercent = checklist.length > 0 ? Math.round((completedChecks / checklist.length) * 100) : 0;
              return `
                <div class="p-3 bg-zinc-50 dark:bg-zinc-800/40 rounded-xl border border-zinc-100 dark:border-zinc-800 flex items-center justify-between gap-3">
                  <div>
                    <div class="font-semibold text-zinc-900 dark:text-zinc-100 text-xs">${d.title}</div>
                    <div class="text-[11px] text-zinc-400 mt-0.5">
                      ${d.projectName ? `Projeto: <span class="font-medium text-zinc-600 dark:text-zinc-300">${d.projectName}</span> • ` : ''}
                      Prazo: ${d.dueDate ? d.dueDate.split('-').reverse().join('/') : 'Sem prazo'} • Checklist: ${completedChecks}/${checklist.length} (${chkPercent}%)
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

    const addDelivBtn = tabContainer.querySelector('#tab-add-delivery-btn');
    if (addDelivBtn) addDelivBtn.onclick = () => openCreateDeliveryForClientModal(client, () => { drawer.close(); openClientProfileModal(client.id, onNavigate, onRefreshList); });
    const emptyAddDeliv = tabContainer.querySelector('#empty-add-deliv');
    if (emptyAddDeliv) emptyAddDeliv.onclick = () => openCreateDeliveryForClientModal(client, () => { drawer.close(); openClientProfileModal(client.id, onNavigate, onRefreshList); });
  }

  function renderFinanceTab() {
    const currentState = store.getState();
    const currentClient = currentState.clients.find(c => c.id === client.id) || client;
    const currentClientTxs = currentState.transactions.filter(t => t.clientId === client.id || (t.clientName && t.clientName.toLowerCase() === client.name.toLowerCase()));
    const incomeTxs = currentClientTxs.filter(t => t.type === 'income' && t.status !== 'cancelled');

    const clientTotalPaid = incomeTxs.filter(t => t.status === 'paid').reduce((sum, t) => sum + (t.amount || 0), 0);
    const clientTotalPending = incomeTxs.filter(t => t.status === 'pending' || t.status === 'overdue').reduce((sum, t) => sum + (t.amount || 0), 0);
    const clientTotalContracted = clientTotalPaid + clientTotalPending;

    // Commercial conditions detection
    const installmentTxs = currentClientTxs.filter(t => t.isInstallment && t.status !== 'cancelled');
    const hasRecurring = currentClientTxs.some(t => t.isRecurring && t.status !== 'cancelled');
    let conditionSummary = 'À vista / Pontual';
    if (installmentTxs.length > 0 && hasRecurring) conditionSummary = 'Parcelado & Recorrente';
    else if (installmentTxs.length > 0) conditionSummary = 'Parcelado';
    else if (hasRecurring || currentClient.clientType === 'mensal') conditionSummary = 'Recorrente Mensal';

    // Group installments by installmentGroupId
    const installmentGroups = {};
    installmentTxs.forEach(t => {
      const gid = t.installmentGroupId || 'group-single';
      if (!installmentGroups[gid]) installmentGroups[gid] = [];
      installmentGroups[gid].push(t);
    });

    const groupKeys = Object.keys(installmentGroups);

    tabContainer.innerHTML = `
      <div class="space-y-4">
        <!-- Header & Action -->
        <div class="flex items-center justify-between">
          <div>
            <h4 class="text-xs font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">Condições de Pagamento & Financeiro</h4>
            <p class="text-[11px] text-zinc-400">Contratos, parcelamentos e baixas vinculadas a ${client.name}</p>
          </div>
          <button id="tab-add-tx-btn" class="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 shadow-2xs">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
            <span>+ Nova Receita</span>
          </button>
        </div>

        <!-- 4 Badges de Condição Comercial & Saldo -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div class="p-3 bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/80 dark:border-zinc-800 rounded-xl">
            <span class="text-[10px] text-zinc-400 font-semibold uppercase block">Total Contratado</span>
            <div class="text-sm font-bold text-zinc-900 dark:text-zinc-100 mt-0.5">${formatCurrency(clientTotalContracted)}</div>
            <div class="text-[10px] text-zinc-400 mt-0.5">${incomeTxs.length} lançamentos</div>
          </div>
          <div class="p-3 bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 rounded-xl">
            <span class="text-[10px] text-emerald-800 dark:text-emerald-300 font-semibold uppercase block">Total Já Recebido</span>
            <div class="text-sm font-bold text-emerald-600 mt-0.5">${formatCurrency(clientTotalPaid)}</div>
            <div class="text-[10px] text-emerald-600 mt-0.5">LTV: ${formatCurrency(currentClient.totalGenerated || clientTotalPaid)}</div>
          </div>
          <div class="p-3 bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 rounded-xl">
            <span class="text-[10px] text-amber-800 dark:text-amber-300 font-semibold uppercase block">Saldo Devedor (Pendente)</span>
            <div class="text-sm font-bold text-amber-600 mt-0.5">${formatCurrency(clientTotalPending)}</div>
            <div class="text-[10px] text-amber-600 mt-0.5">A vencer / atrasado</div>
          </div>
          <div class="p-3 bg-purple-50/60 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900/40 rounded-xl">
            <span class="text-[10px] text-purple-800 dark:text-purple-300 font-semibold uppercase block">Condição Comercial</span>
            <div class="text-xs font-bold text-purple-700 dark:text-purple-300 mt-0.5 truncate">${conditionSummary}</div>
            <div class="text-[10px] text-purple-600 dark:text-purple-400 mt-0.5">${installmentTxs.length > 0 ? `${installmentTxs.length} parcelas ativas` : 'Sem parcelamento'}</div>
          </div>
        </div>

        <!-- Seção: CONDIÇÕES DE PAGAMENTO (PARCELAMENTOS) -->
        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <span class="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">Cronograma de Parcelas & Vencimentos</span>
            <span class="text-[11px] text-zinc-400">${groupKeys.length} parcelamento(s) ativo(s)</span>
          </div>

          ${groupKeys.length === 0 ? `
            <div class="p-4 bg-zinc-50 dark:bg-zinc-800/20 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800 text-center space-y-2">
              <p class="text-xs text-zinc-500">Nenhum parcelamento ativo cadastrado para este cliente.</p>
              <button id="btn-create-inst-quick" class="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors">
                + Criar Receita Parcelada
              </button>
            </div>
          ` : groupKeys.map(gid => {
            const groupList = installmentGroups[gid].sort((a, b) => (a.installmentNumber || 0) - (b.installmentNumber || 0));
            const groupTotal = groupList.reduce((acc, t) => acc + (t.amount || 0), 0);
            const groupPaid = groupList.filter(t => t.status === 'paid').reduce((acc, t) => acc + (t.amount || 0), 0);
            const groupPaidCount = groupList.filter(t => t.status === 'paid').length;
            const rawTitle = groupList[0].parentTitle || groupList[0].title || '';
            const openParen = String.fromCharCode(40);
            const pIdx = rawTitle.indexOf(openParen);
            const groupTitle = pIdx !== -1 ? rawTitle.substring(0, pIdx).trim() : rawTitle;
            const pct = groupTotal > 0 ? Math.round((groupPaid / groupTotal) * 100) : 0;

            return `
              <div class="p-3.5 bg-white dark:bg-zinc-850 rounded-xl border border-zinc-200 dark:border-zinc-700/80 shadow-2xs space-y-3">
                <div class="flex items-center justify-between">
                  <div>
                    <span class="text-xs font-bold text-zinc-900 dark:text-zinc-100 block">${groupTitle}</span>
                    <span class="text-[10px] text-zinc-400">Total do contrato: <b class="text-zinc-700 dark:text-zinc-300">${formatCurrency(groupTotal)}</b> • ${groupPaidCount}/${groupList.length} recebidas (${pct}%)</span>
                  </div>
                  <div class="text-right">
                    <span class="text-xs font-bold text-emerald-600 block">${formatCurrency(groupPaid)} recebido</span>
                    <span class="text-[10px] text-amber-600">${formatCurrency(groupTotal - groupPaid)} pendente</span>
                  </div>
                </div>

                <div class="w-full bg-zinc-100 dark:bg-zinc-700 h-1.5 rounded-full overflow-hidden">
                  <div class="bg-emerald-500 h-1.5 rounded-full transition-all" style="width: ${pct}%"></div>
                </div>

                <!-- Lista de Parcelas -->
                <div class="divide-y divide-zinc-100 dark:divide-zinc-800 border-t border-zinc-100 dark:border-zinc-800 pt-2 space-y-1">
                  ${groupList.map(t => {
                    const isDownPayment = t.installmentNumber === 0 || (t.title && t.title.toLowerCase().includes('entrada'));
                    const label = isDownPayment ? 'Entrada / Sinal' : `Parcela ${t.installmentNumber}/${t.installmentTotal || (groupList.length - (groupList.some(x => x.installmentNumber === 0) ? 1 : 0))}`;
                    return `
                      <div class="py-2 flex items-center justify-between gap-3 text-xs">
                        <div class="flex items-center gap-2.5">
                          <span class="w-6 h-6 rounded-lg ${isDownPayment ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300' : 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'} font-bold text-[10px] flex items-center justify-center shrink-0">
                            ${isDownPayment ? 'ENT' : t.installmentNumber}
                          </span>
                          <div>
                            <div class="font-medium text-zinc-900 dark:text-zinc-100">${label}</div>
                            <div class="text-[10px] text-zinc-400">Vencimento: <span class="font-semibold text-zinc-700 dark:text-zinc-300">${formatDate(t.dueDate || t.date)}</span></div>
                          </div>
                        </div>

                        <div class="flex items-center gap-3 shrink-0">
                          <div class="text-right">
                            <span class="font-bold text-zinc-900 dark:text-zinc-100 block">${formatCurrency(t.amount)}</span>
                            <div class="mt-0.5">${getInstallmentStatusBadge(t.installmentStatus || t.status, t.dueDate)}</div>
                          </div>

                          <div class="flex items-center gap-1">
                            ${t.receiptUrl ? `
                              <a href="${t.receiptUrl}" target="_blank" class="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg transition-colors" title="Visualizar Comprovante">
                                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"/></svg>
                              </a>
                            ` : ''}

                            ${t.status !== 'paid' ? `
                              <button class="client-inst-pay-btn px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-semibold transition-colors shadow-2xs" data-id="${t.id}" title="Dar baixa nesta parcela">
                                Baixar
                              </button>
                            ` : ''}

                            <button class="client-inst-edit-btn p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors" data-id="${t.id}" title="Alterar Vencimento / Adicionar Observação">
                              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    `;
                  }).join('')}
                </div>
              </div>
            `;
          }).join('')}
        </div>

        <!-- Seção: HISTÓRICO GERAL DE LANÇAMENTOS -->
        <div class="space-y-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
          <span class="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">Histórico Geral de Lançamentos (${currentClientTxs.length})</span>
          ${currentClientTxs.length === 0 ? `
            <div class="p-4 text-center text-xs text-zinc-400">Nenhum lançamento registrado.</div>
          ` : `
            <div class="space-y-1.5">
              ${currentClientTxs.map(t => `
                <div class="p-2.5 bg-zinc-50 dark:bg-zinc-800/40 rounded-xl border border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-xs">
                  <div>
                    <div class="font-medium text-zinc-900 dark:text-zinc-100">${t.title}</div>
                    <div class="text-[10px] text-zinc-400">Data: ${formatDate(t.dueDate || t.date)} • ${t.category} • ${t.paymentMethod || 'PIX'}</div>
                  </div>
                  <div class="flex items-center gap-2">
                    <div class="text-right">
                      <span class="font-bold ${t.type === 'expense' ? 'text-rose-600' : 'text-emerald-600'}">${t.type === 'expense' ? '-' : '+'}${formatCurrency(t.amount)}</span>
                      <div class="mt-0.5">${getInstallmentStatusBadge(t.installmentStatus || t.status, t.dueDate)}</div>
                    </div>
                    ${t.status !== 'paid' ? `
                      <button class="client-inst-pay-btn px-2 py-0.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-semibold" data-id="${t.id}">
                        Baixar
                      </button>
                    ` : ''}
                    <button class="client-inst-edit-btn p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200" data-id="${t.id}">
                      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
                    </button>
                  </div>
                </div>
              `).join('')}
            </div>
          `}
        </div>
      </div>
    `;

    // Click handler: Baixar parcela
    tabContainer.querySelectorAll('.client-inst-pay-btn').forEach(btn => {
      btn.onclick = () => {
        const txId = btn.getAttribute('data-id');
        store.updateInstallmentStatus(txId, 'Recebida');
        toast.success('Parcela baixada com sucesso! Saldo e LTV recalculados.');
        renderFinanceTab();
        if (onRefreshList) onRefreshList();
      };
    });

    // Click handler: Editar parcela (vencimento, notas, comprovante)
    tabContainer.querySelectorAll('.client-inst-edit-btn').forEach(btn => {
      btn.onclick = () => {
        const txId = btn.getAttribute('data-id');
        openEditTransactionModal(txId, () => {
          renderFinanceTab();
          if (onRefreshList) onRefreshList();
        });
      };
    });

    // Click handler: Nova Receita
    const addTxBtn = tabContainer.querySelector('#tab-add-tx-btn');
    if (addTxBtn) {
      addTxBtn.onclick = () => {
        openTransactionModal('income', 'business', () => {
          renderFinanceTab();
          if (onRefreshList) onRefreshList();
        }, { clientId: client.id, title: `Receita - ${client.name}` });
      };
    }

    const btnCreateInstQuick = tabContainer.querySelector('#btn-create-inst-quick');
    if (btnCreateInstQuick) {
      btnCreateInstQuick.onclick = () => {
        openTransactionModal('income', 'business', () => {
          renderFinanceTab();
          if (onRefreshList) onRefreshList();
        }, { clientId: client.id, title: `Projeto Parcelado - ${client.name}` });
      };
    }
  }

  function renderProposalsTab() {
    tabContainer.innerHTML = `
      <div class="space-y-3">
        <div class="flex items-center justify-between">
          <span class="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Propostas Comerciais (${clientProposals.length})</span>
          <button id="tab-add-prop-btn" class="px-2.5 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-semibold transition-colors">
            + Nova Proposta
          </button>
        </div>

        ${clientProposals.length === 0 ? `
          <div class="p-6 text-center bg-zinc-50 dark:bg-zinc-850 rounded-2xl border border-zinc-200 dark:border-zinc-800">
            <p class="text-zinc-400 text-xs">Nenhuma proposta vinculada a este cliente.</p>
          </div>
        ` : `
          <div class="space-y-2">
            ${clientProposals.map(p => `
              <div class="p-3 bg-zinc-50 dark:bg-zinc-800/40 rounded-xl border border-zinc-100 dark:border-zinc-800 flex items-center justify-between gap-3">
                <div>
                  <div class="font-semibold text-zinc-900 dark:text-zinc-100 text-xs">${p.number} — ${p.serviceName}</div>
                  <div class="text-[11px] text-zinc-400 mt-0.5">Criada em: ${formatDate(p.createdAt)} • Valor: ${formatCurrency(p.finalValue || p.value)}</div>
                </div>
                <div>${getStatusBadge(p.status)}</div>
              </div>
            `).join('')}
          </div>
        `}
      </div>
    `;

    const addPropBtn = tabContainer.querySelector('#tab-add-prop-btn');
    if (addPropBtn) addPropBtn.onclick = () => openCreateProposalForClientModal(client, () => { drawer.close(); openClientProfileModal(client.id, onNavigate, onRefreshList); });
  }

  function renderDocsTab() {
    tabContainer.innerHTML = `
      <div class="space-y-3">
        <div class="flex items-center justify-between">
          <span class="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Documentos do Cliente (${clientDocuments.length})</span>
          <button id="tab-add-doc-btn" class="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors">
            + Anexar Documento
          </button>
        </div>

        ${clientDocuments.length === 0 ? `
          <div class="p-6 text-center bg-zinc-50 dark:bg-zinc-850 rounded-2xl border border-zinc-200 dark:border-zinc-800">
            <p class="text-zinc-400 text-xs">Nenhum documento anexado para este cliente.</p>
          </div>
        ` : `
          <div class="space-y-2">
            ${clientDocuments.map(d => `
              <div class="p-3 bg-zinc-50 dark:bg-zinc-800/40 rounded-xl border border-zinc-100 dark:border-zinc-800 flex items-center justify-between gap-3">
                <div class="flex items-center gap-3">
                  <div class="p-2 bg-blue-50 dark:bg-blue-950/40 text-blue-600 rounded-lg">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/></svg>
                  </div>
                  <div>
                    <div class="font-semibold text-zinc-900 dark:text-zinc-100 text-xs">${d.name}</div>
                    <div class="text-[11px] text-zinc-400">${d.category || 'Geral'} • ${d.size || '1.2 MB'} • ${formatDate(d.uploadDate)}</div>
                  </div>
                </div>
                <span class="text-[11px] text-blue-600 font-semibold cursor-pointer hover:underline">Download</span>
              </div>
            `).join('')}
          </div>
        `}
      </div>
    `;

    const addDocBtn = tabContainer.querySelector('#tab-add-doc-btn');
    if (addDocBtn) addDocBtn.onclick = () => openAddDocumentForClientModal(client, () => { renderDocsTab(); });
  }

  function renderTimelineTab() {
    tabContainer.innerHTML = `
      <div class="space-y-4">
        <!-- Interactive New Activity Box -->
        <div class="p-3.5 bg-zinc-50 dark:bg-zinc-800/40 rounded-xl border border-zinc-200/80 dark:border-zinc-800 space-y-2.5">
          <span class="text-zinc-700 dark:text-zinc-200 block text-xs font-bold">Registrar Nova Interação / Nota</span>
          <div class="flex items-center gap-2">
            <select id="activity-type" class="px-2.5 py-1.5 bg-white dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs font-medium text-zinc-700 dark:text-zinc-300">
              <option value="whatsapp">WhatsApp</option>
              <option value="call">Ligação Telefônica</option>
              <option value="meeting">Reunião / Alinhamento</option>
              <option value="email">E-mail Enviado</option>
              <option value="note" selected>Nota Interna</option>
            </select>
            <input id="activity-title" placeholder="Assunto (Ex: Alinhamento de briefing, feedback da entrega...)" class="flex-1 px-3 py-1.5 bg-white dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs text-zinc-800 dark:text-zinc-200">
          </div>
          <textarea id="activity-notes" rows="2" placeholder="Detalhes do que foi discutido ou acordado..." class="w-full px-3 py-1.5 bg-white dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs text-zinc-800 dark:text-zinc-200"></textarea>
          <div class="flex justify-end">
            <button id="save-activity-btn" class="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-2xs transition-colors">
              + Registrar Interação (+15 XP)
            </button>
          </div>
        </div>

        <!-- Activity Feed -->
        <div class="space-y-2">
          <span class="text-[10px] text-zinc-400 uppercase font-bold tracking-wider">Linha do Tempo</span>
          ${clientActivities.length === 0 ? `
            <div class="p-4 bg-zinc-50 dark:bg-zinc-800/20 rounded-xl text-center text-xs text-zinc-400">
              Nenhuma interação registrada ainda. Use o campo acima para registrar ligações, reuniões ou notas.
            </div>
          ` : clientActivities.map(act => `
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
          `).join('')}

          <!-- Initial Client Registration Event -->
          <div class="p-2.5 bg-zinc-50 dark:bg-zinc-800/20 rounded-xl border border-zinc-100 dark:border-zinc-800 flex items-start gap-2.5 text-xs text-zinc-500">
            <span class="w-6 h-6 rounded-lg bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-400 flex items-center justify-center shrink-0 text-[10px] font-bold">CLI</span>
            <div>
              <span class="font-medium text-zinc-700 dark:text-zinc-300">Cliente cadastrado no sistema</span>
              <span class="text-[10px] text-zinc-400 block">${formatDate(client.entryDate)}</span>
            </div>
          </div>
        </div>
      </div>
    `;

    // Activity save handler
    const saveBtn = tabContainer.querySelector('#save-activity-btn');
    if (saveBtn) {
      saveBtn.onclick = () => {
        const type = tabContainer.querySelector('#activity-type').value;
        const title = tabContainer.querySelector('#activity-title').value.trim();
        const notes = tabContainer.querySelector('#activity-notes').value.trim();

        if (!title) {
          toast.error('Informe um assunto para a interação.');
          return;
        }

        store.addClientActivity(client.id, {
          type,
          title,
          notes
        });

        toast.success('Interação registrada com sucesso! (+15 XP)');
        renderTimelineTab();
      };
    }
  }

  // Initial tab render
  renderOverviewTab();

  // Tab switch handlers
  drawer.panel.querySelector('#tab-overview').onclick = (e) => {
    setTab(e.target);
    renderOverviewTab();
  };
  drawer.panel.querySelector('#tab-projects').onclick = (e) => {
    setTab(e.target);
    renderProjectsTab();
  };
  drawer.panel.querySelector('#tab-deliveries').onclick = (e) => {
    setTab(e.target);
    renderDeliveriesTab();
  };
  drawer.panel.querySelector('#tab-finance').onclick = (e) => {
    setTab(e.target);
    renderFinanceTab();
  };
  drawer.panel.querySelector('#tab-proposals').onclick = (e) => {
    setTab(e.target);
    renderProposalsTab();
  };
  drawer.panel.querySelector('#tab-docs').onclick = (e) => {
    setTab(e.target);
    renderDocsTab();
  };
  drawer.panel.querySelector('#tab-timeline').onclick = (e) => {
    setTab(e.target);
    renderTimelineTab();
  };

  // Status Selector
  const statusSelect = drawer.panel.querySelector('#drawer-client-type-select');
  if (statusSelect) {
    statusSelect.onchange = (e) => {
      const newType = e.target.value;
      store.updateClient(client.id, { clientType: newType });
      store.addClientActivity(client.id, {
        type: 'status',
        title: `Tipo de cliente atualizado para '${newType}'`
      });
      toast.info(`Tipo de cliente alterado para '${newType}'!`);
      if (onRefreshList) onRefreshList();
    };
  }

  // Quick Action Buttons
  drawer.panel.querySelector('#quick-add-project').onclick = () => {
    openCreateProjectForClientModal(client, () => {
      drawer.close();
      openClientProfileModal(client.id, onNavigate, onRefreshList);
    });
  };

  drawer.panel.querySelector('#quick-add-delivery').onclick = () => {
    openCreateDeliveryForClientModal(client, () => {
      drawer.close();
      openClientProfileModal(client.id, onNavigate, onRefreshList);
    });
  };

  drawer.panel.querySelector('#quick-add-proposal').onclick = () => {
    openCreateProposalForClientModal(client, () => {
      drawer.close();
      openClientProfileModal(client.id, onNavigate, onRefreshList);
    });
  };

  drawer.panel.querySelector('#quick-add-transaction').onclick = () => {
    openCreateTransactionForClientModal(client, () => {
      drawer.close();
      openClientProfileModal(client.id, onNavigate, onRefreshList);
    });
  };

  drawer.panel.querySelector('#drawer-edit-client-btn').onclick = () => {
    openEditClientModal(client, () => {
      drawer.close();
      openClientProfileModal(client.id, onNavigate, onRefreshList);
    });
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

function openEditClientModal(client, onSuccess) {
  const content = `
    <form id="clients-edit-form" class="space-y-3">
      <div>
        <label class="block text-xs font-medium text-zinc-600 dark:text-zinc-300 mb-1">Nome do Cliente *</label>
        <input required name="name" value="${client.name || ''}" class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs">
      </div>
      <div class="grid grid-cols-2 gap-2">
        <div>
          <label class="block text-xs font-medium text-zinc-600 dark:text-zinc-300 mb-1">Empresa</label>
          <input name="company" value="${client.company || ''}" class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs">
        </div>
        <div>
          <label class="block text-xs font-medium text-zinc-600 dark:text-zinc-300 mb-1">CPF/CNPJ</label>
          <input name="document" value="${client.document || ''}" class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs">
        </div>
      </div>
      <div class="grid grid-cols-2 gap-2">
        <div>
          <label class="block text-xs font-medium text-zinc-600 dark:text-zinc-300 mb-1">Telefone / WhatsApp</label>
          <input name="phone" value="${client.phone || ''}" class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs">
        </div>
        <div>
          <label class="block text-xs font-medium text-zinc-600 dark:text-zinc-300 mb-1">E-mail</label>
          <input type="email" name="email" value="${client.email || ''}" class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs">
        </div>
      </div>
      <div>
        <label class="block text-xs font-medium text-zinc-600 dark:text-zinc-300 mb-1">Endereço</label>
        <input name="address" value="${client.address || ''}" class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs">
      </div>
      <div>
        <label class="block text-xs font-medium text-zinc-600 dark:text-zinc-300 mb-1">Notas & Preferências</label>
        <textarea name="notes" rows="3" class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs">${client.notes || ''}</textarea>
      </div>
      <div class="pt-2 flex justify-between items-center">
        <button type="button" id="clients-delete-btn" class="text-rose-600 hover:text-rose-700 text-xs font-semibold">Excluir Cliente</button>
        <button type="submit" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors">Salvar Alterações</button>
      </div>
    </form>
  `;

  const m = modal.open({
    title: `Editar — ${client.name}`,
    content,
    size: 'md'
  });

  m.panel.querySelector('#clients-edit-form').onsubmit = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    store.updateClient(client.id, {
      name: fd.get('name'),
      company: fd.get('company'),
      document: fd.get('document'),
      phone: fd.get('phone'),
      whatsapp: fd.get('phone'),
      email: fd.get('email'),
      address: fd.get('address'),
      notes: fd.get('notes')
    });
    toast.success('Cliente atualizado com sucesso!');
    m.close();
    if (onSuccess) onSuccess();
  };

  m.panel.querySelector('#clients-delete-btn').onclick = () => {
    if (confirm(`Tem certeza que deseja remover o cliente ${client.name}?`)) {
      store.deleteClient(client.id);
      toast.info('Cliente removido.');
      m.close();
      if (onSuccess) onSuccess();
    }
  };
}

function openCreateProjectForClientModal(client, onSuccess) {
  const content = `
    <form id="client-create-project-form" class="space-y-3">
      <div>
        <label class="block text-xs font-medium text-zinc-600 dark:text-zinc-300 mb-1">Nome do Projeto *</label>
        <input required name="title" placeholder="Ex: Identidade Visual & Manual da Marca" class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs">
      </div>
      <div class="grid grid-cols-2 gap-2">
        <div>
          <label class="block text-xs font-medium text-zinc-600 dark:text-zinc-300 mb-1">Valor do Projeto (R$)</label>
          <input required type="number" step="0.01" name="value" placeholder="4500" class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs">
        </div>
        <div>
          <label class="block text-xs font-medium text-zinc-600 dark:text-zinc-300 mb-1">Prazo de Entrega</label>
          <input required type="date" name="deadlineDate" value="${new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0]}" class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs">
        </div>
      </div>
      <div class="pt-2 flex justify-end gap-2">
        <button type="submit" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors">Criar Projeto</button>
      </div>
    </form>
  `;

  const m = modal.open({
    title: `Novo Projeto para ${client.name}`,
    content,
    size: 'md'
  });

  m.panel.querySelector('#client-create-project-form').onsubmit = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const newProj = store.addProject({
      title: fd.get('title'),
      clientId: client.id,
      clientName: client.name,
      value: parseFloat(fd.get('value')) || 0,
      deadlineDate: fd.get('deadlineDate'),
      stage: 'briefing',
      priority: 'alta'
    });
    store.addClientActivity(client.id, {
      type: 'project',
      title: `Novo projeto iniciado: '${newProj.title}' (${formatCurrency(newProj.value)})`
    });
    toast.success('Projeto criado com sucesso!');
    m.close();
    if (onSuccess) onSuccess();
  };
}

function openCreateDeliveryForClientModal(client, onSuccess) {
  const content = `
    <form id="client-create-delivery-form" class="space-y-3">
      <div>
        <label class="block text-xs font-medium text-zinc-600 dark:text-zinc-300 mb-1">Título do Entregável *</label>
        <input required name="title" placeholder="Ex: Entrega do Guia de Cores & Tipografia" class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs">
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
          <label class="block text-xs font-medium text-zinc-600 dark:text-zinc-300 mb-1">Prazo</label>
          <input required type="date" name="dueDate" value="${new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]}" class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs">
        </div>
      </div>
      <div class="pt-2 flex justify-end gap-2">
        <button type="submit" class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition-colors">Criar Entrega</button>
      </div>
    </form>
  `;

  const m = modal.open({
    title: `Nova Entrega para ${client.name}`,
    content,
    size: 'md'
  });

  m.panel.querySelector('#client-create-delivery-form').onsubmit = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const deliv = store.addDelivery({
      title: fd.get('title'),
      clientId: client.id,
      clientName: client.name,
      priority: fd.get('priority'),
      dueDate: fd.get('dueDate'),
      status: 'backlog',
      checklist: [{ id: 'chk-1', title: 'Produção inicial', completed: false }]
    });
    store.addClientActivity(client.id, {
      type: 'delivery',
      title: `Nova entrega criada: '${deliv.title}'`
    });
    toast.success('Entrega cadastrada com sucesso!');
    m.close();
    if (onSuccess) onSuccess();
  };
}

function openCreateProposalForClientModal(client, onSuccess) {
  const content = `
    <form id="client-create-prop-form" class="space-y-3">
      <div>
        <label class="block text-xs font-medium text-zinc-600 dark:text-zinc-300 mb-1">Serviço / Escopo da Proposta *</label>
        <input required name="serviceName" placeholder="Ex: Identidade Visual & Gestão de Marca" class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs">
      </div>
      <div class="grid grid-cols-2 gap-2">
        <div>
          <label class="block text-xs font-medium text-zinc-600 dark:text-zinc-300 mb-1">Valor da Proposta (R$)</label>
          <input required type="number" step="0.01" name="value" placeholder="3800" class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs">
        </div>
        <div>
          <label class="block text-xs font-medium text-zinc-600 dark:text-zinc-300 mb-1">Desconto Comercial (R$)</label>
          <input type="number" step="0.01" name="discount" value="0" class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs">
        </div>
      </div>
      <div class="pt-2 flex justify-end gap-2">
        <button type="submit" class="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-semibold transition-colors">Gerar Proposta</button>
      </div>
    </form>
  `;

  const m = modal.open({
    title: `Nova Proposta para ${client.name}`,
    content,
    size: 'md'
  });

  m.panel.querySelector('#client-create-prop-form').onsubmit = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const prop = store.addProposal({
      clientId: client.id,
      clientName: client.name,
      serviceName: fd.get('serviceName'),
      value: parseFloat(fd.get('value')) || 0,
      discount: parseFloat(fd.get('discount')) || 0,
      status: 'enviada'
    });
    store.addClientActivity(client.id, {
      type: 'proposal',
      title: `Proposta ${prop.number} gerada no valor de ${formatCurrency(prop.finalValue || prop.value)}`
    });
    toast.success(`Proposta ${prop.number} criada!`);
    m.close();
    if (onSuccess) onSuccess();
  };
}

function openCreateTransactionForClientModal(client, onSuccess) {
  openTransactionModal('income', 'business', () => {
    if (onSuccess) onSuccess();
  }, { clientId: client.id, title: `Receita - ${client.name}` });
}

function openAddDocumentForClientModal(client, onSuccess) {
  const content = `
    <form id="client-create-doc-form" class="space-y-3">
      <div>
        <label class="block text-xs font-medium text-zinc-600 dark:text-zinc-300 mb-1">Nome do Documento *</label>
        <input required name="name" placeholder="Ex: Contrato de Prestação de Serviços Assinado.pdf" class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs">
      </div>
      <div class="grid grid-cols-2 gap-2">
        <div>
          <label class="block text-xs font-medium text-zinc-600 dark:text-zinc-300 mb-1">Pasta / Categoria</label>
          <select name="category" class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs">
            <option value="Contratos">Contratos</option>
            <option value="Briefings">Briefings</option>
            <option value="Propostas">Propostas</option>
            <option value="Finais" selected>Arquivos Finais & Entregáveis</option>
          </select>
        </div>
        <div>
          <label class="block text-xs font-medium text-zinc-600 dark:text-zinc-300 mb-1">Tamanho Aproximado</label>
          <input name="size" value="1.8 MB" class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs">
        </div>
      </div>
      <div class="pt-2 flex justify-end gap-2">
        <button type="submit" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors">Salvar Documento</button>
      </div>
    </form>
  `;

  const m = modal.open({
    title: `Anexar Documento para ${client.name}`,
    content,
    size: 'md'
  });

  m.panel.querySelector('#client-create-doc-form').onsubmit = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    store.addDocument({
      name: fd.get('name'),
      category: fd.get('category'),
      size: fd.get('size'),
      clientId: client.id,
      clientName: client.name
    });
    store.addClientActivity(client.id, {
      type: 'document',
      title: `Documento anexado: '${fd.get('name')}'`
    });
    toast.success('Documento salvo com sucesso!');
    m.close();
    if (onSuccess) onSuccess();
  };
}

