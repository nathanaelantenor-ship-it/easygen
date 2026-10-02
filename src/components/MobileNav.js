import { modal } from './Modal.js';

export function renderMobileNav(currentModule) {
  return `
    <nav class="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-around px-2 z-40">
      <button data-nav="dashboard" class="flex flex-col items-center justify-center w-14 h-full text-[10px] font-medium transition-colors ${currentModule === 'dashboard' ? 'text-blue-600 font-bold' : 'text-zinc-500'}">
        <svg class="w-5 h-5 mb-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"/></svg>
        <span>Início</span>
      </button>

      <button data-nav="crm" class="flex flex-col items-center justify-center w-14 h-full text-[10px] font-medium transition-colors ${currentModule === 'crm' ? 'text-blue-600 font-bold' : 'text-zinc-500'}">
        <svg class="w-5 h-5 mb-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
        <span>CRM</span>
      </button>

      <!-- Center Floating Quick Action Button -->
      <div class="relative -top-4 flex items-center justify-center">
        <button id="mobile-fab-btn" class="w-12 h-12 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg flex items-center justify-center active:scale-95 transition-transform ring-4 ring-white dark:ring-zinc-900">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
        </button>
      </div>

      <button data-nav="projects" class="flex flex-col items-center justify-center w-14 h-full text-[10px] font-medium transition-colors ${currentModule === 'projects' ? 'text-blue-600 font-bold' : 'text-zinc-500'}">
        <svg class="w-5 h-5 mb-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
        <span>Projetos</span>
      </button>

      <button data-nav="finance" class="flex flex-col items-center justify-center w-14 h-full text-[10px] font-medium transition-colors ${currentModule === 'finance' ? 'text-blue-600 font-bold' : 'text-zinc-500'}">
        <svg class="w-5 h-5 mb-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
        <span>Financeiro</span>
      </button>
    </nav>
  `;
}

export function openMobileMenuDrawer(currentModule, onNavigate) {
  const allModules = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'crm', label: 'CRM (Leads & Funil)' },
    { id: 'clients', label: 'Clientes & Inteligência' },
    { id: 'documents', label: 'Central de Documentos' },
    { id: 'services', label: 'Catálogo de Serviços' },
    { id: 'proposals', label: 'Propostas Comerciais' },
    { id: 'projects', label: 'Gestão de Projetos' },
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
}
