import { auth } from '../services/authService.js';
import { toast } from '../components/Toast.js';

export function renderLoginView(container, onNavigate) {
  container.innerHTML = `
    <div class="min-h-screen flex items-center justify-center p-4 bg-[#F8F9FA] dark:bg-[#18181B] text-zinc-900 dark:text-zinc-100 select-none">
      <div class="w-full max-w-md space-y-6">
        <!-- Logo & Header -->
        <div class="text-center space-y-2">
          <div class="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-blue-600 text-white font-black text-lg shadow-md mb-2">
            AT
          </div>
          <h1 class="text-2xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100">APP TESTE</h1>
          <p class="text-xs text-zinc-500 dark:text-zinc-400">Sistema Operacional para Negócios Criativos</p>
        </div>

        <!-- Auth Card -->
        <div class="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200/80 dark:border-zinc-800 shadow-sm p-6 sm:p-8 space-y-6">
          <div class="space-y-1">
            <h2 class="text-lg font-bold text-zinc-900 dark:text-zinc-100">Bem-vindo de volta</h2>
            <p class="text-xs text-zinc-400">Entre na sua conta para acessar seus dados e projetos.</p>
          </div>

          <!-- Erro Alert (oculto por padrão) -->
          <div id="auth-error-alert" class="hidden p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
            <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            <span id="auth-error-text">Email ou senha incorretos.</span>
          </div>

          <!-- Botão Google OAuth Real -->
          <button 
            id="btn-google-login" 
            class="w-full py-3 px-4 rounded-xl border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-xs font-bold text-zinc-700 dark:text-zinc-200 transition-all flex items-center justify-center gap-3 shadow-2xs active:scale-98 cursor-pointer"
          >
            <svg class="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
            </svg>
            <span>Continuar com Google</span>
          </button>

          <!-- Divisor -->
          <div class="relative flex items-center justify-center">
            <div class="border-t border-zinc-200 dark:border-zinc-800 w-full"></div>
            <span class="bg-white dark:bg-zinc-900 px-3 text-[11px] text-zinc-400 uppercase font-medium tracking-wider absolute">ou com e-mail</span>
          </div>

          <!-- Formulário Email + Senha -->
          <form id="form-login" class="space-y-4">
            <div>
              <label class="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">E-mail</label>
              <input 
                type="email" 
                name="email" 
                required 
                placeholder="seu@email.com" 
                class="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/50 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all"
              />
            </div>

            <div>
              <div class="flex items-center justify-between mb-1.5">
                <label class="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Senha</label>
                <a href="#forgot-password" class="text-[11px] font-semibold text-blue-600 hover:underline">Esqueci minha senha</a>
              </div>
              <input 
                type="password" 
                name="password" 
                required 
                placeholder="••••••••" 
                class="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/50 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all"
              />
            </div>

            <button 
              type="submit" 
              id="btn-submit-login" 
              class="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-98 text-white text-xs font-bold shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              <span>Entrar</span>
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
            </button>
          </form>

          <!-- Link para Cadastro -->
          <div class="text-center pt-2 border-t border-zinc-100 dark:border-zinc-800/60">
            <span class="text-xs text-zinc-400">Não possui uma conta?</span>
            <a href="#register" class="text-xs font-bold text-blue-600 hover:underline ml-1">Criar conta</a>
          </div>
        </div>

        <!-- Footer -->
        <p class="text-center text-[11px] text-zinc-400">
          APP TESTE V2.1 • Seus dados 100% isolados, criptografados e protegidos.
        </p>
      </div>
    </div>
  `;

  const form = container.querySelector('#form-login');
  const errorAlert = container.querySelector('#auth-error-alert');
  const errorText = container.querySelector('#auth-error-text');
  const submitBtn = container.querySelector('#btn-submit-login');
  const googleBtn = container.querySelector('#btn-google-login');

  const showError = (msg) => {
    errorText.textContent = msg;
    errorAlert.classList.remove('hidden');
  };

  form.onsubmit = async (e) => {
    e.preventDefault();
    errorAlert.classList.add('hidden');
    submitBtn.disabled = true;
    submitBtn.classList.add('opacity-75');
    submitBtn.innerHTML = '<span>Entrando...</span>';

    const fd = new FormData(form);
    const email = fd.get('email');
    const password = fd.get('password');

    try {
      await auth.signIn({ email, password });
      toast.success('Login realizado com sucesso!');
      if (onNavigate) onNavigate('dashboard');
    } catch (err) {
      showError(err.message || 'Email ou senha incorretos.');
      submitBtn.disabled = false;
      submitBtn.classList.remove('opacity-75');
      submitBtn.innerHTML = '<span>Entrar</span><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>';
    }
  };

  googleBtn.onclick = async () => {
    try {
      await auth.signInWithGoogle();
      toast.success('Autenticado com sucesso via Google!');
      if (onNavigate) onNavigate('dashboard');
    } catch (err) {
      showError(err.message || 'Não foi possível entrar com o Google.');
    }
  };
}
