// Configuração do Supabase Client para APP TESTE V2.1
const STORAGE_CONFIG_KEY = 'APP_TESTE_SUPABASE_CONFIG';

const DEFAULT_CONFIG = {
  url: window.__SUPABASE_URL__ || '',
  anonKey: window.__SUPABASE_ANON_KEY__ || ''
};

export function getSupabaseConfig() {
  try {
    const saved = localStorage.getItem(STORAGE_CONFIG_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return { ...DEFAULT_CONFIG, ...parsed };
    }
  } catch (e) {
    console.error('Erro ao ler config do Supabase:', e);
  }
  return { ...DEFAULT_CONFIG };
}

export function saveSupabaseConfig(url, anonKey) {
  try {
    localStorage.setItem(STORAGE_CONFIG_KEY, JSON.stringify({ url: url.trim(), anonKey: anonKey.trim() }));
    supabaseInstance = null; // Re-initialize
    return true;
  } catch (e) {
    console.error('Erro ao salvar config do Supabase:', e);
    return false;
  }
}

let supabaseInstance = null;

export function getSupabase() {
  if (supabaseInstance) return supabaseInstance;

  const config = getSupabaseConfig();
  if (config.url && config.anonKey && window.supabase && typeof window.supabase.createClient === 'function') {
    try {
      supabaseInstance = window.supabase.createClient(config.url, config.anonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true
        }
      });
      return supabaseInstance;
    } catch (err) {
      console.warn('Não foi possível inicializar Supabase Client:', err);
    }
  }
  return null;
}
