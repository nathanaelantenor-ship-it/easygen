import { store } from '../state/store.js';
import { modal } from '../components/Modal.js';
import { toast } from '../components/Toast.js';
import { formatDate } from '../utils/formatters.js';

let agendaViewMode = 'month'; // week | biweek | month
let currentYear = 2026;
let currentMonth = 9; // 0-indexed: 9 = Outubro

export function renderAgendaView(container, onNavigate) {
  const { events, clients, projects } = store.getState();

  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  container.innerHTML = `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 class="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">Agenda & Reuniões</h2>
          <p class="text-xs text-zinc-500">Compromissos, alinhamentos com clientes e sincronização com Google Calendar.</p>
        </div>

        <div class="flex items-center gap-2">
          <!-- Google Calendar Sync Simulation -->
          <button id="agenda-google-sync-btn" class="flex items-center gap-1.5 px-3 py-1.5 border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-850 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-xl text-xs font-medium text-zinc-700 dark:text-zinc-300 transition-colors shadow-2xs">
            <svg class="w-4 h-4 text-blue-600" viewBox="0 0 24 24" fill="currentColor"><path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/></svg>
            <span>Sincronizar Google Calendar</span>
          </button>

          <!-- View Mode Toggle -->
          <div class="flex items-center p-1 bg-zinc-100 dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700">
            <button id="agenda-view-month" class="px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${agendaViewMode === 'month' ? 'bg-white dark:bg-zinc-700 text-blue-600 shadow-2xs' : 'text-zinc-500'}">Mês</button>
            <button id="agenda-view-week" class="px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${agendaViewMode === 'week' ? 'bg-white dark:bg-zinc-700 text-blue-600 shadow-2xs' : 'text-zinc-500'}">Semana</button>
          </div>

          <button id="agenda-new-btn" class="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition-colors shadow-xs">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
            <span>Novo Evento</span>
          </button>
        </div>
      </div>

      <!-- Month Navigation Bar -->
      <div class="flex items-center justify-between p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xs">
        <div class="flex items-center gap-3">
          <button id="prev-month-btn" class="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-750 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
            <svg class="w-4 h-4 text-zinc-600 dark:text-zinc-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
          </button>
          <span class="text-sm font-bold text-zinc-900 dark:text-zinc-100">
            ${monthNames[currentMonth]} ${currentYear}
          </span>
          <button id="next-month-btn" class="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-750 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
            <svg class="w-4 h-4 text-zinc-600 dark:text-zinc-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
          </button>
        </div>
        <button id="today-btn" class="px-3 py-1 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 rounded-lg text-xs font-medium text-zinc-700 dark:text-zinc-300 transition-colors">Hoje</button>
      </div>

      <!-- Calendar Grid -->
      <div class="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-2xs">
        <!-- Weekday Headers -->
        <div class="grid grid-cols-7 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-850 text-center text-xs font-semibold py-2.5 text-zinc-500">
          <div>Dom</div><div>Seg</div><div>Ter</div><div>Qua</div><div>Qui</div><div>Sex</div><div>Sáb</div>
        </div>

        <!-- Days Cells -->
        <div class="grid grid-cols-7 divide-x divide-y divide-zinc-100 dark:divide-zinc-800 text-xs">
          ${renderCalendarDays(currentYear, currentMonth, events)}
        </div>
      </div>
    </div>
  `;

  // Month navigation
  container.querySelector('#prev-month-btn').onclick = () => {
    currentMonth--;
    if (currentMonth < 0) { currentMonth = 11; currentYear--; }
    renderAgendaView(container, onNavigate);
  };
  container.querySelector('#next-month-btn').onclick = () => {
    currentMonth++;
    if (currentMonth > 11) { currentMonth = 0; currentYear++; }
    renderAgendaView(container, onNavigate);
  };
  container.querySelector('#today-btn').onclick = () => {
    currentYear = 2026;
    currentMonth = 9;
    renderAgendaView(container, onNavigate);
  };

  // Google Calendar Sync
  container.querySelector('#agenda-google-sync-btn').onclick = () => {
    toast.info('Conectando ao Google Calendar API...');
    setTimeout(() => {
      toast.success('Eventos sincronizados perfeitamente com o Google Calendar!');
    }, 900);
  };

  // New Event
  container.querySelector('#agenda-new-btn').onclick = () => {
    openCreateEventModal(() => renderAgendaView(container, onNavigate));
  };

  // Click on date cell
  container.querySelectorAll('.cal-day-cell').forEach(cell => {
    cell.onclick = (e) => {
      if (e.target.closest('.event-pill')) return;
      const dateStr = cell.getAttribute('data-date');
      openCreateEventModal(() => renderAgendaView(container, onNavigate), dateStr);
    };
  });

  // Click on event pill
  container.querySelectorAll('.event-pill').forEach(pill => {
    pill.onclick = () => {
      const id = pill.getAttribute('data-event-id');
      const evt = events.find(e => e.id === id);
      if (!evt) return;
      modal.open({
        title: evt.title,
        content: `
          <div class="space-y-3 text-xs">
            <div class="p-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl space-y-1">
              <div><b>Data:</b> ${formatDate(evt.date)}</div>
              <div><b>Horário:</b> ${evt.startTime} às ${evt.endTime}</div>
              <div><b>Local / Link:</b> ${evt.location || 'Google Meet'}</div>
              <div><b>Participantes:</b> ${evt.participants || 'Nathan'}</div>
            </div>
            ${evt.notes ? `<p class="p-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl text-zinc-600 dark:text-zinc-300">${evt.notes}</p>` : ''}
            <div class="pt-2 flex justify-between">
              <button id="del-evt-btn" class="text-rose-600 hover:underline">Excluir Evento</button>
            </div>
          </div>
        `,
        size: 'sm'
      });
      setTimeout(() => {
        const delBtn = document.getElementById('del-evt-btn');
        if (delBtn) {
          delBtn.onclick = () => {
            store.deleteEvent(evt.id);
            toast.info('Evento excluído.');
            modal.close();
            renderAgendaView(container, onNavigate);
          };
        }
      }, 50);
    };
  });
}

