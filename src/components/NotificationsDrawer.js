import { store } from '../state/store.js';
import { modal } from './Modal.js';

export function openNotificationsDrawer(onNavigate) {
  const { notifications } = store.getState();
  const unreadCount = notifications.filter(n => !n.read).length;

  const content = `
    <div class="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800 text-xs">
      <span class="text-zinc-500">${unreadCount} não lidas</span>
      <button id="mark-all-read-btn" class="text-blue-600 hover:underline font-medium">Marcar todas como lidas</button>
    </div>
    <div class="space-y-3 pt-2">
      ${notifications.length === 0 ? `
        <div class="text-center py-12 text-zinc-400">
          <p>Nenhuma notificação no momento.</p>
        </div>
      ` : notifications.map(n => `
        <div data-id="${n.id}" data-link="${n.link}" class="notif-item p-3 rounded-xl border ${n.read ? 'bg-zinc-50/50 dark:bg-zinc-900/40 border-zinc-100 dark:border-zinc-800/80 opacity-70' : 'bg-white dark:bg-zinc-850 border-blue-100 dark:border-blue-900/40 shadow-xs'} cursor-pointer hover:border-blue-300 dark:hover:border-blue-700 transition-all">
          <div class="flex items-start justify-between gap-2">
            <div class="flex items-center gap-2">
              ${!n.read ? '<span class="w-2 h-2 rounded-full bg-blue-600 shrink-0"></span>' : ''}
              <h4 class="text-xs font-semibold text-zinc-900 dark:text-zinc-100">${n.title}</h4>
            </div>
            <span class="text-[10px] text-zinc-400">${n.createdAt}</span>
          </div>
          <p class="text-xs text-zinc-600 dark:text-zinc-400 mt-1 pl-4">${n.message}</p>
        </div>
      `).join('')}
    </div>
  `;

  const drawer = modal.open({
    title: 'Central de Notificações & Alertas',
    content,
    isDrawer: true
  });

  const markAllBtn = drawer.panel.querySelector('#mark-all-read-btn');
  if (markAllBtn) {
    markAllBtn.onclick = () => {
      store.markAllNotificationsAsRead();
      drawer.close();
      openNotificationsDrawer(onNavigate);
    };
  }

  drawer.panel.querySelectorAll('.notif-item').forEach(item => {
    item.onclick = () => {
      const id = item.getAttribute('data-id');
      const link = item.getAttribute('data-link');
      store.markNotificationAsRead(id);
      drawer.close();
      if (link && onNavigate) {
        onNavigate(link);
      }
    };
  });
}
