import { store } from '../state/store.js';
import { toast } from '../components/Toast.js';

export function renderSettingsView(container, onNavigate) {
  const { profile, categories } = store.getState();

  container.innerHTML = `
    <div class="space-y-6 max-w-4xl">
      <!-- Header -->
      <div>
        <h2 class="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">Configurações do Sistema</h2>
        <p class="text-xs text-zinc-500">Personalize seus dados profissionais, aparência da interface e gestão de base de dados.</p>
      </div>

      <!-- Theme & Appearance Card -->
      <div class="p-6 bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl shadow-2xs space-y-4">
        <h3 class="text-sm font-bold text-zinc-900 dark:text-zinc-100">Aparência & Tema</h3>
        <p class="text-xs text-zinc-500">Alterne entre o tema Claro minimalista (off-white) e o tema Escuro sofisticado.</p>

        <div class="flex items-center gap-3 pt-1">
          <button id="theme-light-btn" class="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs font-semibold hover:border-blue-600 transition-colors">
            <svg class="w-4 h-4 text-zinc-700 dark:text-zinc-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"/></svg>
            <span>Tema Claro (Off-white)</span>
          </button>
          <button id="theme-dark-btn" class="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs font-semibold hover:border-blue-600 transition-colors">
            <svg class="w-4 h-4 text-zinc-700 dark:text-zinc-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/></svg>
            <span>Tema Escuro (80% Preto)</span>
          </button>
        </div>
      </div>

      <!-- Professional Profile Form -->
      <div class="p-6 bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl shadow-2xs space-y-4">
        <h3 class="text-sm font-bold text-zinc-900 dark:text-zinc-100">Perfil Profissional & Empresa</h3>
        <form id="settings-profile-form" class="space-y-3">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-medium text-zinc-600 dark:text-zinc-300 mb-1">Nome do Titular *</label>
              <input required name="name" value="${profile.name || ''}" class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs">
            </div>
            <div>
              <label class="block text-xs font-medium text-zinc-600 dark:text-zinc-300 mb-1">Cargo / Especialidade</label>
              <input name="role" value="${profile.role || ''}" class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs">
            </div>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-medium text-zinc-600 dark:text-zinc-300 mb-1">Empresa / Razão Social</label>
              <input name="company" value="${profile.company || ''}" class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs">
            </div>
            <div>
              <label class="block text-xs font-medium text-zinc-600 dark:text-zinc-300 mb-1">CNPJ</label>
              <input name="cnpj" value="${profile.cnpj || ''}" class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs">
            </div>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-medium text-zinc-600 dark:text-zinc-300 mb-1">E-mail Comercial</label>
              <input type="email" name="email" value="${profile.email || ''}" class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs">
            </div>
            <div>
              <label class="block text-xs font-medium text-zinc-600 dark:text-zinc-300 mb-1">Telefone / WhatsApp</label>
              <input name="phone" value="${profile.phone || ''}" class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs">
            </div>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-medium text-zinc-600 dark:text-zinc-300 mb-1">Instagram</label>
              <input name="instagram" value="${profile.instagram || ''}" class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs">
            </div>
            <div>
              <label class="block text-xs font-medium text-zinc-600 dark:text-zinc-300 mb-1">Website</label>
              <input name="website" value="${profile.website || ''}" class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs">
            </div>
          </div>
          <div class="pt-2 flex justify-end">
            <button type="submit" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors">Salvar Dados do Perfil</button>
          </div>
        </form>
      </div>

      <!-- Demo Data Management Card -->
      <div class="p-6 bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl shadow-2xs space-y-4">
        <div>
          <h3 class="text-sm font-bold text-zinc-900 dark:text-zinc-100">Gerenciamento de Dados Demonstrativos</h3>
          <p class="text-xs text-zinc-500 mt-0.5">Controle os dados fictícios carregados na primeira execução para demonstração do sistema.</p>
        </div>

        <div class="flex flex-wrap items-center gap-3 pt-2">
          <button id="reset-demo-btn" class="px-4 py-2 bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 rounded-xl text-xs font-semibold transition-colors">
            Restaurar Dados de Demonstração
          </button>
          <button id="clear-demo-btn" class="px-4 py-2 bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 rounded-xl text-xs font-semibold transition-colors">
            Limpar Dados de Demonstração
          </button>
        </div>
      </div>
    </div>
  `;

  // Profile Save
  container.querySelector('#settings-profile-form').onsubmit = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    store.updateProfile({
      name: fd.get('name'),
      role: fd.get('role'),
      company: fd.get('company'),
      cnpj: fd.get('cnpj'),
      email: fd.get('email'),
      phone: fd.get('phone'),
      instagram: fd.get('instagram'),
      website: fd.get('website')
    });
    toast.success('Perfil atualizado com sucesso!');
  };

  // Theme Toggles
  container.querySelector('#theme-light-btn').onclick = () => {
    store.setTheme('light');
    toast.info('Tema Claro ativado.');
  };
  container.querySelector('#theme-dark-btn').onclick = () => {
    store.setTheme('dark');
    toast.info('Tema Escuro ativado.');
  };

  // Reset Demo
  container.querySelector('#reset-demo-btn').onclick = () => {
    if (confirm('Deseja restaurar todos os dados de demonstração originais?')) {
      store.resetDemoData();
      toast.success('Dados de demonstração restaurados com sucesso!');
      if (onNavigate) onNavigate('dashboard');
    }
  };

  // Clear Demo
  container.querySelector('#clear-demo-btn').onclick = () => {
    if (confirm('Atenção: deseja limpar todos os dados de demonstração da base?')) {
      store.clearAllData();
      toast.warning('Base de dados limpa. O sistema está pronto para uso real!');
      if (onNavigate) onNavigate('dashboard');
    }
  };
}
