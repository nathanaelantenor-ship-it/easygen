import { modal } from './Modal.js';
import { store } from '../state/store.js';
import { toast } from './Toast.js';

export function openQuickActionsModal(onNavigate) {
  const content = `
    <div class="grid grid-cols-2 sm:grid-cols-2 gap-2.5">
      <button data-action="lead" class="qa-btn flex items-center gap-3 p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-blue-600 dark:hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-950/20 text-left transition-all">
        <div class="w-9 h-9 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-sm shrink-0">LD</div>
        <div>
          <div class="text-xs font-semibold text-zinc-900 dark:text-zinc-100">Novo Lead</div>
          <div class="text-[11px] text-zinc-400">Adicionar ao CRM</div>
        </div>
      </button>

      <button data-action="client" class="qa-btn flex items-center gap-3 p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-blue-600 dark:hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-950/20 text-left transition-all">
        <div class="w-9 h-9 rounded-lg bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-sm shrink-0">CL</div>
        <div>
          <div class="text-xs font-semibold text-zinc-900 dark:text-zinc-100">Novo Cliente</div>
          <div class="text-[11px] text-zinc-400">Cadastro 360°</div>
        </div>
      </button>

      <button data-action="proposal" class="qa-btn flex items-center gap-3 p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-blue-600 dark:hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-950/20 text-left transition-all">
        <div class="w-9 h-9 rounded-lg bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-400 flex items-center justify-center font-bold text-sm shrink-0">PR</div>
        <div>
          <div class="text-xs font-semibold text-zinc-900 dark:text-zinc-100">Nova Proposta</div>
          <div class="text-[11px] text-zinc-400">Orçamento comercial</div>
        </div>
      </button>

      <button data-action="project" class="qa-btn flex items-center gap-3 p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-blue-600 dark:hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-950/20 text-left transition-all">
        <div class="w-9 h-9 rounded-lg bg-cyan-100 dark:bg-cyan-900/40 text-cyan-600 dark:text-cyan-400 flex items-center justify-center font-bold text-sm shrink-0">PJ</div>
        <div>
          <div class="text-xs font-semibold text-zinc-900 dark:text-zinc-100">Novo Projeto</div>
          <div class="text-[11px] text-zinc-400">Gerenciar entregas</div>
        </div>
      </button>

      <button data-action="delivery" class="qa-btn flex items-center gap-3 p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-blue-600 dark:hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-950/20 text-left transition-all">
        <div class="w-9 h-9 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-sm shrink-0">ET</div>
        <div>
          <div class="text-xs font-semibold text-zinc-900 dark:text-zinc-100">Nova Entrega</div>
          <div class="text-[11px] text-zinc-400">Demanda operacional</div>
        </div>
      </button>

      <button data-action="income" class="qa-btn flex items-center gap-3 p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-emerald-600 dark:hover:border-emerald-500 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 text-left transition-all">
        <div class="w-9 h-9 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-sm shrink-0">+R$</div>
        <div>
          <div class="text-xs font-semibold text-zinc-900 dark:text-zinc-100">Nova Receita</div>
          <div class="text-[11px] text-zinc-400">Entrada financeira</div>
        </div>
      </button>

      <button data-action="expense" class="qa-btn flex items-center gap-3 p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-rose-600 dark:hover:border-rose-500 hover:bg-rose-50/50 dark:hover:bg-rose-950/20 text-left transition-all">
        <div class="w-9 h-9 rounded-lg bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold text-sm shrink-0">-R$</div>
        <div>
          <div class="text-xs font-semibold text-zinc-900 dark:text-zinc-100">Nova Despesa</div>
          <div class="text-[11px] text-zinc-400">Saída financeira</div>
        </div>
      </button>

      <button data-action="task" class="qa-btn flex items-center gap-3 p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-amber-600 dark:hover:border-amber-500 hover:bg-amber-50/50 dark:hover:bg-amber-950/20 text-left transition-all">
        <div class="w-9 h-9 rounded-lg bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-sm shrink-0">TF</div>
        <div>
          <div class="text-xs font-semibold text-zinc-900 dark:text-zinc-100">Nova Tarefa</div>
          <div class="text-[11px] text-zinc-400">Item de rotina</div>
        </div>
      </button>

      <button data-action="event" class="qa-btn flex items-center gap-3 p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-blue-600 dark:hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-950/20 text-left transition-all">
        <div class="w-9 h-9 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-sm shrink-0">AG</div>
        <div>
          <div class="text-xs font-semibold text-zinc-900 dark:text-zinc-100">Novo Evento</div>
          <div class="text-[11px] text-zinc-400">Agendar reunião</div>
        </div>
      </button>

      <button data-action="document" class="qa-btn flex items-center gap-3 p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-zinc-600 dark:hover:border-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800/40 text-left transition-all">
        <div class="w-9 h-9 rounded-lg bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 flex items-center justify-center font-bold text-sm shrink-0">DC</div>
        <div>
          <div class="text-xs font-semibold text-zinc-900 dark:text-zinc-100">Novo Documento</div>
          <div class="text-[11px] text-zinc-400">Upload de arquivo</div>
        </div>
      </button>

      <button data-action="goal" class="qa-btn flex items-center gap-3 p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-purple-600 dark:hover:border-purple-500 hover:bg-purple-50/50 dark:hover:bg-purple-950/20 text-left transition-all">
        <div class="w-9 h-9 rounded-lg bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold text-sm shrink-0">MT</div>
        <div>
          <div class="text-xs font-semibold text-zinc-900 dark:text-zinc-100">Nova Meta</div>
          <div class="text-[11px] text-zinc-400">Meta financeira/pessoal</div>
        </div>
      </button>
    </div>
  `;

  const m = modal.open({
    title: 'Ações Rápidas',
    content,
    size: 'lg'
  });

  m.panel.querySelectorAll('.qa-btn').forEach(btn => {
    btn.onclick = () => {
      const action = btn.getAttribute('data-action');
      m.close();
      openQuickActionForm(action, onNavigate);
    };
  });
}

