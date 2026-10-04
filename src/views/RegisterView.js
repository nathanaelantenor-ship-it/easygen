import { auth } from '../services/authService.js';
import { toast } from '../components/Toast.js';

export function renderRegisterView(container, onNavigate) {
  container.innerHTML = `
    <div class="min-h-screen flex items-center justify-center p-4 bg-[#F8F9FA] dark:bg-[#18181B] text-zinc-900 dark:text-zinc-100 select-none">
      <div class="w-full max-w-md space-y-6">
        <!-- Logo & Header -->
        <div class="text-center space-y-2">
          <div class="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-blue-600 text-white font-black text-lg shadow-md mb-2">
            AT
          </div>
          <h1 class="text-2xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100">APP TESTE</h1>
          <p class="text-xs text-zinc-500 dark:text-zinc-400">Crie seu espaço de trabalho individual</p>
        </div>

        <!-- Register Card -->
        <div class="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200/80 dark:border-zinc-800 shadow-sm p-6 sm:p-8 space-y-6">
          <div class="space-y-1">
            <h2 class="text-lg font-bold text-zinc-900 dark:text-zinc-100">Criar sua conta</h2>
            <p class="text-xs text-zinc-400">Configure seu perfil exclusivo com banco de dados próprio e isolado.</p>
          </div>

          <!-- Erro Alert -->
          <div id="register-error-alert" class="hidden p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
            <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            <span id="register-error-text">Não foi possível criar sua conta.</span>
          </div>

          <!-- Botão Google OAuth -->
          <button 
            id="btn-google-register" 
            class="w-full py-3 px-4 rounded-xl border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-xs font-bold text-zinc-700 dark:text-zinc-200 transition-all flex items-center justify-center gap-3 shadow-2xs active:scale-98 cursor-pointer"
          >
            <svg class="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
            </svg>
            <span>Cadastrar com Google</span>
          </button>

          <!-- Divisor -->
          <div class="relative flex items-center justify-center">
            <div class="border-t border-zinc-200 dark:border-zinc-800 w-full"></div>
            <span class="bg-white dark:bg-zinc-900 px-3 text-[11px] text-zinc-400 uppercase font-medium tracking-wider absolute">ou com seu e-mail</span>
          </div>

          <!-- Formulário -->
          <form id="form-register" class="space-y-3.5">
            <div>
              <label class="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Seu Nome Completo *</label>
              <input 
                type="text" 
                name="name" 
                required 
                placeholder="Ex: Nathan Antenor" 
                class="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/50 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all"
              />
            </div>

            <div>
              <label class="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">E-mail Corporativo ou Pessoal *</label>
              <input 
                type="email" 
                name="email" 
                required 
                placeholder="seu@email.com" 
                class="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/50 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all"
              />
            </div>

            <div class="grid grid-cols-2 gap-2">
              <div>
                <label class="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Senha *</label>
                <input 
                  type="password" 
                  name="password" 
                  required 
                  placeholder="Min. 6 caracteres" 
                  class="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/50 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all"
                />
              </div>
              <div>
                <label class="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Confirmar Senha *</label>
                <input 
                  type="password" 
                  name="confirmPassword" 
                  required 
                  placeholder="Repita a senha" 
                  class="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/50 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all"
                />
              </div>
            </div>

            <!-- Pergunta rápida de nicho criativo -->
            <div class="pt-1">
              <label class="block text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 mb-1">Qual é o seu nicho criativo?</label>
              <select name="businessType" class="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/50 text-xs text-zinc-800 dark:text-zinc-200">
                <option value="Designer">🎨 Design & Branding</option>
                <option value="Agência">🏢 Agência Criativa</option>
                <option value="Audiovisual">🎬 Audiovisual & Motion</option>
                <option value="Social Media">📱 Social Media & Conteúdo</option>
                <option value="Desenvolvedor">💻 Desenvolvimento & Web</option>
                <option value="Freelancer">⚡ Freelancer Multi-área</option>
                <option value="Outro">✨ Outro Segmento</option>
              </select>
            </div>

            <button 
              type="submit" 
              id="btn-submit-register" 
              class="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-98 text-white text-xs font-bold shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer mt-3"
            >
              <span>Criar Conta e Começar</span>
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
            </button>
          </form>

          <!-- Link para Login -->
          <div class="text-center pt-2 border-t border-zinc-100 dark:border-zinc-800/60">
            <span class="text-xs text-zinc-400">Já possui uma conta?</span>
            <a href="#login" class="text-xs font-bold text-blue-600 hover:underline ml-1">Fazer login</a>
          </div>
        </div>

        <!-- Footer -->
        <p class="text-center text-[11px] text-zinc-400">
          Ao se cadastrar, você inicia uma conta exclusiva e protegida por criptografia.
        </p>
      </div>
    </div>
  `;

  const form = container.querySelector('#form-register');
  const errorAlert = container.querySelector('#register-error-alert');
  const errorText = container.querySelector('#register-error-text');
  const submitBtn = container.querySelector('#btn-submit-register');
  const googleBtn = container.querySelector('#btn-google-register');

  const showError = (msg) => {
    errorText.textContent = msg;
    errorAlert.classList.remove('hidden');
  };

  form.onsubmit = async (e) => {
    e.preventDefault();
    errorAlert.classList.add('hidden');

    const fd = new FormData(form);
    const name = fd.get('name');
    const email = fd.get('email');
    const password = fd.get('password');
    const confirmPassword = fd.get('confirmPassword');
    const businessType = fd.get('businessType');

    if (password !== confirmPassword) {
      showError('As senhas não coincidem. Digite a mesma senha em ambos os campos.');
      return;
    }

    submitBtn.disabled = true;
    submitBtn.classList.add('opacity-75');
    submitBtn.innerHTML = '<span>Criando seu espaço...</span>';

    try {
      await auth.signUp({ name, email, password, businessType });
      toast.success('Conta criada com sucesso! Bem-vindo ao APP TESTE.');
      if (onNavigate) onNavigate('dashboard');
    } catch (err) {
      showError(err.message || 'Não foi possível criar sua conta.');
      submitBtn.disabled = false;
      submitBtn.classList.remove('opacity-75');
      submitBtn.innerHTML = '<span>Criar Conta e Começar</span><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>';
    }
  };

  googleBtn.onclick = async () => {
    try {
      errorAlert.classList.add('hidden');
      googleBtn.disabled = true;
      googleBtn.classList.add('opacity-75');
      await auth.signInWithGoogle();
      toast.success('Conta Google conectada com sucesso!');
      if (onNavigate) onNavigate('dashboard');
    } catch (err) {
      if (err.message && !err.message.includes('cancelado')) {
        showError(err.message || 'Não foi possível cadastrar com o Google.');
      }
    } finally {
      googleBtn.disabled = false;
      googleBtn.classList.remove('opacity-75');
    }
  };
}
