import { store } from '../state/store.js';
import { modal } from '../components/Modal.js';
import { toast } from '../components/Toast.js';
import { formatCurrency, formatDate, getStatusBadge } from '../utils/formatters.js';
import { exportToPDF, exportToCSV } from '../utils/exportUtils.js';

let filterStatus = 'all';

export function renderProposalsView(container, onNavigate) {
  const { proposals, services, clients } = store.getState();

  const totalSent = proposals.reduce((acc, p) => acc + (p.finalValue || p.value || 0), 0);
  const totalApproved = proposals.filter(p => p.status === 'aprovada').reduce((acc, p) => acc + (p.finalValue || p.value || 0), 0);
  const totalNegotiating = proposals.filter(p => p.status === 'negociacao' || p.status === 'enviada').reduce((acc, p) => acc + (p.finalValue || p.value || 0), 0);
  const totalRejected = proposals.filter(p => p.status === 'recusada').reduce((acc, p) => acc + (p.finalValue || p.value || 0), 0);
  const approvedCount = proposals.filter(p => p.status === 'aprovada').length;
  const conversionRate = proposals.length > 0 ? Math.round((approvedCount / proposals.length) * 100) : 0;
  const avgTicket = proposals.length > 0 ? Math.round(totalSent / proposals.length) : 0;

  const filtered = filterStatus === 'all'
    ? proposals
    : proposals.filter(p => p.status === filterStatus);

  container.innerHTML = `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 class="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">Propostas & Orçamentos</h2>
          <p class="text-xs text-zinc-500">Elaboração, envio e conversão de propostas comerciais em projetos ativos.</p>
        </div>
        <div class="flex items-center gap-2">
          <button id="prop-export-btn" class="px-3 py-1.5 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-xl text-xs font-medium text-zinc-700 dark:text-zinc-300 transition-colors">
            Exportar Lista
          </button>
          <button id="prop-new-btn" class="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition-colors shadow-xs">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
            <span>Nova Proposta</span>
          </button>
        </div>
      </div>

      <!-- KPI Cards -->
      <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div class="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-2xs">
          <div class="text-[11px] font-medium text-zinc-500">Total Enviado</div>
          <div class="text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-100 mt-1">${formatCurrency(totalSent)}</div>
          <div class="text-[10px] text-zinc-400 mt-0.5">${proposals.length} propostas</div>
        </div>

        <div class="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-2xs">
          <div class="text-[11px] font-medium text-zinc-500">Em Negociação</div>
          <div class="text-sm sm:text-base font-bold text-orange-600 mt-1">${formatCurrency(totalNegotiating)}</div>
          <div class="text-[10px] text-zinc-400 mt-0.5">Pipeline aquecido</div>
        </div>

        <div class="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-2xs">
          <div class="text-[11px] font-medium text-zinc-500">Valor Aprovado</div>
          <div class="text-sm sm:text-base font-bold text-emerald-600 mt-1">${formatCurrency(totalApproved)}</div>
          <div class="text-[10px] text-emerald-600 mt-0.5">${approvedCount} contratos fechados</div>
        </div>

        <div class="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-2xs">
          <div class="text-[11px] font-medium text-zinc-500">Recusadas</div>
          <div class="text-sm sm:text-base font-bold text-rose-600 mt-1">${formatCurrency(totalRejected)}</div>
          <div class="text-[10px] text-zinc-400 mt-0.5">Perdas comerciais</div>
        </div>

        <div class="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-2xs">
          <div class="text-[11px] font-medium text-zinc-500">Taxa de Conversão</div>
          <div class="text-sm sm:text-base font-bold text-blue-600 mt-1">${conversionRate}%</div>
          <div class="text-[10px] text-zinc-400 mt-0.5">Média do período</div>
        </div>

        <div class="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-2xs">
          <div class="text-[11px] font-medium text-zinc-500">Ticket Médio</div>
          <div class="text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-100 mt-1">${formatCurrency(avgTicket)}</div>
          <div class="text-[10px] text-zinc-400 mt-0.5">Por proposta</div>
        </div>
      </div>

      <!-- Filter Tabs & Proposals List -->
      <div class="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-2xs">
        <div class="flex items-center gap-2 p-3 border-b border-zinc-100 dark:border-zinc-800 overflow-x-auto text-xs">
          <button data-filter="all" class="px-3 py-1 rounded-lg font-medium transition-colors ${filterStatus === 'all' ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900' : 'text-zinc-500 hover:text-zinc-800'}">Todas</button>
          <button data-filter="rascunho" class="px-3 py-1 rounded-lg font-medium transition-colors ${filterStatus === 'rascunho' ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900' : 'text-zinc-500 hover:text-zinc-800'}">Rascunhos</button>
          <button data-filter="enviada" class="px-3 py-1 rounded-lg font-medium transition-colors ${filterStatus === 'enviada' ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900' : 'text-zinc-500 hover:text-zinc-800'}">Enviadas</button>
          <button data-filter="negociacao" class="px-3 py-1 rounded-lg font-medium transition-colors ${filterStatus === 'negociacao' ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900' : 'text-zinc-500 hover:text-zinc-800'}">Em Negociação</button>
          <button data-filter="aprovada" class="px-3 py-1 rounded-lg font-medium transition-colors ${filterStatus === 'aprovada' ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900' : 'text-zinc-500 hover:text-zinc-800'}">Aprovadas</button>
          <button data-filter="recusada" class="px-3 py-1 rounded-lg font-medium transition-colors ${filterStatus === 'recusada' ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900' : 'text-zinc-500 hover:text-zinc-800'}">Recusadas</button>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs text-zinc-600 dark:text-zinc-400">
            <thead class="bg-zinc-50 dark:bg-zinc-850 text-zinc-900 dark:text-zinc-200 border-b border-zinc-200 dark:border-zinc-800 font-semibold">
              <tr>
                <th class="p-3.5">Número</th>
                <th class="p-3.5">Cliente</th>
                <th class="p-3.5">Serviço</th>
                <th class="p-3.5">Valor Proposto</th>
                <th class="p-3.5">Prazo / Validade</th>
                <th class="p-3.5">Status</th>
                <th class="p-3.5 text-right">Ações</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-zinc-100 dark:divide-zinc-800">
              ${filtered.map(p => `
                <tr class="hover:bg-zinc-50/70 dark:hover:bg-zinc-850/50 cursor-pointer transition-colors" data-prop-id="${p.id}">
                  <td class="p-3.5 font-bold text-blue-600 dark:text-blue-400">${p.number}</td>
                  <td class="p-3.5 font-medium text-zinc-900 dark:text-zinc-100">${p.clientName}</td>
                  <td class="p-3.5 max-w-[200px] truncate">${p.serviceName}</td>
                  <td class="p-3.5 font-bold text-zinc-900 dark:text-zinc-100">
                    ${formatCurrency(p.finalValue || p.value)}
                    ${p.discount > 0 ? `<span class="block text-[10px] text-zinc-400 font-normal">Desc: ${formatCurrency(p.discount)}</span>` : ''}
                  </td>
                  <td class="p-3.5">
                    <div>${p.deadline}</div>
                    <div class="text-[10px] text-zinc-400">Validade: ${formatDate(p.validity)}</div>
                  </td>
                  <td class="p-3.5">${getStatusBadge(p.status)}</td>
                  <td class="p-3.5 text-right space-x-1">
                    <button class="text-blue-600 hover:text-blue-700 font-medium px-2 py-1 rounded hover:bg-blue-50 dark:hover:bg-blue-950/40">Visualizar</button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;

  // Filter tabs
  container.querySelectorAll('button[data-filter]').forEach(btn => {
    btn.onclick = () => {
      filterStatus = btn.getAttribute('data-filter');
      renderProposalsView(container, onNavigate);
    };
  });

  // Row click opens proposal details
  container.querySelectorAll('tr[data-prop-id]').forEach(row => {
    row.onclick = () => {
      const id = row.getAttribute('data-prop-id');
      openProposalDetailsModal(id, onNavigate, () => renderProposalsView(container, onNavigate));
    };
  });

  // Export
  container.querySelector('#prop-export-btn').onclick = () => {
    const headers = ['Número', 'Cliente', 'Serviço', 'Valor', 'Desconto', 'Valor Final', 'Status', 'Validade', 'Data'];
    const rows = proposals.map(p => [p.number, p.clientName, p.serviceName, p.value, p.discount, p.finalValue, p.status, p.validity, p.createdAt]);
    exportToCSV('propostas_comerciais', rows, headers);
    toast.success('Lista de propostas exportada!');
  };

  // New Proposal
  container.querySelector('#prop-new-btn').onclick = () => {
    openCreateProposalModal(() => renderProposalsView(container, onNavigate));
  };
}

