import { getSupabase } from '../config/supabase.js';

const SESSION_KEY = 'APP_TESTE_AUTH_SESSION_V2';
const USERS_REGISTRY_KEY = 'APP_TESTE_REGISTERED_USERS_V2';

// Helper de hash SHA-256 nativo do navegador para segurança de senhas
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
    this.initSupabaseListener();
  }

  loadSession() {
    try {
      const stored = localStorage.getItem(SESSION_KEY);
      if (stored) {
        return JSON.parse(stored);
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
    if (supabase) {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session && session.user) {
          this.currentUser = {
            id: session.user.id,
            email: session.user.email,
            name: session.user.user_metadata?.name || session.user.email.split('@')[0],
            avatar: session.user.user_metadata?.avatar_url || '',
            provider: session.user.app_metadata?.provider || 'email',
            createdAt: session.user.created_at
          };
          this.saveSession(this.currentUser);
        }

        supabase.auth.onAuthStateChange((event, session) => {
          if (session && session.user) {
            this.currentUser = {
              id: session.user.id,
              email: session.user.email,
              name: session.user.user_metadata?.name || session.user.email.split('@')[0],
              avatar: session.user.user_metadata?.avatar_url || '',
              provider: session.user.app_metadata?.provider || 'email',
              createdAt: session.user.created_at
            };
            this.saveSession(this.currentUser);
          } else if (event === 'SIGNED_OUT') {
            this.saveSession(null);
          }
        });
      } catch (e) {
        console.warn('Erro ao conectar listener do Supabase:', e);
      }
    }
  }

  getCurrentUser() {
    return this.currentUser;
  }

  isAuthenticated() {
    return !!this.currentUser && !!this.currentUser.id;
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
            createdAt: data.user.created_at || new Date().toISOString()
          };
          this.saveSession(user);
          return user;
        }
      } catch (err) {
        console.warn('Supabase signUp falhou, utilizando registro seguro local:', err.message);
      }
    }

    // Registro seguro local com criptografia SHA-256
    const users = this.getRegisteredUsers();
    const existing = users.find(u => u.email.toLowerCase() === cleanEmail);
    if (existing) {
      throw new Error('Este email já possui uma conta cadastrada. Faça login.');
    }

    const salt = crypto.randomUUID();
    const passwordHash = await hashPassword(password, salt);
    const userId = 'usr_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);

    const newUser = {
      id: userId,
      email: cleanEmail,
      name: name.trim() || cleanEmail.split('@')[0],
      avatar: '',
      businessType,
      teamSize,
      passwordHash,
      salt,
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
            createdAt: data.user.created_at
          };
          this.saveSession(user);
          return user;
        }
      } catch (err) {
        console.warn('Supabase signIn falhou, tentando registro local:', err.message);
      }
    }

    // Validação com hash SHA-256
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
      id: user.id,
      email: user.email,
      name: user.name,
      avatar: user.avatar,
      businessType: user.businessType,
      teamSize: user.teamSize,
      createdAt: user.createdAt
    };

    this.saveSession(sessionUser);
    return sessionUser;
  }

  async signInWithGoogle() {
    const supabase = getSupabase();
    if (supabase) {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });
      if (error) throw new Error('Não foi possível entrar com o Google: ' + error.message);
      return data;
    }

    // Simulação OAuth interativa quando Supabase não configurado
    const googleEmail = prompt('Digite seu e-mail do Google (Conta Google):', 'usuario@gmail.com');
    if (!googleEmail || !googleEmail.includes('@')) {
      throw new Error('Login com Google cancelado.');
    }

    const cleanEmail = googleEmail.toLowerCase().trim();
    const users = this.getRegisteredUsers();
    let user = users.find(u => u.email.toLowerCase() === cleanEmail);

    if (!user) {
      // Primeiro acesso com Google -> cria conta
      user = {
        id: 'usr_g_' + Date.now(),
        email: cleanEmail,
        name: cleanEmail.split('@')[0].replace('.', ' ').replace(/\b\w/g, l => l.toUpperCase()),
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces',
        businessType: 'Criativo',
        provider: 'google',
        createdAt: new Date().toISOString()
      };
      users.push(user);
      this.saveRegisteredUsers(users);
    }

    const sessionUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      avatar: user.avatar,
      businessType: user.businessType,
      createdAt: user.createdAt
    };

    this.saveSession(sessionUser);
    return sessionUser;
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
    const supabase = getSupabase();
    if (supabase) {
      try {
        await supabase.auth.signOut();
      } catch (e) {
        console.warn('Erro ao sair do Supabase:', e);
      }
    }
    this.saveSession(null);
  }

  updateProfileData(updates) {
    if (!this.currentUser) return;
    this.currentUser = { ...this.currentUser, ...updates };
    this.saveSession(this.currentUser);

    // Atualiza também no registro local
    const users = this.getRegisteredUsers();
    const idx = users.findIndex(u => u.id === this.currentUser.id);
    if (idx !== -1) {
      users[idx] = { ...users[idx], ...updates };
      this.saveRegisteredUsers(users);
    }
  }
}

export const auth = new AuthService();