function openQuickActionForm(action, onNavigate) {
  const state = store.getState();

  if (action === 'lead') {
    const formContent = `
      <form id="form-quick-lead" class="space-y-3">
        <div>
          <label class="block text-xs font-medium text-zinc-600 dark:text-zinc-300 mb-1">Nome do Contato *</label>
          <input required name="name" class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs" placeholder="Ex: Camila Rocha">
        </div>
        <div class="grid grid-cols-2 gap-2">
          <div>
            <label class="block text-xs font-medium text-zinc-600 dark:text-zinc-300 mb-1">Empresa</label>
            <input name="company" class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs" placeholder="Ex: Aurora Design">
          </div>
          <div>
            <label class="block text-xs font-medium text-zinc-600 dark:text-zinc-300 mb-1">Telefone / WhatsApp</label>
            <input name="phone" class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs" placeholder="(11) 99999-9999">
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
        <div class="pt-2 flex justify-end gap-2">
          <button type="submit" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium transition-colors">Criar Lead</button>
        </div>
      </form>
    `;
    const fModal = modal.open({ title: 'Novo Lead', content: formContent, size: 'md' });
    fModal.panel.querySelector('#form-quick-lead').onsubmit = (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      store.addLead({
        name: fd.get('name'),
        company: fd.get('company'),
        phone: fd.get('phone'),
        serviceOfInterest: fd.get('serviceOfInterest'),
        estimatedValue: parseFloat(fd.get('estimatedValue')) || 0
      });
      toast.success('Lead adicionado com sucesso!');
      fModal.close();
      if (onNavigate) onNavigate('crm');
    };
  } else if (action === 'income' || action === 'expense') {
    const isIncome = action === 'income';
    const formContent = `
      <form id="form-quick-tx" class="space-y-3">
        <div>
          <label class="block text-xs font-medium text-zinc-600 dark:text-zinc-300 mb-1">Descrição *</label>
          <input required name="title" class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs" placeholder="${isIncome ? 'Ex: Entrada de projeto' : 'Ex: Assinatura de software'}">
        </div>
        <div class="grid grid-cols-2 gap-2">
          <div>
            <label class="block text-xs font-medium text-zinc-600 dark:text-zinc-300 mb-1">Valor (R$) *</label>
            <input required type="number" step="0.01" name="amount" class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs" placeholder="1500.00">
          </div>
          <div>
            <label class="block text-xs font-medium text-zinc-600 dark:text-zinc-300 mb-1">Âmbito</label>
            <select name="scope" class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs">
              <option value="business">Empresa</option>
              <option value="personal">Pessoal</option>
            </select>
          </div>
        </div>
        <div class="grid grid-cols-2 gap-2">
          <div>
            <label class="block text-xs font-medium text-zinc-600 dark:text-zinc-300 mb-1">Categoria</label>
            <select name="category" class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs">
              ${state.categories.map(c => `<option value="${c.name}">${c.name}</option>`).join('')}
            </select>
          </div>
          <div>
            <label class="block text-xs font-medium text-zinc-600 dark:text-zinc-300 mb-1">Cliente Vinculado</label>
            <select name="clientId" class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs">
              <option value="">Nenhum / Próprio</option>
              ${state.clients.map(c => `<option value="${c.id}">${c.name} (${c.company})</option>`).join('')}
            </select>
          </div>
        </div>
        <div class="pt-2 flex justify-end gap-2">
          <button type="submit" class="px-4 py-2 ${isIncome ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'} text-white rounded-lg text-xs font-medium transition-colors">
            ${isIncome ? 'Lançar Receita' : 'Lançar Despesa'}
          </button>
        </div>
      </form>
    `;
    const fModal = modal.open({ title: isIncome ? 'Nova Receita' : 'Nova Despesa', content: formContent, size: 'md' });
    fModal.panel.querySelector('#form-quick-tx').onsubmit = (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      store.addTransaction({
        title: fd.get('title'),
        type: isIncome ? 'income' : 'expense',
        amount: parseFloat(fd.get('amount')) || 0,
        scope: fd.get('scope'),
        category: fd.get('category'),
        clientId: fd.get('clientId') || null
      });
      toast.success(isIncome ? 'Receita lançada e saldo atualizado!' : 'Despesa registrada com sucesso!');
      fModal.close();
      if (onNavigate) onNavigate('finance');
    };
  } else if (action === 'task') {
    const formContent = `
      <form id="form-quick-task" class="space-y-3">
        <div>
          <label class="block text-xs font-medium text-zinc-600 dark:text-zinc-300 mb-1">Título da Tarefa *</label>
          <input required name="title" class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs" placeholder="Ex: Ajustar exportação de arquivos">
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
            <input type="date" name="dueDate" value="${new Date().toISOString().split('T')[0]}" class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs">
          </div>
        </div>
        <div class="pt-2 flex justify-end gap-2">
          <button type="submit" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium transition-colors">Criar Tarefa</button>
        </div>
      </form>
    `;
    const fModal = modal.open({ title: 'Nova Tarefa', content: formContent, size: 'md' });
    fModal.panel.querySelector('#form-quick-task').onsubmit = (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      store.addTask({
        title: fd.get('title'),
        priority: fd.get('priority'),
        dueDate: fd.get('dueDate')
      });
      toast.success('Tarefa adicionada à sua rotina!');
      fModal.close();
      if (onNavigate) onNavigate('routine');
    };
  } else {
    // Redireciona diretamente para o módulo correspondente com notificação explicativa
    const moduleMap = {
      client: 'clients',
      proposal: 'proposals',
      project: 'projects',
      delivery: 'entregas',
      event: 'agenda',
      document: 'documents',
      goal: 'goals'
    };
    if (onNavigate && moduleMap[action]) {
      onNavigate(moduleMap[action]);
      toast.info(`Abra o botão "+ Novo" no módulo para adicionar.`);
    }
  }
}
