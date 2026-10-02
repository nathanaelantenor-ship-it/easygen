import { store } from '../state/store.js';
import { modal } from '../components/Modal.js';
import { toast } from '../components/Toast.js';
import { formatCurrency } from '../utils/formatters.js';

let serviceCategoryFilter = 'all';

export function renderServicesView(container, onNavigate) {
  const { services, clients, proposals, projects } = store.getState();

  const categories = ['all', ...new Set(services.map(s => s.category).filter(Boolean))];

  const filteredServices = serviceCategoryFilter === 'all'
    ? services
    : services.filter(s => s.category === serviceCategoryFilter);

  // Global service statistics
  const totalApprovedFromServices = proposals
    .filter(p => p.status === 'aprovada')
    .reduce((acc, p) => acc + (p.finalValue || p.value || 0), 0);

  const approvedProposalsCount = proposals.filter(p => p.status === 'aprovada').length;

  container.innerHTML = `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 class="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">Catálogo de Serviços</h2>
          <p class="text-xs text-zinc-500">Serviços padronizados com precificação, entregáveis e geração direta de propostas.</p>
        </div>
        <div>
          <button id="services-new-btn" class="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition-colors shadow-xs">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
            <span>Novo Serviço</span>
          </button>
        </div>
      </div>

      <!-- Top Metrics -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div class="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-2xs">
          <div class="text-[11px] font-medium text-zinc-500">Serviços no Catálogo</div>
          <div class="text-lg font-bold text-zinc-900 dark:text-zinc-100 mt-1">${services.length} ativos</div>
          <div class="text-[10px] text-zinc-400 mt-0.5">${categories.length - 1} categorias</div>
        </div>

        <div class="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-2xs">
          <div class="text-[11px] font-medium text-zinc-500">Propostas Criadas</div>
          <div class="text-lg font-bold text-blue-600 dark:text-blue-400 mt-1">${proposals.length} enviadas</div>
          <div class="text-[10px] text-zinc-400 mt-0.5">Com base no catálogo</div>
        </div>

        <div class="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-2xs">
          <div class="text-[11px] font-medium text-zinc-500">Contratos Fechados</div>
          <div class="text-lg font-bold text-emerald-600 mt-1">${approvedProposalsCount} aprovados</div>
          <div class="text-[10px] text-emerald-600 mt-0.5">Taxa de conversão: ${proposals.length > 0 ? Math.round((approvedProposalsCount / proposals.length) * 100) : 0}%</div>
        </div>

        <div class="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-2xs">
          <div class="text-[11px] font-medium text-zinc-500">Receita por Serviços</div>
          <div class="text-lg font-bold text-zinc-900 dark:text-zinc-100 mt-1">${formatCurrency(totalApprovedFromServices)}</div>
          <div class="text-[10px] text-zinc-400 mt-0.5">Faturamento gerado</div>
        </div>
      </div>

      <!-- Categories Filter Tabs -->
      <div class="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        ${categories.map(cat => `
          <button data-cat="${cat}" class="px-3 py-1.5 rounded-xl font-medium transition-colors ${
            serviceCategoryFilter === cat 
              ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-2xs font-semibold' 
              : 'bg-white dark:bg-zinc-850 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300'
          }">
            ${cat === 'all' ? 'Todos os Serviços' : cat}
          </button>
        `).join('')}
      </div>

      <!-- Services Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        ${filteredServices.map(srv => {
          const srvProps = proposals.filter(p => p.serviceId === srv.id || (p.serviceName && p.serviceName.toLowerCase() === srv.name.toLowerCase()));
          const approvedProps = srvProps.filter(p => p.status === 'aprovada');
          const totalRev = approvedProps.reduce((acc, p) => acc + (p.finalValue || p.value || 0), 0);

          return `
            <div class="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-2xs hover:border-blue-400 dark:hover:border-blue-600 transition-all flex flex-col justify-between">
              <div>
                <div class="flex items-start justify-between gap-2 mb-2">
                  <span class="text-[10px] font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-md border border-blue-200/50 dark:border-blue-800/40">
                    ${srv.category}
                  </span>
                  <span class="text-base font-bold text-zinc-900 dark:text-zinc-100">${formatCurrency(srv.price)}</span>
                </div>
                <h3 class="text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-1.5">${srv.name}</h3>
                <p class="text-xs text-zinc-500 leading-relaxed mb-4">${srv.description}</p>

                <!-- Deliverables Checklist -->
                <div class="space-y-2 mb-4">
                  <div class="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Entregáveis Inclusos:</div>
                  <ul class="text-xs text-zinc-600 dark:text-zinc-400 space-y-1">
                    ${(srv.deliverables || []).map(d => `
                      <li class="flex items-center gap-1.5">
                        <svg class="w-3.5 h-3.5 text-blue-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
                        <span>${d}</span>
                      </li>
                    `).join('')}
                  </ul>
                </div>

                <!-- Stats Strip -->
                <div class="p-2.5 bg-zinc-50 dark:bg-zinc-850 rounded-xl border border-zinc-100 dark:border-zinc-800 text-[11px] text-zinc-500 space-y-1 mb-4">
                  <div class="flex justify-between">
                    <span>Contratos Fechados:</span>
                    <b class="text-zinc-800 dark:text-zinc-200">${approvedProps.length} de ${srvProps.length} propostas</b>
                  </div>
                  <div class="flex justify-between">
                    <span>Faturamento Total:</span>
                    <b class="text-emerald-600">${formatCurrency(totalRev)}</b>
                  </div>
                </div>
              </div>

              <div class="pt-4 border-t border-zinc-100 dark:border-zinc-800">
                <div class="flex items-center justify-between text-[11px] text-zinc-400 mb-3">
                  <span>Prazo: <b class="text-zinc-700 dark:text-zinc-300">${srv.timeline}</b></span>
                  <span>${srv.paymentTerms || 'Consulte condições'}</span>
                </div>
                <div class="flex gap-2">
                  <button data-action="create-proposal" data-service-id="${srv.id}" class="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-xs">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                    <span>Gerar Proposta Oficial</span>
                  </button>
                  <button data-action="edit-service" data-service-id="${srv.id}" class="p-2 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded-xl" title="Editar Serviço">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
                  </button>
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;

  // Category filters
  container.querySelectorAll('button[data-cat]').forEach(btn => {
    btn.onclick = () => {
      serviceCategoryFilter = btn.getAttribute('data-cat');
      renderServicesView(container, onNavigate);
    };
  });

  // Nova Proposta handler
  container.querySelectorAll('button[data-action="create-proposal"]').forEach(btn => {
    btn.onclick = () => {
      const srvId = btn.getAttribute('data-service-id');
      const srv = services.find(s => s.id === srvId);
      if (!srv) return;
      openNewProposalFromServiceModal(srv, onNavigate);
    };
  });

  // Edit Service handler
  container.querySelectorAll('button[data-action="edit-service"]').forEach(btn => {
    btn.onclick = () => {
      const srvId = btn.getAttribute('data-service-id');
      const srv = services.find(s => s.id === srvId);
      if (!srv) return;
      openEditServiceModal(srv, () => renderServicesView(container, onNavigate));
    };
  });

  // Novo Serviço
  container.querySelector('#services-new-btn').onclick = () => {
    openNewServiceModal(() => renderServicesView(container, onNavigate));
  };
}

