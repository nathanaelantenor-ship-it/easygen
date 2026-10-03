import { store } from '../state/store.js';
import { modal } from '../components/Modal.js';
import { toast } from '../components/Toast.js';
import { formatDate } from '../utils/formatters.js';
import { renderExportButtonHtml, bindExportButton } from '../components/ExportMenu.js';

let agendaViewMode = 'month'; // 'month' | 'week' | 'biweek'
let currentYear = 2026;
let currentMonth = 9; // 0-indexed: 9 = Outubro

const eventTypeConfig = {
  reuniao: { label: 'Reunião com Cliente', color: 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800', dot: 'bg-blue-600' },
  apresentacao: { label: 'Apresentação / Pitch', color: 'bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200 dark:border-purple-800', dot: 'bg-purple-600' },
  foco: { label: 'Foco Criativo', color: 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800', dot: 'bg-amber-500' },
  gravacao: { label: 'Gravação / Alinhamento', color: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800', dot: 'bg-emerald-600' },
  pessoal: { label: 'Pessoal & Pausa', color: 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-800', dot: 'bg-rose-500' }
};

export function renderAgendaView(container, onNavigate) {
  const { events = [], clients = [], projects = [] } = store.getState();

  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  container.innerHTML = `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div class="flex items-center gap-3">
            <h2 class="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">Agenda & Reuniões</h2>
            <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Google Calendar Conectado
            </span>
          </div>
          <p class="text-xs text-zinc-500 mt-1">Compromissos, alinhamentos com clientes, blocos de foco criativo e sincronização bidirecional.</p>
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <!-- Google Calendar Sync Button -->
          <button id="agenda-google-sync-btn" class="flex items-center gap-1.5 px-3 py-1.5 border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-750 rounded-xl text-xs font-medium text-zinc-700 dark:text-zinc-300 transition-colors shadow-2xs">
            <svg class="w-4 h-4 text-blue-600" viewBox="0 0 24 24" fill="currentColor"><path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/></svg>
            <span>Google Sync</span>
          </button>

          <!-- View Mode Toggle -->
          <div class="flex items-center p-1 bg-zinc-100 dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700">
            <button id="agenda-view-month" class="px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${agendaViewMode === 'month' ? 'bg-white dark:bg-zinc-900 text-blue-600 shadow-2xs' : 'text-zinc-500'}">Mês</button>
            <button id="agenda-view-week" class="px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${agendaViewMode === 'week' ? 'bg-white dark:bg-zinc-900 text-blue-600 shadow-2xs' : 'text-zinc-500'}">Semana</button>
            <button id="agenda-view-biweek" class="px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${agendaViewMode === 'biweek' ? 'bg-white dark:bg-zinc-900 text-blue-600 shadow-2xs' : 'text-zinc-500'}">Quinzenal</button>
          </div>

          ${renderExportButtonHtml('agenda-export-dropdown')}

          <button id="agenda-new-btn" class="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition-colors shadow-xs">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
            <span>Novo Evento</span>
          </button>
        </div>
      </div>

      <!-- Month Navigation Bar -->
      <div class="flex items-center justify-between p-3.5 bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl shadow-2xs">
        <div class="flex items-center gap-3">
          <button id="prev-month-btn" class="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
            <svg class="w-4 h-4 text-zinc-600 dark:text-zinc-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
          </button>
          <span class="text-sm font-bold text-zinc-900 dark:text-zinc-100">
            ${monthNames[currentMonth]} ${currentYear}
          </span>
          <button id="next-month-btn" class="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
            <svg class="w-4 h-4 text-zinc-600 dark:text-zinc-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
          </button>
        </div>

        <div class="flex items-center gap-2">
          <!-- Tipos Legenda rápida -->
          <div class="hidden lg:flex items-center gap-3 text-[11px] text-zinc-500 mr-2">
            <span class="flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-blue-600"></span> Reunião</span>
            <span class="flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-purple-600"></span> Apresentação</span>
            <span class="flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-amber-500"></span> Foco</span>
            <span class="flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-emerald-600"></span> Gravação</span>
          </div>
          <button id="today-btn" class="px-3 py-1 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg text-xs font-semibold text-zinc-700 dark:text-zinc-300 transition-colors">Hoje</button>
        </div>
      </div>

      <!-- Main Calendar Area -->
      ${agendaViewMode === 'month' ? `
        <!-- Month View -->
        <div class="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-2xs">
          <!-- Weekday Headers -->
          <div class="grid grid-cols-7 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-800/60 text-center text-xs font-semibold py-2.5 text-zinc-500">
            <div>Dom</div><div>Seg</div><div>Ter</div><div>Qua</div><div>Qui</div><div>Sex</div><div>Sáb</div>
          </div>

          <!-- Days Cells -->
          <div class="grid grid-cols-7 divide-x divide-y divide-zinc-100 dark:divide-zinc-800 text-xs">
            ${renderCalendarDays(currentYear, currentMonth, events)}
          </div>
        </div>
      ` : agendaViewMode === 'week' ? `
        <!-- Week View -->
        ${renderWeekView(currentYear, currentMonth, events)}
      ` : `
        <!-- Biweek / Quinzenal View -->
        ${renderBiweekView(currentYear, currentMonth, events)}
      `}
    </div>
  `;

  // Attach Navigation & Action Events
  const prevBtn = container.querySelector('#prev-month-btn');
  if (prevBtn) {
    prevBtn.onclick = () => {
      currentMonth--;
      if (currentMonth < 0) { currentMonth = 11; currentYear--; }
      renderAgendaView(container, onNavigate);
    };
  }
  const nextBtn = container.querySelector('#next-month-btn');
  if (nextBtn) {
    nextBtn.onclick = () => {
      currentMonth++;
      if (currentMonth > 11) { currentMonth = 0; currentYear++; }
      renderAgendaView(container, onNavigate);
    };
  }
  const todayBtn = container.querySelector('#today-btn');
  if (todayBtn) {
    todayBtn.onclick = () => {
      currentYear = 2026;
      currentMonth = 9;
      renderAgendaView(container, onNavigate);
    };
  }

  // View modes
  container.querySelector('#agenda-view-month').onclick = () => {
    agendaViewMode = 'month';
    renderAgendaView(container, onNavigate);
  };
  container.querySelector('#agenda-view-week').onclick = () => {
    agendaViewMode = 'week';
    renderAgendaView(container, onNavigate);
  };
  container.querySelector('#agenda-view-biweek').onclick = () => {
    agendaViewMode = 'biweek';
    renderAgendaView(container, onNavigate);
  };

  // Google Sync Modal
  container.querySelector('#agenda-google-sync-btn').onclick = () => {
    openGoogleCalendarModal();
  };

  // New Event
  container.querySelector('#agenda-new-btn').onclick = () => {
    openCreateEventModal(() => renderAgendaView(container, onNavigate));
  };

  // Universal Export Handler
  bindExportButton(container, 'agenda-export-dropdown', () => {
    const headers = ['Título', 'Data', 'Horário Início', 'Horário Fim', 'Tipo', 'Cliente', 'Local / Link'];
    const rows = events.map(e => [
      e.title || '',
      formatDate(e.date),
      e.startTime || '-',
      e.endTime || '-',
      eventTypeConfig[e.type]?.label || e.type || 'Geral',
      e.clientName || '-',
      e.location || e.meetUrl || '-'
    ]);

    const summary = [
      { label: 'Total de Compromissos', value: events.length },
      { label: 'Reuniões com Clientes', value: events.filter(e => e.type === 'reuniao').length },
      { label: 'Apresentações & Pitches', value: events.filter(e => e.type === 'apresentacao').length },
      { label: 'Blocos de Foco', value: events.filter(e => e.type === 'foco').length }
    ];

    return {
      filename: `agenda_compromissos_${new Date().toISOString().split('T')[0]}`,
      title: 'Agenda de Compromissos & Reuniões',
      headers,
      rows,
      summary,
      filters: `Total de Eventos: ${events.length}`
    };
  });

  // Click on date cell to add event
  container.querySelectorAll('.cal-day-cell').forEach(cell => {
    cell.onclick = (e) => {
      if (e.target.closest('.event-pill')) return;
      const dateStr = cell.getAttribute('data-date');
      openCreateEventModal(() => renderAgendaView(container, onNavigate), dateStr);
    };
  });

  // Click on event pill
  container.querySelectorAll('.event-pill').forEach(pill => {
    pill.onclick = (e) => {
      e.stopPropagation();
      const id = pill.getAttribute('data-event-id');
      const evt = events.find(e => e.id === id);
      if (!evt) return;
      openEventDetailsModal(evt, () => renderAgendaView(container, onNavigate));
    };
  });
}

function renderCalendarDays(year, month, events) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  let html = '';

  for (let i = 0; i < firstDay; i++) {
    html += `<div class="min-h-[100px] p-2 bg-zinc-50/40 dark:bg-zinc-950/20 text-zinc-300 dark:text-zinc-700"></div>`;
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const dayStr = String(d).padStart(2, '0');
    const monthStr = String(month + 1).padStart(2, '0');
    const dateKey = `${year}-${monthStr}-${dayStr}`;
    const dayEvents = events.filter(e => e.date === dateKey);
    const isToday = d === 2 && month === 9 && year === 2026;

    html += `
      <div data-date="${dateKey}" class="cal-day-cell min-h-[105px] p-2.5 hover:bg-blue-50/20 dark:hover:bg-blue-950/20 cursor-pointer transition-colors flex flex-col justify-between group">
        <div class="flex items-center justify-between mb-1.5">
          <span class="text-xs font-bold ${isToday ? 'w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center' : 'text-zinc-700 dark:text-zinc-300 group-hover:text-blue-600'}">
            ${d}
          </span>
          ${isToday ? '<span class="text-[9px] font-bold text-blue-600 bg-blue-50 dark:bg-blue-950 px-1.5 py-0.2 rounded border border-blue-200 dark:border-blue-800">HOJE</span>' : ''}
        </div>

        <div class="space-y-1.5 overflow-y-auto max-h-24">
          ${dayEvents.map(evt => {
            const conf = eventTypeConfig[evt.type || 'reuniao'] || eventTypeConfig.reuniao;
            return `
              <div data-event-id="${evt.id}" class="event-pill px-2 py-1 ${conf.color} rounded-lg text-[10px] truncate font-semibold border transition-all flex items-center gap-1.5 hover:scale-[1.02]">
                <span class="w-1.5 h-1.5 rounded-full ${conf.dot} shrink-0"></span>
                <span class="font-mono text-[9px]">${evt.startTime}</span>
                <span class="truncate">${evt.title}</span>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }

  return html;
}

function renderWeekView(year, month, events) {
  // 7 days around 2nd of October
  const days = [
    { name: 'Segunda', date: `${year}-10-05`, day: 5 },
    { name: 'Terça', date: `${year}-10-06`, day: 6 },
    { name: 'Quarta', date: `${year}-10-07`, day: 7 },
    { name: 'Quinta', date: `${year}-10-08`, day: 8 },
    { name: 'Sexta', date: `${year}-10-02`, day: 2, isToday: true },
    { name: 'Sábado', date: `${year}-10-03`, day: 3 },
    { name: 'Domingo', date: `${year}-10-04`, day: 4 }
  ];

  return `
    <div class="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-2xs">
      <div class="grid grid-cols-1 md:grid-cols-7 divide-y md:divide-y-0 md:divide-x divide-zinc-200 dark:divide-zinc-800 min-h-[420px]">
        ${days.map(d => {
          const dayEvents = events.filter(e => e.date === d.date);
          return `
            <div data-date="${d.date}" class="cal-day-cell p-3 space-y-3 flex flex-col justify-between hover:bg-zinc-50/50 dark:hover:bg-zinc-800/40 transition-colors">
              <div class="flex md:flex-col items-center md:items-start justify-between border-b border-zinc-100 dark:border-zinc-800 pb-2">
                <span class="text-xs font-semibold text-zinc-500">${d.name}</span>
                <div class="flex items-center gap-1.5 mt-1">
                  <span class="text-sm font-bold ${d.isToday ? 'w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs' : 'text-zinc-900 dark:text-zinc-100'}">${d.day}</span>
                  ${d.isToday ? '<span class="text-[9px] font-bold text-blue-600 uppercase">Hoje</span>' : ''}
                </div>
              </div>

              <div class="space-y-2 flex-1 pt-1">
                ${dayEvents.length === 0 ? `
                  <div class="text-[11px] text-zinc-400 py-4 text-center">Livre</div>
                ` : dayEvents.map(evt => {
                  const conf = eventTypeConfig[evt.type || 'reuniao'] || eventTypeConfig.reuniao;
                  return `
                    <div data-event-id="${evt.id}" class="event-pill p-2 rounded-xl border ${conf.color} text-xs space-y-1 hover:shadow-xs transition-all cursor-pointer">
                      <div class="font-bold truncate text-[11px]">${evt.title}</div>
                      <div class="text-[10px] text-zinc-500 flex items-center gap-1 font-mono">
                        <svg class="w-3 h-3 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                        ${evt.startTime} - ${evt.endTime}
                      </div>
                      ${evt.clientName ? `<div class="text-[10px] text-zinc-600 dark:text-zinc-400 truncate">👤 ${evt.clientName}</div>` : ''}
                    </div>
                  `;
                }).join('')}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

function renderBiweekView(year, month, events) {
  // 14 days list / timeline view
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const biweekDays = [];
  for (let i = 1; i <= 15; i++) {
    const dStr = String(i).padStart(2, '0');
    const mStr = String(month + 1).padStart(2, '0');
    biweekDays.push({
      day: i,
      date: `${year}-${mStr}-${dStr}`,
      isToday: i === 2 && month === 9 && year === 2026
    });
  }

  return `
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
      ${biweekDays.map(d => {
        const dayEvents = events.filter(e => e.date === d.date);
        return `
          <div data-date="${d.date}" class="cal-day-cell p-4 rounded-2xl bg-white dark:bg-zinc-900 border ${d.isToday ? 'border-blue-600 ring-2 ring-blue-500/20' : 'border-zinc-200/80 dark:border-zinc-800'} space-y-3 shadow-2xs hover:border-blue-400 transition-all cursor-pointer">
            <div class="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-2">
              <div class="flex items-center gap-2">
                <span class="text-sm font-bold ${d.isToday ? 'text-blue-600' : 'text-zinc-900 dark:text-zinc-100'}">Dia ${d.day}</span>
                ${d.isToday ? '<span class="text-[9px] font-bold text-white bg-blue-600 px-2 py-0.5 rounded-full">HOJE</span>' : ''}
              </div>
              <span class="text-xs text-zinc-400">${dayEvents.length} compromisso${dayEvents.length === 1 ? '' : 's'}</span>
            </div>

            <div class="space-y-1.5">
              ${dayEvents.length === 0 ? `
                <div class="text-[11px] text-zinc-400 py-2">Nenhum evento agendado</div>
              ` : dayEvents.map(evt => {
                const conf = eventTypeConfig[evt.type || 'reuniao'] || eventTypeConfig.reuniao;
                return `
                  <div data-event-id="${evt.id}" class="event-pill p-2 rounded-xl border ${conf.color} text-xs flex items-center justify-between hover:scale-[1.01] transition-transform">
                    <div class="truncate mr-2">
                      <div class="font-bold text-[11px] truncate">${evt.title}</div>
                      ${evt.clientName ? `<div class="text-[10px] text-zinc-500 truncate">${evt.clientName}</div>` : ''}
                    </div>
                    <span class="text-[10px] font-mono font-semibold shrink-0">${evt.startTime}</span>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

function openEventDetailsModal(evt, onSuccess) {
  const conf = eventTypeConfig[evt.type || 'reuniao'] || eventTypeConfig.reuniao;

  const content = `
    <div class="space-y-4">
      <div class="flex items-center gap-2">
        <span class="px-2.5 py-1 rounded-lg text-xs font-semibold border ${conf.color}">
          ${conf.label}
        </span>
        ${evt.syncedWithGoogle !== false ? `
          <span class="text-[10px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-medium bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
            <svg class="w-3 h-3" viewBox="0 0 24 24" fill="currentColor"><path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/></svg>
            Sincronizado Google
          </span>
        ` : ''}
      </div>

      <div class="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-2xl border border-zinc-200 dark:border-zinc-700 space-y-2 text-xs">
        <div class="flex items-center justify-between">
          <span class="text-zinc-500">Data:</span>
          <span class="font-bold text-zinc-900 dark:text-zinc-100">${formatDate(evt.date)}</span>
        </div>
        <div class="flex items-center justify-between">
          <span class="text-zinc-500">Horário:</span>
          <span class="font-mono font-semibold text-zinc-800 dark:text-zinc-200">${evt.startTime} às ${evt.endTime}</span>
        </div>
        <div class="flex items-center justify-between">
          <span class="text-zinc-500">Local / Plataforma:</span>
          <span class="font-medium text-blue-600">${evt.location || 'Google Meet'}</span>
        </div>
        ${evt.clientName ? `
          <div class="flex items-center justify-between">
            <span class="text-zinc-500">Cliente Vinculado:</span>
            <span class="font-semibold text-zinc-800 dark:text-zinc-200">${evt.clientName}</span>
          </div>
        ` : ''}
        ${evt.projectName ? `
          <div class="flex items-center justify-between">
            <span class="text-zinc-500">Projeto:</span>
            <span class="font-medium text-zinc-700 dark:text-zinc-300">${evt.projectName}</span>
          </div>
        ` : ''}
        ${evt.participants ? `
          <div class="flex items-center justify-between">
            <span class="text-zinc-500">Participantes:</span>
            <span class="text-zinc-700 dark:text-zinc-300">${evt.participants}</span>
          </div>
        ` : ''}
      </div>

      ${evt.description || evt.notes ? `
        <div class="p-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl text-xs text-zinc-700 dark:text-zinc-300">
          <strong class="block text-zinc-900 dark:text-zinc-100 mb-1">Notas da Pauta:</strong>
          ${evt.description || evt.notes}
        </div>
      ` : ''}

      <div class="flex items-center justify-between pt-2">
        <button id="del-evt-modal-btn" class="px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors">
          Excluir Evento
        </button>
        <button id="open-meet-btn" class="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors flex items-center gap-1.5">
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
          Abrir Sala Virtual
        </button>
      </div>
    </div>
  `;

  const m = modal.open({
    title: evt.title,
    content,
    size: 'md'
  });

  const delBtn = m.panel.querySelector('#del-evt-modal-btn');
  if (delBtn) {
    delBtn.onclick = () => {
      if (confirm(`Deseja excluir "${evt.title}" da agenda?`)) {
        store.deleteEvent(evt.id);
        toast.info('Evento removido.');
        m.close();
        if (onSuccess) onSuccess();
      }
    };
  }

  const meetBtn = m.panel.querySelector('#open-meet-btn');
  if (meetBtn) {
    meetBtn.onclick = () => {
      window.open('https://meet.google.com/new', '_blank');
    };
  }
}

function openGoogleCalendarModal() {
  const content = `
    <div class="space-y-4">
      <div class="flex items-center gap-3 p-4 rounded-2xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800">
        <div class="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
          <svg class="w-6 h-6" viewBox="0 0 24 24" fill="currentColor"><path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/></svg>
        </div>
        <div>
          <h4 class="text-sm font-bold text-zinc-900 dark:text-zinc-100">Google Calendar Sync</h4>
          <p class="text-xs text-zinc-500 dark:text-zinc-400">Integração nativa preparada para sincronização contínua com seu calendário.</p>
        </div>
      </div>

      <div class="p-3.5 bg-zinc-50 dark:bg-zinc-800 rounded-xl space-y-2.5 text-xs">
        <div class="flex items-center justify-between">
          <span class="text-zinc-500">Conta Conectada:</span>
          <span class="font-bold text-zinc-800 dark:text-zinc-200">contato@estudiocriativo.com.br</span>
        </div>
        <div class="flex items-center justify-between">
          <span class="text-zinc-500">Última Sincronização:</span>
          <span class="font-mono text-zinc-700 dark:text-zinc-300">Hoje às 16:30</span>
        </div>
        <div class="flex items-center justify-between">
          <span class="text-zinc-500">Status da API:</span>
          <span class="font-bold text-emerald-600 flex items-center gap-1">
            <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
            Online & Pronto
          </span>
        </div>
      </div>

      <div class="space-y-2">
        <label class="flex items-center justify-between p-3 rounded-xl border border-zinc-200 dark:border-zinc-700 cursor-pointer">
          <div>
            <div class="text-xs font-bold text-zinc-800 dark:text-zinc-200">Sincronização Bidirecional</div>
            <div class="text-[11px] text-zinc-400">Atualizar eventos modificados no Google e no APP TESTE</div>
          </div>
          <input type="checkbox" checked class="w-4 h-4 text-blue-600 rounded" />
        </label>

        <label class="flex items-center justify-between p-3 rounded-xl border border-zinc-200 dark:border-zinc-700 cursor-pointer">
          <div>
            <div class="text-xs font-bold text-zinc-800 dark:text-zinc-200">Criar link do Meet automaticamente</div>
            <div class="text-[11px] text-zinc-400">Gera sala virtual para novas reuniões com clientes</div>
          </div>
          <input type="checkbox" checked class="w-4 h-4 text-blue-600 rounded" />
        </label>
      </div>

      <div class="pt-2 flex justify-between items-center">
        <button id="btn-export-ical" class="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1">
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
          Exportar Calendário (.ics)
        </button>
        <button id="btn-run-sync" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition-all shadow-xs flex items-center gap-1.5">
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
          Sincronizar Agora
        </button>
      </div>
    </div>
  `;

  const m = modal.open({
    title: 'Configurações de Sincronização Google Calendar',
    content,
    size: 'md'
  });

  m.panel.querySelector('#btn-run-sync').onclick = () => {
    toast.info('Sincronizando com Google Calendar...');
    setTimeout(() => {
      toast.success('Calendário perfeitamente atualizado!');
      store.addXP(10, 'Sincronização com Google Calendar executada');
      m.close();
    }, 800);
  };

  m.panel.querySelector('#btn-export-ical').onclick = () => {
    const events = store.getState().events || [];
    let icsContent = "BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//APP TESTE//Gestao Criativa//PT\n";
    events.forEach(e => {
      icsContent += `BEGIN:VEVENT\nSUMMARY:${e.title}\nDTSTART:${(e.date || '20261002').replace(/-/g, '')}T${(e.startTime || '10:00').replace(':', '')}00\nDTEND:${(e.date || '20261002').replace(/-/g, '')}T${(e.endTime || '11:00').replace(':', '')}00\nDESCRIPTION:${e.description || e.notes || ''}\nLOCATION:${e.location || 'Google Meet'}\nEND:VEVENT\n`;
    });
    icsContent += "END:VCALENDAR";

    const blob = new Blob([icsContent], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = "agenda_app_teste.ics";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success('Arquivo .ics gerado com sucesso!');
  };
}

function openCreateEventModal(onSuccess, defaultDate = null) {
  const { clients = [], projects = [] } = store.getState();

  const content = `
    <form id="evt-create-modal-form" class="space-y-3.5">
      <div>
        <label class="block text-xs font-medium text-zinc-600 dark:text-zinc-300 mb-1">Título do Compromisso *</label>
        <input required name="title" class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs text-zinc-900 dark:text-zinc-100" placeholder="Ex: Apresentação de Identidade Visual">
      </div>

      <div class="grid grid-cols-2 gap-2">
        <div>
          <label class="block text-xs font-medium text-zinc-600 dark:text-zinc-300 mb-1">Tipo de Evento</label>
          <select name="type" class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs text-zinc-800 dark:text-zinc-200">
            <option value="reuniao">Reunião com Cliente</option>
            <option value="apresentacao">Apresentação / Pitch</option>
            <option value="foco">Foco Criativo</option>
            <option value="gravacao">Gravação / Alinhamento</option>
            <option value="pessoal">Pessoal / Pausa</option>
          </select>
        </div>

        <div>
          <label class="block text-xs font-medium text-zinc-600 dark:text-zinc-300 mb-1">Data *</label>
          <input required type="date" name="date" value="${defaultDate || '2026-10-02'}" class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs text-zinc-800 dark:text-zinc-200">
        </div>
      </div>

      <div class="grid grid-cols-2 gap-2">
        <div>
          <label class="block text-xs font-medium text-zinc-600 dark:text-zinc-300 mb-1">Horário de Início</label>
          <input type="time" name="startTime" value="14:00" class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs text-zinc-800 dark:text-zinc-200">
        </div>
        <div>
          <label class="block text-xs font-medium text-zinc-600 dark:text-zinc-300 mb-1">Horário de Término</label>
          <input type="time" name="endTime" value="15:00" class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs text-zinc-800 dark:text-zinc-200">
        </div>
      </div>

      <div class="grid grid-cols-2 gap-2">
        <div>
          <label class="block text-xs font-medium text-zinc-600 dark:text-zinc-300 mb-1">Cliente Vinculado</label>
          <select name="clientId" class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs text-zinc-800 dark:text-zinc-200">
            <option value="">Nenhum (Compromisso Geral)</option>
            ${clients.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
          </select>
        </div>
        <div>
          <label class="block text-xs font-medium text-zinc-600 dark:text-zinc-300 mb-1">Projeto Vinculado</label>
          <select name="projectId" class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs text-zinc-800 dark:text-zinc-200">
            <option value="">Nenhum</option>
            ${projects.map(p => `<option value="${p.id}">${p.title}</option>`).join('')}
          </select>
        </div>
      </div>

      <div>
        <label class="block text-xs font-medium text-zinc-600 dark:text-zinc-300 mb-1">Localização ou Link da Sala</label>
        <input name="location" value="Google Meet" class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs text-zinc-800 dark:text-zinc-200">
      </div>

      <div>
        <label class="block text-xs font-medium text-zinc-600 dark:text-zinc-300 mb-1">Pauta / Observações</label>
        <textarea name="description" rows="2" class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs text-zinc-800 dark:text-zinc-200 resize-none" placeholder="Tópicos que serão abordados..."></textarea>
      </div>

      <div class="pt-2 flex justify-end gap-2">
        <button type="submit" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition-colors shadow-xs">Agendar Compromisso</button>
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
    const clientId = fd.get('clientId');
    const projectId = fd.get('projectId');
    const selectedClient = clients.find(c => c.id === clientId);
    const selectedProj = projects.find(p => p.id === projectId);

    store.addEvent({
      title: fd.get('title'),
      type: fd.get('type'),
      date: fd.get('date'),
      startTime: fd.get('startTime'),
      endTime: fd.get('endTime'),
      location: fd.get('location'),
      clientId: clientId || null,
      clientName: selectedClient ? selectedClient.name : null,
      projectId: projectId || null,
      projectName: selectedProj ? selectedProj.title : null,
      description: fd.get('description'),
      syncedWithGoogle: true
    });

    store.addXP(15, 'Novo evento registrado na Agenda');
    toast.success('Evento agendado com sucesso!');
    m.close();
    if (onSuccess) onSuccess();
  };
}
