import { store } from '../state/store.js';
import { modal } from '../components/Modal.js';
import { toast } from '../components/Toast.js';
import { formatCurrency } from '../utils/formatters.js';

export function renderServicesView(container, onNavigate) {
  const { services, clients } = store.getState();

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

      <!-- Services Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        ${services.map(srv => `
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
            </div>

            <div class="pt-4 border-t border-zinc-100 dark:border-zinc-800">
              <div class="flex items-center justify-between text-[11px] text-zinc-400 mb-3">
                <span>Prazo: <b class="text-zinc-700 dark:text-zinc-300">${srv.timeline}</b></span>
                <span>${srv.paymentTerms || 'Consulte condições'}</span>
              </div>
              <button data-action="create-proposal" data-service-id="${srv.id}" class="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-xs">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                <span>Nova Proposta com este Serviço</span>
              </button>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;

  // Nova Proposta handler
  container.querySelectorAll('button[data-action="create-proposal"]').forEach(btn => {
    btn.onclick = () => {
      const srvId = btn.getAttribute('data-service-id');
      const srv = services.find(s => s.id === srvId);
      if (!srv) return;
      openNewProposalFromServiceModal(srv, onNavigate);
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
          ${clients.map(c => `<option value="${c.id}">${c.name} (${c.company})</option>`).join('')}
        </select>
      </div>
      <div>
        <label class="block text-xs font-medium text-zinc-600 dark:text-zinc-300 mb-1">Serviço Selecionado</label>
        <input readonly value="${service.name}" class="w-full px-3 py-2 bg-zinc-100 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs font-semibold text-zinc-700 dark:text-zinc-300">
      </div>
      <div class="grid grid-cols-2 gap-2">
        <div>
          <label class="block text-xs font-medium text-zinc-600 dark:text-zinc-300 mb-1">Valor Proposto (R$) *</label>
          <input required type="number" name="value" value="${service.price}" class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs">
        </div>
        <div>
          <label class="block text-xs font-medium text-zinc-600 dark:text-zinc-300 mb-1">Desconto Comercial (R$)</label>
          <input type="number" name="discount" value="0" class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs">
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
        <button type="submit" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors">Gerar Proposta Oficial</button>
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
      clientName: client ? `${client.name} (${client.company})` : 'Cliente Direto',
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

    toast.success(`Proposta ${prop.number} criada com sucesso!`);
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
          <input required type="number" name="price" class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs" placeholder="2500">
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