function openNewProposalFromServiceModal(service, onNavigate) {
  const { clients } = store.getState();
  const content = `
    <form id="srv-create-prop-form" class="space-y-3">
      <div>
        <label class="block text-xs font-medium text-zinc-600 dark:text-zinc-300 mb-1">Cliente / Destinatário *</label>
        <select required name="clientId" class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs">
          <option value="">Selecione um cliente cadastrado...</option>
          ${clients.map(c => `<option value="${c.id}">${c.name} (${c.company || 'PF'})</option>`).join('')}
        </select>
      </div>
      <div>
        <label class="block text-xs font-medium text-zinc-600 dark:text-zinc-300 mb-1">Serviço Selecionado</label>
        <input readonly value="${service.name}" class="w-full px-3 py-2 bg-zinc-100 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs font-semibold text-zinc-700 dark:text-zinc-300">
      </div>
      <div class="grid grid-cols-2 gap-2">
        <div>
          <label class="block text-xs font-medium text-zinc-600 dark:text-zinc-300 mb-1">Valor Proposto (R$) *</label>
          <input required type="number" step="0.01" name="value" value="${service.price}" class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs">
        </div>
        <div>
          <label class="block text-xs font-medium text-zinc-600 dark:text-zinc-300 mb-1">Desconto Comercial (R$)</label>
          <input type="number" step="0.01" name="discount" value="0" class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs">
        </div>
      </div>
      <div class="grid grid-cols-2 gap-2">
        <div>
          <label class="block text-xs font-medium text-zinc-600 dark:text-zinc-300 mb-1">Prazo de Entrega</label>
          <input name="deadline" value="${service.timeline}" class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs">
        </div>
        <div>
          <label class="block text-xs font-medium text-zinc-600 dark:text-zinc-300 mb-1">Validade da Proposta</label>
          <input type="date" name="validity" value="${new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0]}" class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs">
        </div>
      </div>
      <div>
        <label class="block text-xs font-medium text-zinc-600 dark:text-zinc-300 mb-1">Condições de Pagamento</label>
        <input name="paymentTerms" value="${service.paymentTerms || ''}" class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs">
      </div>
      <div class="pt-2 flex justify-end gap-2">
        <button type="submit" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors">Gerar Proposta Oficial (+20 XP)</button>
      </div>
    </form>
  `;

  const m = modal.open({
    title: `Nova Proposta: ${service.name}`,
    content,
    size: 'md'
  });

  m.panel.querySelector('#srv-create-prop-form').onsubmit = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const clientId = fd.get('clientId');
    const client = clients.find(c => c.id === clientId);

    const prop = store.addProposal({
      clientId: clientId || null,
      clientName: client ? `${client.name} (${client.company || 'PF'})` : 'Cliente Direto',
      serviceId: service.id,
      serviceName: service.name,
      description: service.description,
      deliverables: service.deliverables,
      value: parseFloat(fd.get('value')) || service.price,
      discount: parseFloat(fd.get('discount')) || 0,
      deadline: fd.get('deadline'),
      validity: fd.get('validity'),
      paymentTerms: fd.get('paymentTerms'),
      status: 'enviada'
    });

    if (clientId) {
      store.addClientActivity(clientId, {
        type: 'proposal',
        title: `Proposta ${prop.number} criada a partir do catálogo de serviços`
      });
    }

    store.addXP(20, `Proposta ${prop.number} gerada para ${service.name}`);
    toast.success(`Proposta ${prop.number} criada com sucesso! (+20 XP)`);
    m.close();
    if (onNavigate) onNavigate('proposals');
  };
}

