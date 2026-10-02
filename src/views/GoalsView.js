import { store } from '../state/store.js';
import { modal } from '../components/Modal.js';
import { toast } from '../components/Toast.js';
import { formatCurrency, formatDate, getStatusBadge } from '../utils/formatters.js';

let goalsScope = 'all'; // all | business | personal

export function renderGoalsView(container, onNavigate) {
  const { goals, categories } = store.getState();

  const filteredGoals = goalsScope === 'all'
    ? goals
    : goals.filter(g => g.scope === goalsScope);

  const completedGoals = goals.filter(g => (g.currentValue || 0) >= (g.targetValue || 1)).length;
  const avgProgress = goals.length > 0 
    ? Math.round(goals.reduce((acc, g) => acc + Math.min(100, Math.round(((g.currentValue || 0) / (g.targetValue || 1)) * 100)), 0) / goals.length)
    : 0;

  container.innerHTML = `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 class="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">Metas & Objetivos</h2>
          <p class="text-xs text-zinc-500">Acompanhamento de metas financeiras e conquistas pessoais com avanço automático por lançamentos.</p>
        </div>
        <div>
          <button id="goals-new-btn" class="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition-colors shadow-xs">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
            <span>Nova Meta</span>
          </button>
        </div>
      </div>

      <!-- Scope Switcher & Summary -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div class="flex items-center p-1 bg-zinc-100 dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs">
          <button data-scope="all" class="px-3.5 py-1.5 font-semibold rounded-lg transition-colors ${goalsScope === 'all' ? 'bg-white dark:bg-zinc-700 text-blue-600 shadow-2xs' : 'text-zinc-500'}">Todas</button>
          <button data-scope="business" class="px-3.5 py-1.5 font-semibold rounded-lg transition-colors ${goalsScope === 'business' ? 'bg-white dark:bg-zinc-700 text-blue-600 shadow-2xs' : 'text-zinc-500'}">Empresa</button>
          <button data-scope="personal" class="px-3.5 py-1.5 font-semibold rounded-lg transition-colors ${goalsScope === 'personal' ? 'bg-white dark:bg-zinc-700 text-blue-600 shadow-2xs' : 'text-zinc-500'}">Pessoal</button>
        </div>

        <div class="flex items-center gap-4 text-xs font-medium text-zinc-500">
          <div>Concluídas: <b class="text-emerald-600">${completedGoals}/${goals.length}</b></div>
          <div>Progresso Médio: <b class="text-blue-600">${avgProgress}%</b></div>
        </div>
      </div>

      <!-- Goals Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        ${filteredGoals.map(g => {
          const current = g.currentValue || 0;
          const target = g.targetValue || 1;
          const percent = Math.min(100, Math.round((current / target) * 100));
          const isDone = current >= target;

          return `
            <div class="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-2xs hover:border-blue-400 dark:hover:border-blue-600 transition-all flex flex-col justify-between">
              <div>
                <div class="flex items-start justify-between gap-2 mb-2">
                  <div class="flex items-center gap-2">
                    <span class="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                      g.scope === 'business' ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300' : 'bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300'
                    }">
                      ${g.scope === 'business' ? 'Empresa' : 'Pessoal'}
                    </span>
                    <span class="text-xs text-zinc-400">• ${g.category}</span>
                  </div>
                  ${getStatusBadge(g.priority)}
                </div>

                <h3 class="text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-1">${g.title}</h3>
                <p class="text-xs text-zinc-500 leading-relaxed mb-4">${g.notes || ''}</p>

                <!-- Values & Progress Bar -->
                <div class="space-y-2 mb-4">
                  <div class="flex items-baseline justify-between text-xs">
                    <div>
                      <span class="text-base font-bold ${isDone ? 'text-emerald-600' : 'text-blue-600 dark:text-blue-400'}">${formatCurrency(current)}</span>
                      <span class="text-zinc-400 text-[11px]"> de ${formatCurrency(target)}</span>
                    </div>
                    <span class="font-bold ${isDone ? 'text-emerald-600' : 'text-zinc-900 dark:text-zinc-100'}">${percent}%</span>
                  </div>

                  <div class="w-full bg-zinc-100 dark:bg-zinc-800 h-2.5 rounded-full overflow-hidden">
                    <div class="${isDone ? 'bg-emerald-500' : 'bg-blue-600'} h-full rounded-full transition-all duration-500" style="width: ${percent}%"></div>
                  </div>
                </div>
              </div>

              <div class="pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-[11px] text-zinc-400">
                <span>Prazo: <b class="text-zinc-700 dark:text-zinc-300">${formatDate(g.deadline)}</b></span>
                <div class="flex items-center gap-2">
                  <button data-update-goal="${g.id}" class="text-blue-600 hover:underline font-semibold">Atualizar Valor</button>
                  <button data-delete-goal="${g.id}" class="text-zinc-400 hover:text-rose-600 font-medium">Excluir</button>
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;

  // Scope buttons
  container.querySelectorAll('button[data-scope]').forEach(btn => {
    btn.onclick = () => {
      goalsScope = btn.getAttribute('data-scope');
      renderGoalsView(container, onNavigate);
    };
  });

  // Update Goal
  container.querySelectorAll('button[data-update-goal]').forEach(btn => {
    btn.onclick = () => {
      const id = btn.getAttribute('data-update-goal');
      const g = goals.find(x => x.id === id);
      if (!g) return;
      const newVal = prompt(`Atualizar valor atual para a meta '${g.title}':`, g.currentValue);
      if (newVal !== null && !isNaN(parseFloat(newVal))) {
        store.updateGoal(g.id, { currentValue: parseFloat(newVal) });
        toast.success('Progresso da meta atualizado!');
        renderGoalsView(container, onNavigate);
      }
    };
  });

  // Delete Goal
  container.querySelectorAll('button[data-delete-goal]').forEach(btn => {
    btn.onclick = () => {
      const id = btn.getAttribute('data-delete-goal');
      if (confirm('Deseja excluir esta meta?')) {
        store.deleteGoal(id);
        toast.info('Meta excluída.');
        renderGoalsView(container, onNavigate);
      }
    };
  });

  // New Goal
  container.querySelector('#goals-new-btn').onclick = () => {
    openCreateGoalModal(() => renderGoalsView(container, onNavigate));
  };
}