export function openProposalDetailsModal(propId, onNavigate, onRefresh) {
  const prop = store.getState().proposals.find(p => p.id === propId);
  if (!prop) return;

  const content = `
    <div class="space-y-4">
      <!-- Proposal Document Preview Card -->
      <div id="proposal-printable" class="p-6 bg-white dark:bg-zinc-850 rounded-2xl border border-zinc-200 dark:border-zinc-700 shadow-sm space-y-5 text-xs text-zinc-800 dark:text-zinc-200">
        <!-- Document Header -->
        <div class="flex items-start justify-between border-b border-zinc-100 dark:border-zinc-700 pb-4">
          <div>
            <div class="text-blue-600 font-extrabold text-sm tracking-tight">APP TESTE</div>
            <div class="text-[11px] text-zinc-400">Proposta Comercial Prestação de Serviços</div>
          </div>
          <div class="text-right">
            <div class="text-sm font-bold text-zinc-900 dark:text-zinc-100">${prop.number}</div>
            <div class="text-[11px] text-zinc-400">Emissão: ${formatDate(prop.createdAt)} • Validade: ${formatDate(prop.validity)}</div>
          </div>
        </div>

        <!-- Client & Service -->
        <div class="grid grid-cols-2 gap-4 p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl">
          <div>
            <span class="text-zinc-400 block text-[10px] uppercase font-semibold">Cliente Destinatário</span>
            <span class="font-bold text-zinc-900 dark:text-zinc-100">${prop.clientName}</span>
          </div>
          <div>
            <span class="text-zinc-400 block text-[10px] uppercase font-semibold">Serviço Proposto</span>
            <span class="font-bold text-zinc-900 dark:text-zinc-100">${prop.serviceName}</span>
          </div>
        </div>

        <!-- Description & Deliverables -->
        <div>
          <span class="text-zinc-400 block text-[10px] uppercase font-semibold mb-1">Escopo e Descrição</span>
          <p class="leading-relaxed text-zinc-700 dark:text-zinc-300">${prop.description || 'Execução completa dos serviços conforme alinhamento prévio.'}</p>
        </div>

        ${prop.deliverables && prop.deliverables.length > 0 ? `
          <div>
            <span class="text-zinc-400 block text-[10px] uppercase font-semibold mb-1.5">Entregáveis Contratados:</span>
            <ul class="space-y-1">
              ${prop.deliverables.map(d => `
                <li class="flex items-center gap-2">
                  <span class="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0"></span>
                  <span>${typeof d === 'string' ? d : d.title}</span>
                </li>
              `).join('')}
            </ul>
          </div>
        ` : ''}

        <!-- Values Table -->
        <div class="border-t border-zinc-100 dark:border-zinc-700 pt-3 space-y-1 text-right">
          <div class="flex justify-between text-zinc-500">
            <span>Valor Nominal do Investimento:</span>
            <span>${formatCurrency(prop.value)}</span>
          </div>
          ${prop.discount > 0 ? `
            <div class="flex justify-between text-emerald-600">
              <span>Desconto Aplicado:</span>
              <span>- ${formatCurrency(prop.discount)}</span>
            </div>
          ` : ''}
          <div class="flex justify-between text-sm font-bold text-zinc-900 dark:text-zinc-100 pt-1 border-t border-zinc-100 dark:border-zinc-700">
            <span>Valor Total Proposto:</span>
            <span class="text-blue-600 dark:text-blue-400">${formatCurrency(prop.finalValue || prop.value)}</span>
          </div>
        </div>

        <!-- Payment Terms & Timeline -->
        <div class="p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl space-y-1 text-[11px]">
          <div><b>Prazo Estimado:</b> ${prop.deadline}</div>
          <div><b>Condições de Pagamento:</b> ${prop.paymentTerms || 'A combinar'}</div>
          <div><b>Observações:</b> ${prop.notes || 'Início após aprovação formal.'}</div>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
        <!-- Status Changer -->
        <div class="flex items-center gap-2">
          <span class="text-xs text-zinc-400">Alterar Status:</span>
          <select id="prop-status-select" class="px-2.5 py-1.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs font-semibold">
            <option value="rascunho" ${prop.status === 'rascunho' ? 'selected' : ''}>Rascunho</option>
            <option value="enviada" ${prop.status === 'enviada' ? 'selected' : ''}>Enviada</option>
            <option value="negociacao" ${prop.status === 'negociacao' ? 'selected' : ''}>Em Negociação</option>
            <option value="aprovada" ${prop.status === 'aprovada' ? 'selected' : ''}>Aprovada</option>
            <option value="recusada" ${prop.status === 'recusada' ? 'selected' : ''}>Recusada</option>
          </select>
        </div>

        <div class="flex items-center gap-2">
          <button id="prop-pdf-btn" class="px-3 py-1.5 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl text-xs font-medium transition-colors flex items-center gap-1.5">
            <svg class="w-4 h-4 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/></svg>
            <span>Gerar PDF / Imprimir</span>
          </button>

          <button id="prop-convert-proj-btn" class="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold transition-colors shadow-xs flex items-center gap-1.5">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
            <span>Aprovar & Criar Projeto</span>
          </button>
        </div>
      </div>
    </div>
  `;

  const m = modal.open({
    title: `Proposta ${prop.number}`,
    content,
    size: 'lg'
  });

  // Change Status
  m.panel.querySelector('#prop-status-select').onchange = (e) => {
    store.updateProposal(prop.id, { status: e.target.value });
    toast.success(`Status alterado para ${e.target.value.toUpperCase()}`);
    if (onRefresh) onRefresh();
  };

  // Convert to Project
  m.panel.querySelector('#prop-convert-proj-btn').onclick = () => {
    const proj = store.approveProposalAndCreateProject(prop.id);
    toast.success(`Proposta aprovada e Projeto '${proj.title}' criado!`);
    m.close();
    if (onNavigate) onNavigate('projects');
  };

  // PDF Export
  m.panel.querySelector('#prop-pdf-btn').onclick = () => {
    const headers = ['Campo', 'Especificação'];
    const rows = [
      ['Número da Proposta', prop.number],
      ['Cliente Destinatário', prop.clientName],
      ['Serviço Contratado', prop.serviceName],
      ['Valor Total', formatCurrency(prop.finalValue || prop.value)],
      ['Prazo de Entrega', prop.deadline],
      ['Validade da Proposta', formatDate(prop.validity)],
      ['Condições de Pagamento', prop.paymentTerms || '-'],
      ['Status', prop.status.toUpperCase()]
    ];
    exportToPDF(prop.number, `Proposta Comercial - ${prop.clientName}`, headers, rows);
    toast.success(`Proposta ${prop.number} exportada em PDF!`);
  };
}

