import { modal } from './Modal.js';
import { store } from '../state/store.js';
import { auth } from '../services/authService.js';

export function renderMobileNav(currentModule) {
  const pendingInbox = (store.getState().inbox || []).filter(i => i.status === 'pending').length;

  return `
    <nav class="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-around px-2 z-40 select-none">
      <!-- 1. Início -->
      <button data-nav="dashboard" class="flex flex-col items-center justify-center w-14 h-full text-[10px] font-medium transition-colors ${currentModule === 'dashboard' ? 'text-blue-600 font-bold' : 'text-zinc-500'}">
        <svg class="w-5 h-5 mb-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"/></svg>
        <span>Início</span>
      </button>

      <!-- 2. Inbox -->
      <button data-nav="inbox" class="relative flex flex-col items-center justify-center w-14 h-full text-[10px] font-medium transition-colors ${currentModule === 'inbox' ? 'text-blue-600 font-bold' : 'text-zinc-500'}">
        <svg class="w-5 h-5 mb-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"/></svg>
        <span>Inbox</span>
        ${pendingInbox > 0 ? `
          <span class="absolute top-1.5 right-2 w-4 h-4 bg-blue-600 text-white rounded-full text-[9px] font-bold flex items-center justify-center">
            ${pendingInbox}
          </span>
        ` : ''}
      </button>

      <!-- 3. Center Floating Quick Action Button -->
      <div class="relative -top-4 flex items-center justify-center">
        <button id="mobile-fab-btn" class="w-12 h-12 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg flex items-center justify-center active:scale-95 transition-transform ring-4 ring-white dark:ring-zinc-900 cursor-pointer">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
        </button>
      </div>

      <!-- 4. Entregas -->
      <button data-nav="entregas" class="flex flex-col items-center justify-center w-14 h-full text-[10px] font-medium transition-colors ${currentModule === 'entregas' ? 'text-blue-600 font-bold' : 'text-zinc-500'}">
        <svg class="w-5 h-5 mb-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/></svg>
        <span>Entregas</span>
      </button>

      <!-- 5. Mais -->
      <button id="mobile-more-btn" class="flex flex-col items-center justify-center w-14 h-full text-[10px] font-medium transition-colors text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200">
        <svg class="w-5 h-5 mb-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/></svg>
        <span>Mais</span>
      </button>
    </nav>
  `;
}

export function openMobileMenuDrawer(currentModule, onNavigate) {
  const allModules = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'inbox', label: 'Inbox & Captura Rápida' },
    { id: 'crm', label: 'CRM (Leads & Funil)' },
    { id: 'clients', label: 'Clientes & Inteligência' },
    { id: 'documents', label: 'Central de Documentos' },
    { id: 'services', label: 'Catálogo de Serviços' },
    { id: 'proposals', label: 'Propostas Comerciais' },
    { id: 'projects', label: 'Gestão de Projetos' },
    { id: 'entregas', label: 'Entregas & Operações (Kanban)' },
    { id: 'finance', label: 'Financeiro (PJ & PF)' },
    { id: 'agenda', label: 'Agenda & Reuniões' },
    { id: 'routine', label: 'Rotina, Tarefas & Hábitos' },
    { id: 'goals', label: 'Metas Empresariais & Pessoais' },
    { id: 'reports', label: 'Relatórios Analíticos' },
    { id: 'settings', label: 'Configurações' }
  ];

  const content = `
    <div class="space-y-1">
      ${allModules.map(m => `
        <button data-mod="${m.id}" class="w-full text-left p-3 rounded-xl text-xs font-medium flex items-center justify-between transition-colors ${currentModule === m.id ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 font-bold' : 'hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300'}">
          <span>${m.label}</span>
          <svg class="w-4 h-4 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
        </button>
      `).join('')}

      <div class="pt-3 mt-3 border-t border-zinc-100 dark:border-zinc-800">
        <button id="mobile-drawer-logout" class="w-full text-left p-3 rounded-xl text-xs font-semibold flex items-center justify-between text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer">
          <div class="flex items-center gap-2">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
            <span>Sair da conta</span>
          </div>
        </button>
      </div>
    </div>
  `;

  const drawer = modal.open({
    title: 'Todos os Módulos',
    content,
    isDrawer: true
  });

  drawer.panel.querySelectorAll('button[data-mod]').forEach(btn => {
    btn.onclick = () => {
      const mod = btn.getAttribute('data-mod');
      drawer.close();
      if (onNavigate) onNavigate(mod);
    };
  });

  const logoutBtn = drawer.panel.querySelector('#mobile-drawer-logout');
  if (logoutBtn) {
    logoutBtn.onclick = () => {
      drawer.close();
      modal.confirm({
        title: 'Sair da conta?',
        message: 'Você precisará informar seu e-mail e senha para acessar novamente seus dados.',
        confirmText: 'Sair',
        confirmColor: 'bg-rose-600 hover:bg-rose-700',
        onConfirm: async () => {
          await auth.signOut();
          if (onNavigate) onNavigate('login');
        }
      });
    };
  }
}
