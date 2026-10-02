import { store } from '../state/store.js';
import { modal } from '../components/Modal.js';
import { toast } from '../components/Toast.js';
import { formatDate, getStatusBadge } from '../utils/formatters.js';

export function renderRoutineView(container, onNavigate) {
  const { tasks, habits, events } = store.getState();

  const completedTasks = tasks.filter(t => t.status === 'done').length;
  const taskProgress = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;
  const completedHabits = habits.filter(h => h.completedToday).length;
  const habitProgress = habits.length > 0 ? Math.round((completedHabits / habits.length) * 100) : 0;

  container.innerHTML = `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 class="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">Rotina & Produtividade</h2>
          <p class="text-xs text-zinc-500">Gestão diária, tarefas por prioridade e rastreador de hábitos com gamificação e streaks.</p>
        </div>
        <div class="flex items-center gap-2">
          <button id="routine-new-task-btn" class="px-3 py-1.5 border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-850 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-xl text-xs font-semibold text-zinc-700 dark:text-zinc-300 transition-colors shadow-2xs">
            + Nova Tarefa
          </button>
          <button id="routine-new-habit-btn" class="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition-colors shadow-xs">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
            <span>Novo Hábito</span>
          </button>
        </div>
      </div>

      <!-- Today's Routine Daily Summary Box -->
      <div class="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-2xs">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <h3 class="text-sm font-bold text-zinc-900 dark:text-zinc-100">Progresso do Dia</h3>
            <p class="text-[11px] text-zinc-400">Visão consolidada de tarefas e consistência de hábitos de hoje</p>
          </div>
          <div class="flex items-center gap-4 text-xs">
            <div>
              <span class="text-zinc-400">Tarefas Concluídas:</span>
              <span class="font-bold text-blue-600 dark:text-blue-400 ml-1">${completedTasks}/${tasks.length} (${taskProgress}%)</span>
            </div>
            <div>
              <span class="text-zinc-400">Hábitos Mantidos:</span>
              <span class="font-bold text-emerald-600 dark:text-emerald-400 ml-1">${completedHabits}/${habits.length} (${habitProgress}%)</span>
            </div>
          </div>
        </div>

        <div class="w-full bg-zinc-100 dark:bg-zinc-800 h-2 rounded-full overflow-hidden flex">
          <div class="bg-blue-600 h-full transition-all" style="width: ${Math.round((taskProgress + habitProgress) / 2)}%"></div>
        </div>
      </div>

      <!-- Habits Gamification Section -->
      <div class="space-y-3">
        <div class="flex items-center justify-between">
          <div class="text-xs font-bold uppercase tracking-wider text-zinc-400">Rastreador de Hábitos & Streaks</div>
          <span class="text-[11px] text-zinc-400">Constância e foco diário</span>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          ${habits.map(h => `
            <div class="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-2xs flex flex-col justify-between hover:border-blue-400 dark:hover:border-blue-600 transition-all">
              <div>
                <div class="flex items-start justify-between gap-2 mb-2">
                  <span class="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-md">
                    ${h.category || 'Hábito'}
                  </span>
                  <!-- Streak Flame Badge -->
                  <div class="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${h.streak > 0 ? 'bg-orange-50 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-800/40' : 'bg-zinc-100 text-zinc-400'}">
                    <span>🔥</span>
                    <span>${h.streak} dias</span>
                  </div>
                </div>

                <h4 class="font-bold text-xs text-zinc-900 dark:text-zinc-100 mb-1">${h.name}</h4>
                <p class="text-[11px] text-zinc-500 mb-3">${h.target}</p>

                <div class="space-y-1 text-[10px] text-zinc-400 mb-3">
                  <div class="flex justify-between">
                    <span>Melhor Sequência:</span>
                    <b class="text-zinc-700 dark:text-zinc-300">${h.bestStreak} dias</b>
                  </div>
                  <div class="flex justify-between">
                    <span>Taxa de Consistência:</span>
                    <b class="text-emerald-600">${h.consistencyRate}%</b>
                  </div>
                </div>
              </div>

              <div class="pt-3 border-t border-zinc-100 dark:border-zinc-800">
                <button 
                  data-toggle-habit="${h.id}" 
                  class="w-full py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                    h.completedToday 
                      ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800' 
                      : 'bg-zinc-100 dark:bg-zinc-800 hover:bg-blue-600 hover:text-white text-zinc-700 dark:text-zinc-300'
                  }"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
                  <span>${h.completedToday ? 'Concluído Hoje!' : 'Marcar como Feito'}</span>
                </button>
              </div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Tasks by Priority Section -->
      <div class="space-y-3">
        <div class="flex items-center justify-between">
          <div class="text-xs font-bold uppercase tracking-wider text-zinc-400">Tarefas & Prioridades</div>
          <span class="text-[11px] text-zinc-400">${tasks.filter(t => t.status !== 'done').length} pendentes</span>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <!-- Urgente -->
          ${renderTaskColumn('Urgente', tasks.filter(t => t.priority === 'urgente'), 'border-rose-500', 'bg-rose-500')}
          <!-- Alta -->
          ${renderTaskColumn('Alta', tasks.filter(t => t.priority === 'alta'), 'border-orange-500', 'bg-orange-500')}
          <!-- Média -->
          ${renderTaskColumn('Média', tasks.filter(t => t.priority === 'media'), 'border-blue-500', 'bg-blue-500')}
          <!-- Baixa -->
          ${renderTaskColumn('Baixa', tasks.filter(t => t.priority === 'baixa'), 'border-zinc-400', 'bg-zinc-400')}
        </div>
      </div>
    </div>
  `;

  // Toggle Habit
  container.querySelectorAll('button[data-toggle-habit]').forEach(btn => {
    btn.onclick = () => {
      const id = btn.getAttribute('data-toggle-habit');
      store.toggleHabitToday(id);
      toast.success('Hábito atualizado! Mantendo a sequência 🔥');
      renderRoutineView(container, onNavigate);
    };
  });

  // Toggle Task
  container.querySelectorAll('input[data-task-toggle]').forEach(chk => {
    chk.onchange = () => {
      const id = chk.getAttribute('data-task-toggle');
      store.toggleTask(id);
      toast.info(chk.checked ? 'Tarefa concluída!' : 'Tarefa reaberta.');
      renderRoutineView(container, onNavigate);
    };
  });

  // New Task
  container.querySelector('#routine-new-task-btn').onclick = () => {
    openCreateTaskModal(() => renderRoutineView(container, onNavigate));
  };

  // New Habit
  container.querySelector('#routine-new-habit-btn').onclick = () => {
    openCreateHabitModal(() => renderRoutineView(container, onNavigate));
  };
}

function renderTaskColumn(title, colTasks, borderColor, dotColor) {
  return `
    <div class="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl p-3 min-h-[260px] flex flex-col">
      <div class="flex items-center justify-between pb-2.5 mb-2 border-b border-zinc-100 dark:border-zinc-800">
        <div class="flex items-center gap-2">
          <span class="w-2 h-2 rounded-full ${dotColor}"></span>
          <span class="text-xs font-bold text-zinc-900 dark:text-zinc-100">${title}</span>
        </div>
        <span class="text-[10px] bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded-full font-semibold text-zinc-500">${colTasks.length}</span>
      </div>

      <div class="space-y-2 flex-1 overflow-y-auto">
        ${colTasks.length === 0 ? `
          <div class="text-center py-8 text-[11px] text-zinc-400">Nenhuma tarefa</div>
        ` : colTasks.map(t => `
          <div class="p-2.5 rounded-xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-850/50 hover:bg-white dark:hover:bg-zinc-800 transition-colors">
            <label class="flex items-start gap-2.5 cursor-pointer">
              <input type="checkbox" data-task-toggle="${t.id}" ${t.status === 'done' ? 'checked' : ''} class="w-4 h-4 rounded text-blue-600 focus:ring-0 mt-0.5 shrink-0">
              <div class="flex-1">
                <span class="text-xs font-medium ${t.status === 'done' ? 'line-through text-zinc-400' : 'text-zinc-800 dark:text-zinc-200'}">${t.title}</span>
                <div class="text-[10px] text-zinc-400 mt-1">Prazo: ${formatDate(t.dueDate)}</div>
              </div>
            </label>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

function openCreateTaskModal(onSuccess) {
  const content = `
    <form id="routine-task-create-form" class="space-y-3">
      <div>
        <label class="block text-xs font-medium text-zinc-600 dark:text-zinc-300 mb-1">Título da Tarefa *</label>
        <input required name="title" class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs" placeholder="Ex: Preparar arquivos em alta para gráfica">
      </div>
      <div class="grid grid-cols-2 gap-2">
        <div>
          <label class="block text-xs font-medium text-zinc-600 dark:text-zinc-300 mb-1">Prioridade</label>
          <select name="priority" class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs">
            <option value="urgente">Urgente</option>
            <option value="alta" selected>Alta</option>
            <option value="media">Média</option>
            <option value="baixa">Baixa</option>
          </select>
        </div>
        <div>
          <label class="block text-xs font-medium text-zinc-600 dark:text-zinc-300 mb-1">Data Limite</label>
          <input type="date" name="dueDate" value="${new Date().toISOString().split('T')[0]}" class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs">
        </div>
      </div>
      <div class="pt-2 flex justify-end gap-2">
        <button type="submit" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors">Adicionar Tarefa</button>
      </div>
    </form>
  `;

  const m = modal.open({ title: 'Nova Tarefa de Rotina', content, size: 'md' });
  m.panel.querySelector('#routine-task-create-form').onsubmit = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    store.addTask({
      title: fd.get('title'),
      priority: fd.get('priority'),
      dueDate: fd.get('dueDate')
    });
    toast.success('Tarefa adicionada à rotina!');
    m.close();
    if (onSuccess) onSuccess();
  };
}

function openCreateHabitModal(onSuccess) {
  const content = `
    <form id="routine-habit-create-form" class="space-y-3">
      <div>
        <label class="block text-xs font-medium text-zinc-600 dark:text-zinc-300 mb-1">Nome do Hábito *</label>
        <input required name="name" class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs" placeholder="Ex: Estudo de Tipografia ou Leitura">
      </div>
      <div class="grid grid-cols-2 gap-2">
        <div>
          <label class="block text-xs font-medium text-zinc-600 dark:text-zinc-300 mb-1">Meta Diária</label>
          <input name="target" class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs" placeholder="Ex: 20 minutos por dia">
        </div>
        <div>
          <label class="block text-xs font-medium text-zinc-600 dark:text-zinc-300 mb-1">Categoria</label>
          <input name="category" class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs" placeholder="Ex: Educação ou Saúde">
        </div>
      </div>
      <div class="pt-2 flex justify-end gap-2">
        <button type="submit" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors">Criar Hábito</button>
      </div>
    </form>
  `;

  const m = modal.open({ title: 'Novo Hábito Gamificado', content, size: 'md' });
  m.panel.querySelector('#routine-habit-create-form').onsubmit = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    store.addHabit({
      name: fd.get('name'),
      target: fd.get('target') || 'Diário',
      category: fd.get('category') || 'Produtividade'
    });
    toast.success('Novo hábito criado! Comece seu streak hoje 🔥');
    m.close();
    if (onSuccess) onSuccess();
  };
}