function renderCalendarDays(year, month, events) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  let html = '';

  // Blank slots for days before 1st
  for (let i = 0; i < firstDay; i++) {
    html += `<div class="min-h-[90px] sm:min-h-[110px] p-2 bg-zinc-50/40 dark:bg-zinc-950/20 text-zinc-300 dark:text-zinc-700"></div>`;
  }

  // Days of month
  for (let d = 1; d <= daysInMonth; d++) {
    const dayStr = String(d).padStart(2, '0');
    const monthStr = String(month + 1).padStart(2, '0');
    const dateKey = `${year}-${monthStr}-${dayStr}`;
    const dayEvents = events.filter(e => e.date === dateKey);
    const isToday = d === 2 && month === 9 && year === 2026;

    html += `
      <div data-date="${dateKey}" class="cal-day-cell min-h-[90px] sm:min-h-[110px] p-2 hover:bg-blue-50/30 dark:hover:bg-blue-950/20 cursor-pointer transition-colors flex flex-col justify-between">
        <div class="flex items-center justify-between mb-1">
          <span class="text-xs font-semibold ${isToday ? 'w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center' : 'text-zinc-700 dark:text-zinc-300'}">
            ${d}
          </span>
          ${isToday ? '<span class="text-[9px] font-bold text-blue-600">HOJE</span>' : ''}
        </div>

        <div class="space-y-1 overflow-y-auto max-h-16">
          ${dayEvents.map(evt => `
            <div data-event-id="${evt.id}" class="event-pill px-2 py-1 bg-blue-50 dark:bg-blue-950/60 border border-blue-200/60 dark:border-blue-800 text-blue-700 dark:text-blue-300 rounded-md text-[10px] truncate font-medium hover:scale-[1.02] transition-transform">
              <b>${evt.startTime}</b> ${evt.title}
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  return html;
}

function openCreateEventModal(onSuccess, defaultDate = null) {
  const content = `
    <form id="evt-create-modal-form" class="space-y-3">
      <div>
        <label class="block text-xs font-medium text-zinc-600 dark:text-zinc-300 mb-1">Título do Evento / Reunião *</label>
        <input required name="title" class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs" placeholder="Ex: Apresentação de Identidade Visual">
      </div>
      <div class="grid grid-cols-3 gap-2">
        <div>
          <label class="block text-xs font-medium text-zinc-600 dark:text-zinc-300 mb-1">Data *</label>
          <input required type="date" name="date" value="${defaultDate || '2026-10-02'}" class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs">
        </div>
        <div>
          <label class="block text-xs font-medium text-zinc-600 dark:text-zinc-300 mb-1">Início</label>
          <input type="time" name="startTime" value="14:00" class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs">
        </div>
        <div>
          <label class="block text-xs font-medium text-zinc-600 dark:text-zinc-300 mb-1">Fim</label>
          <input type="time" name="endTime" value="15:00" class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs">
        </div>
      </div>
      <div>
        <label class="block text-xs font-medium text-zinc-600 dark:text-zinc-300 mb-1">Localização ou Link</label>
        <input name="location" value="Google Meet" class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs">
      </div>
      <div>
        <label class="block text-xs font-medium text-zinc-600 dark:text-zinc-300 mb-1">Participantes</label>
        <input name="participants" placeholder="Ex: Nathan, Laura" class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs">
      </div>
      <div class="pt-2 flex justify-end gap-2">
        <button type="submit" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors">Agendar Evento</button>
      </div>
    </form>
  `;

  const m = modal.open({
    title: 'Novo Compromisso na Agenda',
    content,
    size: 'md'
  });

  m.panel.querySelector('#evt-create-modal-form').onsubmit = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    store.addEvent({
      title: fd.get('title'),
      date: fd.get('date'),
      startTime: fd.get('startTime'),
      endTime: fd.get('endTime'),
      location: fd.get('location'),
      participants: fd.get('participants')
    });
    toast.success('Evento agendado com sucesso!');
    m.close();
    if (onSuccess) onSuccess();
  };
}
