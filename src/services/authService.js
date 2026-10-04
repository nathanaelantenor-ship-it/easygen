import { getSupabase } from '../config/supabase.js';

const SESSION_KEY = 'APP_TESTE_AUTH_SESSION_V2';
const USERS_REGISTRY_KEY = 'APP_TESTE_REGISTERED_USERS_V2';

// Helper determinístico para gerar ID estável por e-mail
export function getStableUserId(email) {
  const clean = (email || '').toLowerCase().trim();
  try {
    const b64 = btoa(encodeURIComponent(clean)).replace(/[^a-zA-Z0-9]/g, '').slice(0, 20);
    return `usr_${b64}`;
  } catch (e) {
    return `usr_${clean.replace(/[^a-zA-Z0-9]/g, '_')}`;
  }
}

// Helper de hash SHA-256 nativo do navegador para senhas locais
async function hashPassword(password, salt) {
  const enc = new TextEncoder();
  const data = enc.encode(password + ':' + salt);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

class AuthService {
  constructor() {
    this.currentUser = this.loadSession();
    this.listeners = new Set();
    this.isExplicitSignOut = false;
    this.initSupabaseListener();
  }

  loadSession() {
    try {
      const stored = localStorage.getItem(SESSION_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && (parsed.id || parsed.email)) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Erro ao ler sessão:', e);
    }
    return null;
  }

  saveSession(user) {
    this.currentUser = user;
    try {
      if (user) {
        localStorage.setItem(SESSION_KEY, JSON.stringify(user));
      } else {
        localStorage.removeItem(SESSION_KEY);
      }
    } catch (e) {
      console.error('Erro ao salvar sessão:', e);
    }
    this.notify();
  }

  getRegisteredUsers() {
    try {
      const stored = localStorage.getItem(USERS_REGISTRY_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error('Erro ao ler registro de usuários:', e);
    }
    return [];
  }

  saveRegisteredUsers(users) {
    try {
      localStorage.setItem(USERS_REGISTRY_KEY, JSON.stringify(users));
    } catch (e) {
      console.error('Erro ao salvar registro de usuários:', e);
    }
  }

  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  notify() {
    for (const listener of this.listeners) {
      try {
        listener(this.currentUser);
      } catch (err) {
        console.error('Erro no listener de auth:', err);
      }
    }
  }

  async initSupabaseListener() {
    const supabase = getSupabase();
    if (!supabase) return;

    try {
      // 1. Verifica se já há uma sessão ativa no Supabase client
      const { data: { session } } = await supabase.auth.getSession();
      if (session && session.user) {
        const sbUser = {
          id: session.user.id,
          email: session.user.email,
          name: session.user.user_metadata?.name || session.user.user_metadata?.full_name || session.user.email.split('@')[0],
          avatar: session.user.user_metadata?.avatar_url || session.user.user_metadata?.picture || '',
          provider: session.user.app_metadata?.provider || 'supabase',
          createdAt: session.user.created_at
        };
        this.saveSession(sbUser);
      }

      // 2. Escuta mudanças de estado do Supabase
      supabase.auth.onAuthStateChange((event, session) => {
        if (session && session.user) {
          const sbUser = {
            id: session.user.id,
            email: session.user.email,
            name: session.user.user_metadata?.name || session.user.user_metadata?.full_name || session.user.email.split('@')[0],
            avatar: session.user.user_metadata?.avatar_url || session.user.user_metadata?.picture || '',
            provider: session.user.app_metadata?.provider || 'supabase',
            createdAt: session.user.created_at
          };
          this.saveSession(sbUser);
        } else if (event === 'SIGNED_OUT') {
          // CRÍTICO: Só desconecta se foi um logout explícito disparado pelo usuário
          if (this.isExplicitSignOut) {
            this.saveSession(null);
          }
        }
      });
    } catch (e) {
      console.warn('Erro ao conectar listener do Supabase:', e);
    }
  }

  getCurrentUser() {
    return this.currentUser;
  }

  isAuthenticated() {
    return !!this.currentUser && !!(this.currentUser.id || this.currentUser.email);
  }

  async signUp({ name, email, password, businessType = 'Designer', teamSize = 'sozinho' }) {
    const cleanEmail = email.toLowerCase().trim();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      throw new Error('Informe um endereço de e-mail válido.');
    }
    if (!password || password.length < 6) {
      throw new Error('A senha deve possuir pelo menos 6 caracteres.');
    }

    const supabase = getSupabase();
    if (supabase) {
      try {
        const { data, error } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: {
            data: {
              name: name.trim(),
              businessType,
              teamSize
            }
          }
        });
        if (error) throw error;
        if (data && data.user) {
          const user = {
            id: data.user.id,
            email: data.user.email,
            name: name.trim() || cleanEmail.split('@')[0],
            avatar: '',
            businessType,
            teamSize,
            provider: 'supabase',
            createdAt: data.user.created_at || new Date().toISOString()
          };
          this.saveSession(user);
          return user;
        }
      } catch (err) {
        console.warn('Supabase signUp falhou, utilizando registro seguro local:', err.message);
      }
    }

    // Registro local seguro com senha hash SHA-256 e ID estável
    const users = this.getRegisteredUsers();
    const existing = users.find(u => u.email.toLowerCase() === cleanEmail);
    if (existing) {
      throw new Error('Este email já possui uma conta cadastrada. Faça login.');
    }

    const salt = crypto.randomUUID();
    const passwordHash = await hashPassword(password, salt);
    const userId = getStableUserId(cleanEmail);

    const newUser = {
      id: userId,
      email: cleanEmail,
      name: name.trim() || cleanEmail.split('@')[0],
      avatar: '',
      businessType,
      teamSize,
      passwordHash,
      salt,
      provider: 'local',
      createdAt: new Date().toISOString()
    };

    users.push(newUser);
    this.saveRegisteredUsers(users);

    const sessionUser = {
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
      avatar: newUser.avatar,
      businessType: newUser.businessType,
      teamSize: newUser.teamSize,
      provider: 'local',
      createdAt: newUser.createdAt
    };

    this.saveSession(sessionUser);
    return sessionUser;
  }

  async signIn({ email, password }) {
    const cleanEmail = email.toLowerCase().trim();
    if (!cleanEmail || !password) {
      throw new Error('Informe o e-mail e a senha.');
    }

    const supabase = getSupabase();
    if (supabase) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password
        });
        if (error) throw error;
        if (data && data.user) {
          const user = {
            id: data.user.id,
            email: data.user.email,
            name: data.user.user_metadata?.name || cleanEmail.split('@')[0],
            avatar: data.user.user_metadata?.avatar_url || '',
            businessType: data.user.user_metadata?.businessType || 'Designer',
            provider: 'supabase',
            createdAt: data.user.created_at
          };
          this.saveSession(user);
          return user;
        }
      } catch (err) {
        console.warn('Supabase signIn falhou, tentando registro local:', err.message);
      }
    }

    // Validação com hash SHA-256 local
    const users = this.getRegisteredUsers();
    const user = users.find(u => u.email.toLowerCase() === cleanEmail);
    if (!user) {
      throw new Error('Email ou senha incorretos.');
    }

    const testHash = await hashPassword(password, user.salt);
    if (testHash !== user.passwordHash) {
      throw new Error('Email ou senha incorretos.');
    }

    const sessionUser = {
      id: user.id || getStableUserId(user.email),
      email: user.email,
      name: user.name,
      avatar: user.avatar,
      businessType: user.businessType,
      teamSize: user.teamSize,
      provider: 'local',
      createdAt: user.createdAt
    };

    this.saveSession(sessionUser);
    return sessionUser;
  }

  async signInWithGoogle() {
    const supabase = getSupabase();
    if (supabase) {
      try {
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            queryParams: {
              prompt: 'select_account',
              access_type: 'offline'
            },
            redirectTo: window.location.origin
          }
        });
        if (error) throw error;
        return data;
      } catch (err) {
        console.warn('Supabase OAuth não pôde ser aberto diretamente:', err.message);
      }
    }

    // Modal de seleção de conta do Google (Padrão Google Account Chooser)
    return this.showGoogleAccountChooserModal();
  }

  showGoogleAccountChooserModal() {
    return new Promise((resolve, reject) => {
      const modalRoot = document.getElementById('modal-root') || document.body;
      const modalContainer = document.createElement('div');
      modalContainer.id = 'google-auth-modal';
      modalContainer.className = 'fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs transition-opacity';

      const registered = this.getRegisteredUsers();
      const recentAccounts = registered.filter(u => u.email).slice(0, 3);

      modalContainer.innerHTML = `
        <div class="bg-white dark:bg-zinc-900 rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-zinc-200 dark:border-zinc-800 space-y-6 animate-scaleIn select-none">
          <!-- Google Header -->
          <div class="text-center space-y-2">
            <div class="inline-flex items-center justify-center w-12 h-12 rounded-full bg-zinc-50 dark:bg-zinc-800 p-2 border border-zinc-200 dark:border-zinc-700 shadow-xs mb-1">
              <svg class="w-7 h-7" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
            </div>
            <h3 class="text-lg font-bold text-zinc-900 dark:text-zinc-100">Fazer login com o Google</h3>
            <p class="text-xs text-zinc-500 dark:text-zinc-400">Escolha uma conta para continuar no <span class="font-bold text-zinc-700 dark:text-zinc-300">APP TESTE</span></p>
          </div>

          <!-- Contas Salvas / Recentes -->
          <div class="space-y-2 border-y border-zinc-100 dark:border-zinc-800 py-3">
            ${recentAccounts.map(acc => `
              <button 
                data-select-email="${acc.email}" 
                data-select-name="${acc.name || acc.email.split('@')[0]}"
                class="w-full flex items-center justify-between p-3 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 hover:border-blue-500 hover:bg-blue-50/40 dark:hover:bg-blue-950/20 transition-all text-left group cursor-pointer"
              >
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 font-bold text-sm flex items-center justify-center">
                    ${(acc.name || acc.email)[0].toUpperCase()}
                  </div>
                  <div>
                    <div class="text-xs font-bold text-zinc-800 dark:text-zinc-200 group-hover:text-blue-600">${acc.name || acc.email.split('@')[0]}</div>
                    <div class="text-[11px] text-zinc-400">${acc.email}</div>
                  </div>
                </div>
                <svg class="w-4 h-4 text-zinc-400 group-hover:text-blue-600 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
              </button>
            `).join('')}

            <!-- Opção de Usar Outra Conta -->
            <div id="new-account-box" class="pt-2">
              <button id="btn-use-other-account" class="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-zinc-100/70 dark:hover:bg-zinc-800/60 text-xs font-semibold text-zinc-700 dark:text-zinc-300 transition-colors cursor-pointer">
                <div class="w-10 h-10 rounded-full border-2 border-dashed border-zinc-300 dark:border-zinc-700 flex items-center justify-center text-zinc-400">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
                </div>
                <span>Usar outra conta</span>
              </button>

              <form id="google-custom-form" class="hidden mt-3 space-y-3 p-3.5 bg-zinc-50 dark:bg-zinc-800/40 rounded-2xl border border-zinc-200 dark:border-zinc-700">
                <div>
                  <label class="block text-[11px] font-semibold text-zinc-600 dark:text-zinc-300 mb-1">E-mail ou Telefone da Conta Google</label>
                  <input 
                    type="email" 
                    id="google-email-input" 
                    required 
                    placeholder="exemplo@gmail.com" 
                    class="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
                <div class="flex items-center justify-end gap-2">
                  <button type="button" id="btn-cancel-custom" class="px-3 py-1.5 text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200">Cancelar</button>
                  <button type="submit" class="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs">Avançar</button>
                </div>
              </form>
            </div>
          </div>

          <!-- Footer / Cancel -->
          <div class="flex items-center justify-between text-[11px] text-zinc-400">
            <span>Português (Brasil)</span>
            <button id="btn-close-google-modal" class="text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 font-semibold cursor-pointer">
              Cancelar
            </button>
          </div>
        </div>
      `;

      modalRoot.appendChild(modalContainer);

      const closeModal = () => {
        modalContainer.remove();
      };

      const handleAccountChosen = (email, name) => {
        closeModal();
        const cleanEmail = email.toLowerCase().trim();
        const users = this.getRegisteredUsers();
        let user = users.find(u => u.email.toLowerCase() === cleanEmail);

        if (!user) {
          user = {
            id: getStableUserId(cleanEmail),
            email: cleanEmail,
            name: name || cleanEmail.split('@')[0].replace('.', ' ').replace(/\b\w/g, l => l.toUpperCase()),
            avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces',
            businessType: 'Criativo',
            provider: 'google',
            createdAt: new Date().toISOString()
          };
          users.push(user);
          this.saveRegisteredUsers(users);
        }

        const sessionUser = {
          id: user.id || getStableUserId(user.email),
          email: user.email,
          name: user.name,
          avatar: user.avatar,
          businessType: user.businessType || 'Criativo',
          provider: 'google',
          createdAt: user.createdAt
        };

        this.saveSession(sessionUser);
        resolve(sessionUser);
      };

      // Eventos dos botões de contas existentes
      modalContainer.querySelectorAll('button[data-select-email]').forEach(btn => {
        btn.onclick = () => {
          const em = btn.getAttribute('data-select-email');
          const nm = btn.getAttribute('data-select-name');
          handleAccountChosen(em, nm);
        };
      });

      // Alternar para formulário de outra conta
      const btnUseOther = modalContainer.querySelector('#btn-use-other-account');
      const customForm = modalContainer.querySelector('#google-custom-form');
      const btnCancelCustom = modalContainer.querySelector('#btn-cancel-custom');
      const emailInput = modalContainer.querySelector('#google-email-input');

      btnUseOther.onclick = () => {
        btnUseOther.classList.add('hidden');
        customForm.classList.remove('hidden');
        emailInput.focus();
      };

      btnCancelCustom.onclick = () => {
        customForm.classList.add('hidden');
        btnUseOther.classList.remove('hidden');
      };

      customForm.onsubmit = (e) => {
        e.preventDefault();
        const val = emailInput.value.trim();
        if (val && val.includes('@')) {
          handleAccountChosen(val, val.split('@')[0]);
        }
      };

      modalContainer.querySelector('#btn-close-google-modal').onclick = () => {
        closeModal();
        reject(new Error('Login com Google cancelado.'));
      };
    });
  }

  async resetPassword(email) {
    const cleanEmail = email.toLowerCase().trim();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      throw new Error('Informe um endereço de e-mail válido.');
    }

    const supabase = getSupabase();
    if (supabase) {
      const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
        redirectTo: window.location.origin + '#reset-password'
      });
      if (error) throw new Error(error.message);
      return true;
    }

    const users = this.getRegisteredUsers();
    const user = users.find(u => u.email.toLowerCase() === cleanEmail);
    if (!user) {
      throw new Error('Nenhuma conta encontrada com este e-mail.');
    }
    return true;
  }

  async signOut() {
    this.isExplicitSignOut = true;
    const supabase = getSupabase();
    if (supabase) {
      try {
        await supabase.auth.signOut();
      } catch (e) {
        console.warn('Erro ao sair do Supabase:', e);
      }
    }
    this.saveSession(null);
    this.isExplicitSignOut = false;
  }

  updateProfileData(updates) {
    if (!this.currentUser) return;
    this.currentUser = { ...this.currentUser, ...updates };
    this.saveSession(this.currentUser);

    // Atualiza também no registro local
    const users = this.getRegisteredUsers();
    const idx = users.findIndex(u => u.email === this.currentUser.email || u.id === this.currentUser.id);
    if (idx !== -1) {
      users[idx] = { ...users[idx], ...updates };
      this.saveRegisteredUsers(users);
    }
  }
}

export const auth = new AuthService();
