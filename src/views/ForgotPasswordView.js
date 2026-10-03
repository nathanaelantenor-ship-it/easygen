import { auth } from '../services/authService.js';
import { toast } from '../components/Toast.js';

export function renderForgotPasswordView(container, onNavigate) {
  container.innerHTML = `
    <div class="min-h-screen flex items-center justify-center p-4 bg-[#F8F9FA] dark:bg-[#18181B] text-zinc-900 dark:text-zinc-100 select-none">
      <div class="w-full max-w-md space-y-6">
        <!-- Logo & Header -->
        <div class="text-center space-y-2">
          <div class="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-blue-600 text-white font-black text-lg shadow-md mb-2">
            AT
          </div>
          <h1 class="text-2xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100">APP TESTE</h1>
          <p class="text-xs text-zinc-500 dark:text-zinc-400">Recuperação de Acesso</p>
        </div>

        <!-- Card -->
        <div class="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200/80 dark:border-zinc-800 shadow-sm p-6 sm:p-8 space-y-6">
          <div class="space-y-1">
            <h2 class="text-lg font-bold text-zinc-900 dark:text-zinc-100">Esqueceu sua senha?</h2>
            <p class="text-xs text-zinc-400">Informe o e-mail cadastrado na sua conta para redefinir sua credencial.</p>
          </div>

          <!-- Alert de Sucesso -->
          <div id="forgot-success-alert" class="hidden p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs space-y-1">
            <div class="font-bold flex items-center gap-1.5">
              <svg class="w-4 h-4 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
              <span>Instruções enviadas!</span>
            </div>
            <p class="text-[11px] text-emerald-700 dark:text-emerald-400">Se o e-mail informado estiver cadastrado, você receberá um link para criar uma nova senha.</p>
          </div>

          <!-- Alert de Erro -->
          <div id="forgot-error-alert" class="hidden p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
            <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            <span id="forgot-error-text">Não foi possível processar o pedido.</span>
          </div>

          <!-- Form -->
          <form id="form-forgot" class="space-y-4">
            <div>
              <label class="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">Seu E-mail Cadastrado</label>
              <input 
                type="email" 
                name="email" 
                required 
                placeholder="seu@email.com" 
                class="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/50 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all"
              />
            </div>

            <button 
              type="submit" 
              id="btn-submit-forgot" 
              class="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-98 text-white text-xs font-bold shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              <span>Enviar Link de Recuperação</span>
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
            </button>
          </form>

          <!-- Voltar -->
          <div class="text-center pt-2 border-t border-zinc-100 dark:border-zinc-800/60">
            <a href="#login" class="text-xs font-bold text-blue-600 hover:underline inline-flex items-center gap-1.5">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
              <span>Voltar para o Login</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  `;

  const form = container.querySelector('#form-forgot');
  const errorAlert = container.querySelector('#forgot-error-alert');
  const errorText = container.querySelector('#forgot-error-text');
  const successAlert = container.querySelector('#forgot-success-alert');
  const submitBtn = container.querySelector('#btn-submit-forgot');

  form.onsubmit = async (e) => {
    e.preventDefault();
    errorAlert.classList.add('hidden');
    successAlert.classList.add('hidden');

    const fd = new FormData(form);
    const email = fd.get('email');

    submitBtn.disabled = true;
    submitBtn.classList.add('opacity-75');
    submitBtn.innerHTML = '<span>Processando...</span>';

    try {
      await auth.resetPassword(email);
      successAlert.classList.remove('hidden');
      form.reset();
      submitBtn.disabled = false;
      submitBtn.classList.remove('opacity-75');
      submitBtn.innerHTML = '<span>Enviar Novamente</span>';
    } catch (err) {
      errorText.textContent = err.message || 'Erro ao solicitar recuperação.';
      errorAlert.classList.remove('hidden');
      submitBtn.disabled = false;
      submitBtn.classList.remove('opacity-75');
      submitBtn.innerHTML = '<span>Enviar Link de Recuperação</span>';
    }
  };
}
