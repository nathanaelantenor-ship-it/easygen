import { store } from '../state/store.js';
import { modal } from '../components/Modal.js';
import { toast } from '../components/Toast.js';
import { formatDate } from '../utils/formatters.js';

let routineDisplayMode = 'priorities'; // 'priorities' | 'eisenhower'

export function renderRoutineView(container, onNavigate) {
  const { tasks = [], habits = [] } = store.getState();

  const completedTasks = tasks.filter(t => t.status === 'done').length;
  const taskProgress = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;
  const completedHabits = habits.filter(h => h.completedToday).length;
  const habitProgress = habits.length > 0 ? Math.round((completedHabits / habits.length) * 100) : 0;
  const overallProgress = Math.round((taskProgress + habitProgress) / 2);

  container.innerHTML = `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div class="flex items-center gap-3">
            <h2 class="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">Rotina & Produtividade</h2>
            <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
              ⚡ +10 XP por tarefa
            </span>
          </div>
          <p class="text-xs text-zinc-500 mt-1">Gestão de tarefas com prioridades, Matriz de Eisenhower e hábitos gamificados com sequências (streaks 🔥).</p>
        </div>
        <div class="flex items-center gap-2">
          <!-- Modo de Visualização de Tarefas -->
          <div class="flex items-center p-1 bg-zinc-100 dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700">
            <button id="mode-priorities-btn" class="px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${routineDisplayMode === 'priorities' ? 'bg-white dark:bg-zinc-900 text-blue-600 shadow-2xs' : 'text-zinc-500'}">Prioridades</button>
            <button id="mode-eisenhower-btn" class="px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${routineDisplayMode === 'eisenhower' ? 'bg-white dark:bg-zinc-900 text-blue-600 shadow-2xs' : 'text-zinc-500'}">Eisenhower (2x2)</button>
          </div>

          <button id="routine-new-task-btn" class="px-3 py-1.5 border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-750 rounded-xl text-xs font-semibold text-zinc-700 dark:text-zinc-300 transition-colors shadow-2xs">
            + Nova Tarefa
          </button>
          <button id="routine-new-habit-btn" class="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition-colors shadow-xs">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
            <span>Novo Hábito</span>
          </button>
        </div>
      </div>

      <!-- Today's Routine Daily Summary Box -->
      <div class="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-2xs space-y-4">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 class="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <span>Progresso do Dia</span>
              <span class="text-xs px-2 py-0.5 rounded-full font-bold ${overallProgress === 100 ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'}">
                ${overallProgress}% Concluído
              </span>
            </h3>
            <p class="text-[11px] text-zinc-400 mt-0.5">Visão consolidada de tarefas operacionais e consistência de hábitos hoje</p>
          </div>
          <div class="flex items-center gap-4 text-xs">
            <div>
              <span class="text-zinc-400">Tarefas:</span>
              <span class="font-bold text-blue-600 dark:text-blue-400 ml-1">${completedTasks}/${tasks.length} (${taskProgress}%)</span>
            </div>
            <div>
              <span class="text-zinc-400">Hábitos 🔥:</span>
              <span class="font-bold text-emerald-600 dark:text-emerald-400 ml-1">${completedHabits}/${habits.length} (${habitProgress}%)</span>
            </div>
          </div>
        </div>

        <div class="w-full bg-zinc-100 dark:bg-zinc-800 h-2.5 rounded-full overflow-hidden flex">
          <div class="bg-blue-600 h-full transition-all duration-500 rounded-full" style="width: ${overallProgress}%"></div>
        </div>
      </div>

      <!-- Habits Gamification Section -->
      <div class="space-y-3">
        <div class="flex items-center justify-between">
          <div class="text-xs font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-1.5">
            <span>🔥</span>
            <span>Rastreador de Hábitos & Sequências (Streaks)</span>
          </div>
          <span class="text-[11px] text-zinc-400">Ganhe +15 XP por hábito diário mantido</span>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          ${habits.map(h => `
            <div class="p-4 rounded-2xl bg-white dark:bg-zinc-900 border ${h.completedToday ? 'border-emerald-300 dark:border-emerald-800/80 ring-1 ring-emerald-500/20' : 'border-zinc-200/80 dark:border-zinc-800'} shadow-2xs flex flex-col justify-between hover:border-blue-400 transition-all">
              <div>
                <div class="flex items-start justify-between gap-2 mb-2">
                  <span class="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-md">
                    ${h.category || 'Hábito'}
                  </span>
                  <!-- Streak Flame Badge -->
                  <div class="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${h.streak > 0 ? 'bg-orange-50 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-800/40' : 'bg-zinc-100 text-zinc-400'}">
                    <span>🔥</span>
                    <span>${h.streak} dias</span>
                  </div>
                </div>

                <h4 class="font-bold text-xs text-zinc-900 dark:text-zinc-100 mb-1">${h.name}</h4>
                <p class="text-[11px] text-zinc-500 mb-3">${h.target}</p>

                <div class="space-y-1 text-[10px] text-zinc-400 mb-3">
                  <div class="flex justify-between">
                    <span>Melhor Sequência 🏆:</span>
                    <b class="text-zinc-700 dark:text-zinc-300">${h.bestStreak || h.streak} dias</b>
                  </div>
                  <div class="flex justify-between">
                    <span>Taxa de Consistência:</span>
                    <b class="text-emerald-600 font-bold">${h.consistencyRate || 100}%</b>
                  </div>
                </div>
              </div>

              <div class="pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center gap-2">
                <button 
                  data-toggle-habit="${h.id}" 
                  class="flex-1 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    h.completedToday 
                      ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800' 
                      : 'bg-zinc-100 dark:bg-zinc-800 hover:bg-blue-600 hover:text-white text-zinc-700 dark:text-zinc-300 active:scale-95'
                  }"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
                  <span>${h.completedToday ? 'Concluído Hoje!' : 'Marcar como Feito'}</span>
                </button>
                <button 
                  data-del-habit="${h.id}" 
                  class="p-2 text-zinc-300 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                  title="Excluir hábito"
                >
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                </button>
              </div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Tasks Section -->
      ${routineDisplayMode === 'priorities' ? `
        <!-- Modo Prioridades -->
        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <div class="text-xs font-bold uppercase tracking-wider text-zinc-500">Tarefas do Dia por Prioridade</div>
            <span class="text-[11px] text-zinc-400">${tasks.filter(t => t.status !== 'done').length} pendentes</span>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            ${renderTaskColumn('Urgente', tasks.filter(t => t.priority === 'urgente'), 'border-rose-500', 'bg-rose-500')}
            ${renderTaskColumn('Alta', tasks.filter(t => t.priority === 'alta'), 'border-orange-500', 'bg-orange-500')}
            ${renderTaskColumn('Média', tasks.filter(t => t.priority === 'media'), 'border-blue-500', 'bg-blue-500')}
            ${renderTaskColumn('Baixa', tasks.filter(t => t.priority === 'baixa'), 'border-zinc-400', 'bg-zinc-400')}
          </div>
        </div>
      ` : `
        <!-- Modo Matriz de Eisenhower (2x2) -->
        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <div class="text-xs font-bold uppercase tracking-wider text-zinc-500">Matriz de Eisenhower (Importância vs Urgência)</div>
            <span class="text-[11px] text-zinc-400">Classificação estratégica de afazeres</span>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- Q1: Urgente & Importante (Fazer Já) -->
            <div class="p-4 rounded-2xl bg-white dark:bg-zinc-900 border-2 border-rose-200 dark:border-rose-900/60 space-y-3">
              <div class="flex items-center justify-between border-b border-rose-100 dark:border-rose-900/40 pb-2">
                <div>
                  <h4 class="text-xs font-bold text-rose-700 dark:text-rose-400 flex items-center gap-1.5">
                    <span class="w-2.5 h-2.5 rounded-full bg-rose-600"></span>
                    1. FAZER AGORA (Urgente & Importante)
                  </h4>
                  <p class="text-[10px] text-zinc-400">Crises, prazos fatais e entregas imediatas</p>
                </div>
                <span class="text-[10px] font-bold bg-rose-50 dark:bg-rose-950/60 text-rose-700 px-2 py-0.5 rounded-full">
                  ${tasks.filter(t => t.priority === 'urgente').length}
                </span>
              </div>
              <div class="space-y-2 max-h-56 overflow-y-auto">
                ${renderTaskList(tasks.filter(t => t.priority === 'urgente'))}
              </div>
            </div>

            <!-- Q2: Não Urgente & Importante (Planejar) -->
            <div class="p-4 rounded-2xl bg-white dark:bg-zinc-900 border-2 border-blue-200 dark:border-blue-900/60 space-y-3">
              <div class="flex items-center justify-between border-b border-blue-100 dark:border-blue-900/40 pb-2">
                <div>
                  <h4 class="text-xs font-bold text-blue-700 dark:text-blue-400 flex items-center gap-1.5">
                    <span class="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                    2. PLANEJAR (Importante, Não Urgente)
                  </h4>
                  <p class="text-[10px] text-zinc-400">Estratégia, novos projetos, crescimento e estudos</p>
                </div>
                <span class="text-[10px] font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-700 px-2 py-0.5 rounded-full">
                  ${tasks.filter(t => t.priority === 'alta').length}
                </span>
              </div>
              <div class="space-y-2 max-h-56 overflow-y-auto">
                ${renderTaskList(tasks.filter(t => t.priority === 'alta'))}
              </div>
            </div>

            <!-- Q3: Urgente & Não Importante (Delegar / Rápido) -->
            <div class="p-4 rounded-2xl bg-white dark:bg-zinc-900 border-2 border-amber-200 dark:border-amber-900/60 space-y-3">
              <div class="flex items-center justify-between border-b border-amber-100 dark:border-amber-900/40 pb-2">
                <div>
                  <h4 class="text-xs font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                    <span class="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                    3. DELEGAR / RÁPIDO (Urgente, Baixo Impacto)
                  </h4>
                  <p class="text-[10px] text-zinc-400">Interrupções, e-mails pontuais, pedidos soltos</p>
                </div>
                <span class="text-[10px] font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-700 px-2 py-0.5 rounded-full">
                  ${tasks.filter(t => t.priority === 'media').length}
                </span>
              </div>
              <div class="space-y-2 max-h-56 overflow-y-auto">
                ${renderTaskList(tasks.filter(t => t.priority === 'media'))}
              </div>
            </div>

            <!-- Q4: Não Urgente & Não Importante (Eliminar) -->
            <div class="p-4 rounded-2xl bg-white dark:bg-zinc-900 border-2 border-zinc-200 dark:border-zinc-800 space-y-3">
              <div class="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-2">
                <div>
                  <h4 class="text-xs font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                    <span class="w-2.5 h-2.5 rounded-full bg-zinc-400"></span>
                    4. ELIMINAR / BACKLOG (Baixo Impacto)
                  </h4>
                  <p class="text-[10px] text-zinc-400">Distrações ou tarefas secundárias adiáveis</p>
                </div>
                <span class="text-[10px] font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-600 px-2 py-0.5 rounded-full">
                  ${tasks.filter(t => t.priority === 'baixa').length}
                </span>
              </div>
              <div class="space-y-2 max-h-56 overflow-y-auto">
                ${renderTaskList(tasks.filter(t => t.priority === 'baixa'))}
              </div>
            </div>
          </div>
        </div>
      `}
    </div>
  `;

  // Mode toggles
  const prioBtn = container.querySelector('#mode-priorities-btn');
  const eiseBtn = container.querySelector('#mode-eisenhower-btn');
  if (prioBtn && eiseBtn) {
    prioBtn.onclick = () => {
      routineDisplayMode = 'priorities';
      renderRoutineView(container, onNavigate);
    };
    eiseBtn.onclick = () => {
      routineDisplayMode = 'eisenhower';
      renderRoutineView(container, onNavigate);
    };
  }

  // Toggle Habit
  container.querySelectorAll('button[data-toggle-habit]').forEach(btn => {
    btn.onclick = () => {
      const id = btn.getAttribute('data-toggle-habit');
      store.toggleHabitToday(id);
      store.addXP(15, 'Hábito concluído 🔥');
      toast.success('Hábito atualizado! Mantendo a sequência 🔥 (+15 XP)');
      renderRoutineView(container, onNavigate);
    };
  });

  // Delete Habit
  container.querySelectorAll('button[data-del-habit]').forEach(btn => {
    btn.onclick = (e) => {
      e.stopPropagation();
      const id = btn.getAttribute('data-del-habit');
      if (confirm('Deseja excluir este hábito?')) {
        store.deleteHabit(id);
        toast.info('Hábito removido.');
        renderRoutineView(container, onNavigate);
      }
    };
  });

  // Toggle Task Checkbox
  container.querySelectorAll('input[data-task-toggle]').forEach(chk => {
    chk.onchange = () => {
      const id = chk.getAttribute('data-task-toggle');
      store.toggleTask(id);
      if (chk.checked) {
        store.addXP(10, 'Tarefa de rotina concluída');
        toast.success('Tarefa concluída! (+10 XP) 🎉');
      } else {
        toast.info('Tarefa reaberta.');
      }
      renderRoutineView(container, onNavigate);
    };
  });

  // Delete Task
  container.querySelectorAll('button[data-del-task]').forEach(btn => {
    btn.onclick = (e) => {
      e.stopPropagation();
      const id = btn.getAttribute('data-del-task');
      store.deleteTask(id);
      toast.info('Tarefa removida.');
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

function renderTaskList(taskList) {
  if (taskList.length === 0) {
    return `<div class="text-center py-6 text-[11px] text-zinc-400">Nenhuma tarefa nesta área</div>`;
  }
  return taskList.map(t => `
    <div class="p-2.5 rounded-xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/40 hover:bg-white dark:hover:bg-zinc-800 transition-colors flex items-center justify-between group">
      <label class="flex items-start gap-2.5 cursor-pointer flex-1">
        <input type="checkbox" data-task-toggle="${t.id}" ${t.status === 'done' ? 'checked' : ''} class="w-4 h-4 rounded text-blue-600 focus:ring-0 mt-0.5 shrink-0 cursor-pointer">
        <div class="flex-1">
          <span class="text-xs font-medium ${t.status === 'done' ? 'line-through text-zinc-400' : 'text-zinc-800 dark:text-zinc-200'}">${t.title}</span>
          <div class="text-[10px] text-zinc-400 mt-0.5">Prazo: ${formatDate(t.dueDate)}</div>
        </div>
      </label>
      <button data-del-task="${t.id}" class="opacity-0 group-hover:opacity-100 p-1 text-zinc-400 hover:text-rose-600 rounded transition-all" title="Excluir">
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
      </button>
    </div>
  `).join('');
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
        ${renderTaskList(colTasks)}
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
            <option value="urgente">Urgente (Fazer Já)</option>
            <option value="alta" selected>Alta (Planejar)</option>
            <option value="media">Média (Rápido / Delegar)</option>
            <option value="baixa">Baixa (Eliminar / Backlog)</option>
          </select>
        </div>
        <div>
          <label class="block text-xs font-medium text-zinc-600 dark:text-zinc-300 mb-1">Data Limite</label>
          <input type="date" name="dueDate" value="${new Date().toISOString().split('T')[0]}" class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs">
        </div>
      </div>
      <div class="pt-2 flex justify-end gap-2">
        <button type="submit" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors">Adicionar Tarefa (+5 XP)</button>
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
    store.addXP(5, 'Tarefa cadastrada na rotina');
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
        <input required name="name" class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs" placeholder="Ex: Estudo de Tipografia ou Treino">
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
        <button type="submit" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors">Criar Hábito (+10 XP)</button>
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
    store.addXP(10, 'Novo hábito estabelecido');
    toast.success('Novo hábito criado! Comece seu streak hoje 🔥');
    m.close();
    if (onSuccess) onSuccess();
  };
}