function openCreateProposalModal(onSuccess) {
  const { clients, services } = store.getState();
  const content = `
    <form id="prop-manual-create-form" class="space-y-3">
      <div class="grid grid-cols-2 gap-2">
        <div>
          <label class="block text-xs font-medium text-zinc-600 dark:text-zinc-300 mb-1">Cliente *</label>
          <select required name="clientId" class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs">
            <option value="">Selecione um cliente...</option>
            ${clients.map(c => `<option value="${c.id}">${c.name} (${c.company})</option>`).join('')}
          </select>
        </div>
        <div>
          <label class="block text-xs font-medium text-zinc-600 dark:text-zinc-300 mb-1">Serviço *</label>
          <select required name="serviceId" class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs">
            <option value="">Selecione o serviço base...</option>
            ${services.map(s => `<option value="${s.id}">${s.name} - ${formatCurrency(s.price)}</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="grid grid-cols-2 gap-2">
        <div>
          <label class="block text-xs font-medium text-zinc-600 dark:text-zinc-300 mb-1">Valor do Investimento (R$) *</label>
          <input required type="number" name="value" class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs" placeholder="4500">
        </div>
        <div>
          <label class="block text-xs font-medium text-zinc-600 dark:text-zinc-300 mb-1">Desconto Especial (R$)</label>
          <input type="number" name="discount" value="0" class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs">
        </div>
      </div>
      <div class="grid grid-cols-2 gap-2">
        <div>
          <label class="block text-xs font-medium text-zinc-600 dark:text-zinc-300 mb-1">Prazo de Entrega</label>
          <input name="deadline" class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs" placeholder="Ex: 20 dias">
        </div>
        <div>
          <label class="block text-xs font-medium text-zinc-600 dark:text-zinc-300 mb-1">Validade</label>
          <input type="date" name="validity" value="${new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0]}" class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs">
        </div>
      </div>
      <div>
        <label class="block text-xs font-medium text-zinc-600 dark:text-zinc-300 mb-1">Condições de Pagamento</label>
        <input name="paymentTerms" class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs" placeholder="Ex: 50% entrada + 50% entrega">
      </div>
      <div>
        <label class="block text-xs font-medium text-zinc-600 dark:text-zinc-300 mb-1">Observações do Escopo</label>
        <textarea name="description" rows="2" class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs" placeholder="Detalhes dos entregáveis e cronograma..."></textarea>
      </div>
      <div class="pt-2 flex justify-end gap-2">
        <button type="submit" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors">Criar Proposta</button>
      </div>
    </form>
  `;

  const m = modal.open({
    title: 'Nova Proposta Comercial',
    content,
    size: 'md'
  });

  m.panel.querySelector('#prop-manual-create-form').onsubmit = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const clientId = fd.get('clientId');
    const serviceId = fd.get('serviceId');
    const client = clients.find(c => c.id === clientId);
    const service = services.find(s => s.id === serviceId);

    const prop = store.addProposal({
      clientId: clientId || null,
      clientName: client ? `${client.name} (${client.company})` : 'Cliente Direto',
      serviceId: serviceId || null,
      serviceName: service ? service.name : 'Serviço Sob Medida',
      value: parseFloat(fd.get('value')) || 0,
      discount: parseFloat(fd.get('discount')) || 0,
      deadline: fd.get('deadline'),
      validity: fd.get('validity'),
      paymentTerms: fd.get('paymentTerms'),
      description: fd.get('description'),
      deliverables: service ? service.deliverables : [],
      status: 'enviada'
    });

    toast.success(`Proposta ${prop.number} gerada com sucesso!`);
    m.close();
    if (onSuccess) onSuccess();
  };
}
