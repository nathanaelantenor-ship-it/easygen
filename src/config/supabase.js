// Configuração avançada e persistente do Supabase Client para APP TESTE
const STORAGE_CONFIG_KEY = 'APP_TESTE_SUPABASE_CONFIG';

const DEFAULT_CONFIG = {
  url: window.__SUPABASE_URL__ || '',
  anonKey: window.__SUPABASE_ANON_KEY__ || ''
};

let cachedConfig = null;
let supabaseInstance = null;
let configFetchPromise = null;

export function getSupabaseConfig() {
  if (cachedConfig) return cachedConfig;
  try {
    const saved = localStorage.getItem(STORAGE_CONFIG_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      cachedConfig = { ...DEFAULT_CONFIG, ...parsed };
      return cachedConfig;
    }
  } catch (e) {
    console.error('Erro ao ler config do Supabase:', e);
  }
  cachedConfig = { ...DEFAULT_CONFIG };
  return cachedConfig;
}

export async function fetchRemoteSupabaseConfig() {
  if (configFetchPromise) return configFetchPromise;

  configFetchPromise = (async () => {
    const current = getSupabaseConfig();
    if (current.url && current.anonKey) {
      return current;
    }

    try {
      const res = await fetch('/api/supabase-config', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data && data.configured && data.url && data.anonKey) {
          saveSupabaseConfig(data.url, data.anonKey, false);
          return { url: data.url, anonKey: data.anonKey };
        }
      }
    } catch (err) {
      // Falha silenciosa se rodando sem backend local
      console.debug('Endpoint /api/supabase-config não disponível no ambiente atual.');
    }
    return getSupabaseConfig();
  })();

  return configFetchPromise;
}

export function saveSupabaseConfig(url, anonKey, notify = true) {
  try {
    const cleanUrl = (url || '').trim();
    const cleanKey = (anonKey || '').trim();
    cachedConfig = { url: cleanUrl, anonKey: cleanKey };
    localStorage.setItem(STORAGE_CONFIG_KEY, JSON.stringify(cachedConfig));
    supabaseInstance = null; // Força re-inicialização do client
    if (cleanUrl && cleanKey) {
      getSupabase();
    }
    if (notify) {
      window.dispatchEvent(new CustomEvent('supabase_config_updated', { detail: cachedConfig }));
    }
    return true;
  } catch (e) {
    console.error('Erro ao salvar config do Supabase:', e);
    return false;
  }
}

export function isSupabaseConfigured() {
  const config = getSupabaseConfig();
  return Boolean(config.url && config.anonKey);
}

export function getSupabase() {
  if (supabaseInstance) return supabaseInstance;

  const config = getSupabaseConfig();
  if (config.url && config.anonKey && window.supabase && typeof window.supabase.createClient === 'function') {
    try {
      supabaseInstance = window.supabase.createClient(config.url, config.anonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
          storageKey: 'APP_TESTE_SB_AUTH_SESSION'
        },
        global: {
          headers: {
            'x-client-info': 'app-teste-v2'
          }
        }
      });
      return supabaseInstance;
    } catch (err) {
      console.warn('Não foi possível inicializar Supabase Client:', err);
    }
  }
  return null;
}

export async function testSupabaseConnection(url, anonKey) {
  try {
    const testUrl = url || getSupabaseConfig().url;
    const testKey = anonKey || getSupabaseConfig().anonKey;
    if (!testUrl || !testKey) {
      return { success: false, message: 'URL e Anon Key são obrigatórias.' };
    }
    if (!window.supabase || typeof window.supabase.createClient !== 'function') {
      return { success: false, message: 'Biblioteca Supabase JS não carregada na página.' };
    }

    const testClient = window.supabase.createClient(testUrl, testKey, {
      auth: { persistSession: false }
    });

    const { error } = await testClient.from('profiles').select('id', { count: 'exact', head: true });
    if (error && error.code !== 'PGRST116') {
      // Se deu erro de RLS mas conectou, significa que a conexão foi bem-sucedida!
      if (error.message && (error.message.includes('security') || error.message.includes('RLS') || error.code === '42501')) {
        return { success: true, message: 'Conexão estabelecida com sucesso! (RLS Ativo)' };
      }
      return { success: false, message: error.message || 'Erro ao conectar ao Supabase.' };
    }

    return { success: true, message: 'Conexão com o Supabase validada com sucesso!' };
  } catch (err) {
    return { success: false, message: err.message || 'Falha na comunicação de rede com o Supabase.' };
  }
}

// Inicia busca remota de configuração em segundo plano imediatamente
fetchRemoteSupabaseConfig().then(() => {
  getSupabase();
});