function openNewServiceModal(onSuccess) {
  const content = `
    <form id="srv-new-form" class="space-y-3">
      <div>
        <label class="block text-xs font-medium text-zinc-600 dark:text-zinc-300 mb-1">Nome do Serviço *</label>
        <input required name="name" class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs" placeholder="Ex: Gestão de Tráfego Pago">
      </div>
      <div class="grid grid-cols-2 gap-2">
        <div>
          <label class="block text-xs font-medium text-zinc-600 dark:text-zinc-300 mb-1">Categoria *</label>
          <input required name="category" class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs" placeholder="Ex: Marketing Digital">
        </div>
        <div>
          <label class="block text-xs font-medium text-zinc-600 dark:text-zinc-300 mb-1">Preço Padrão (R$) *</label>
          <input required type="number" step="0.01" name="price" class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs" placeholder="2500">
        </div>
      </div>
      <div class="grid grid-cols-2 gap-2">
        <div>
          <label class="block text-xs font-medium text-zinc-600 dark:text-zinc-300 mb-1">Prazo Médio</label>
          <input name="timeline" class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs" placeholder="Ex: 15 dias ou Mensal">
        </div>
        <div>
          <label class="block text-xs font-medium text-zinc-600 dark:text-zinc-300 mb-1">Forma de Pagamento</label>
          <input name="paymentTerms" class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs" placeholder="Ex: 50% entrada + 50% entrega">
        </div>
      </div>
      <div>
        <label class="block text-xs font-medium text-zinc-600 dark:text-zinc-300 mb-1">Descrição</label>
        <textarea name="description" rows="2" class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs" placeholder="Objetivo e escopo geral do serviço..."></textarea>
      </div>
      <div>
        <label class="block text-xs font-medium text-zinc-600 dark:text-zinc-300 mb-1">Entregáveis (separados por vírgula)</label>
        <input name="deliverables" class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs" placeholder="Ex: Configuração de pixel, 4 criativos, relatório">
      </div>
      <div class="pt-2 flex justify-end gap-2">
        <button type="submit" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors">Cadastrar Serviço</button>
      </div>
    </form>
  `;

  const m = modal.open({
    title: 'Novo Serviço Criativo',
    content,
    size: 'md'
  });

  m.panel.querySelector('#srv-new-form').onsubmit = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const delivStr = fd.get('deliverables');
    const deliverables = delivStr ? delivStr.split(',').map(s => s.trim()).filter(Boolean) : [];

    store.addService({
      name: fd.get('name'),
      category: fd.get('category'),
      price: parseFloat(fd.get('price')) || 0,
      timeline: fd.get('timeline'),
      paymentTerms: fd.get('paymentTerms'),
      description: fd.get('description'),
      deliverables
    });

    toast.success('Serviço cadastrado no catálogo!');
    m.close();
    if (onSuccess) onSuccess();
  };
}