function openCreateGoalModal(onSuccess) {
  const content = `
    <form id="goal-modal-create-form" class="space-y-3">
      <div>
        <label class="block text-xs font-medium text-zinc-600 dark:text-zinc-300 mb-1">Título da Meta *</label>
        <input required name="title" class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs" placeholder="Ex: Faturar R$ 40.000 no Trimestre">
      </div>
      <div class="grid grid-cols-2 gap-2">
        <div>
          <label class="block text-xs font-medium text-zinc-600 dark:text-zinc-300 mb-1">Âmbito</label>
          <select name="scope" class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs">
            <option value="business">Empresa (PJ)</option>
            <option value="personal">Pessoal (PF)</option>
          </select>
        </div>
        <div>
          <label class="block text-xs font-medium text-zinc-600 dark:text-zinc-300 mb-1">Categoria</label>
          <input name="category" value="Receita" class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs" placeholder="Ex: Receita ou Reserva">
        </div>
      </div>
      <div class="grid grid-cols-2 gap-2">
        <div>
          <label class="block text-xs font-medium text-zinc-600 dark:text-zinc-300 mb-1">Valor Alvo (R$) *</label>
          <input required type="number" name="targetValue" class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs" placeholder="30000">
        </div>
        <div>
          <label class="block text-xs font-medium text-zinc-600 dark:text-zinc-300 mb-1">Valor Inicial Já Atingido (R$)</label>
          <input type="number" name="currentValue" value="0" class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs">
        </div>
      </div>
      <div class="grid grid-cols-2 gap-2">
        <div>
          <label class="block text-xs font-medium text-zinc-600 dark:text-zinc-300 mb-1">Prazo Final</label>
          <input type="date" name="deadline" value="${new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]}" class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs">
        </div>
        <div>
          <label class="block text-xs font-medium text-zinc-600 dark:text-zinc-300 mb-1">Prioridade</label>
          <select name="priority" class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs">
            <option value="alta" selected>Alta</option>
            <option value="media">Média</option>
            <option value="baixa">Baixa</option>
          </select>
        </div>
      </div>
      <div class="pt-2 flex justify-end gap-2">
        <button type="submit" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors">Criar Meta</button>
      </div>
    </form>
  `;

  const m = modal.open({ title: 'Nova Meta de Sucesso', content, size: 'md' });
  m.panel.querySelector('#goal-modal-create-form').onsubmit = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    store.addGoal({
      title: fd.get('title'),
      scope: fd.get('scope'),
      category: fd.get('category'),
      targetValue: parseFloat(fd.get('targetValue')) || 1000,
      currentValue: parseFloat(fd.get('currentValue')) || 0,
      deadline: fd.get('deadline'),
      priority: fd.get('priority')
    });
    toast.success('Meta cadastrada! Acompanhe o progresso!');
    m.close();
    if (onSuccess) onSuccess();
  };
}