function openEditServiceModal(service, onSuccess) {
  const content = `
    <form id="srv-edit-form" class="space-y-3">
      <div>
        <label class="block text-xs font-medium text-zinc-600 dark:text-zinc-300 mb-1">Nome do Serviço *</label>
        <input required name="name" value="${service.name}" class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs">
      </div>
      <div class="grid grid-cols-2 gap-2">
        <div>
          <label class="block text-xs font-medium text-zinc-600 dark:text-zinc-300 mb-1">Categoria *</label>
          <input required name="category" value="${service.category}" class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs">
        </div>
        <div>
          <label class="block text-xs font-medium text-zinc-600 dark:text-zinc-300 mb-1">Preço Padrão (R$) *</label>
          <input required type="number" step="0.01" name="price" value="${service.price}" class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs">
        </div>
      </div>
      <div class="grid grid-cols-2 gap-2">
        <div>
          <label class="block text-xs font-medium text-zinc-600 dark:text-zinc-300 mb-1">Prazo Médio</label>
          <input name="timeline" value="${service.timeline || ''}" class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs">
        </div>
        <div>
          <label class="block text-xs font-medium text-zinc-600 dark:text-zinc-300 mb-1">Forma de Pagamento</label>
          <input name="paymentTerms" value="${service.paymentTerms || ''}" class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs">
        </div>
      </div>
      <div>
        <label class="block text-xs font-medium text-zinc-600 dark:text-zinc-300 mb-1">Descrição</label>
        <textarea name="description" rows="2" class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs">${service.description || ''}</textarea>
      </div>
      <div>
        <label class="block text-xs font-medium text-zinc-600 dark:text-zinc-300 mb-1">Entregáveis (separados por vírgula)</label>
        <input name="deliverables" value="${(service.deliverables || []).join(', ')}" class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs">
      </div>
      <div class="pt-2 flex justify-between items-center">
        <button type="button" id="srv-delete-btn" class="text-rose-600 hover:text-rose-700 text-xs font-medium">Excluir Serviço</button>
        <button type="submit" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors">Salvar Alterações</button>
      </div>
    </form>
  `;

  const m = modal.open({
    title: `Editar Serviço — ${service.name}`,
    content,
    size: 'md'
  });

  m.panel.querySelector('#srv-edit-form').onsubmit = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const delivStr = fd.get('deliverables');
    const deliverables = delivStr ? delivStr.split(',').map(s => s.trim()).filter(Boolean) : [];

    store.updateService(service.id, {
      name: fd.get('name'),
      category: fd.get('category'),
      price: parseFloat(fd.get('price')) || 0,
      timeline: fd.get('timeline'),
      paymentTerms: fd.get('paymentTerms'),
      description: fd.get('description'),
      deliverables
    });

    toast.success('Serviço atualizado!');
    m.close();
    if (onSuccess) onSuccess();
  };

  m.panel.querySelector('#srv-delete-btn').onclick = () => {
    if (confirm(`Deseja excluir o serviço '${service.name}' do catálogo?`)) {
      store.deleteService(service.id);
      toast.info('Serviço removido.');
      m.close();
      if (onSuccess) onSuccess();
    }
  };
}

