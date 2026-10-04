import { store } from './state/store.js';
import { auth } from './services/authService.js';
import { renderNavbar } from './components/Navbar.js';
import { renderSidebar } from './components/Sidebar.js';
import { renderMobileNav, openMobileMenuDrawer } from './components/MobileNav.js';
import { openQuickActionsModal } from './components/QuickActionsModal.js';
import { openGlobalSearch } from './components/GlobalSearchModal.js';
import { openNotificationsDrawer } from './components/NotificationsDrawer.js';
import { modal } from './components/Modal.js';

import { renderLoginView } from './views/LoginView.js';
import { renderRegisterView } from './views/RegisterView.js';
import { renderForgotPasswordView } from './views/ForgotPasswordView.js';

import { renderDashboardView } from './views/DashboardView.js';
import { renderInboxView } from './views/InboxView.js';
import { renderCRMView } from './views/CRMView.js';
import { renderClientsView } from './views/ClientsView.js';
import { renderDocumentsView } from './views/DocumentsView.js';
import { renderServicesView } from './views/ServicesView.js';
import { renderProposalsView } from './views/ProposalsView.js';
import { renderProjectsView } from './views/ProjectsView.js';
import { renderDeliveriesView } from './views/DeliveriesView.js';
import { renderFinanceView } from './views/FinanceView.js';
import { renderAgendaView } from './views/AgendaView.js';
import { renderRoutineView } from './views/RoutineView.js';
import { renderGoalsView } from './views/GoalsView.js';
import { renderReportsView } from './views/ReportsView.js';
import { renderSettingsView } from './views/SettingsView.js';

const publicRenderers = {
  'login': renderLoginView,
  'register': renderRegisterView,
  'forgot-password': renderForgotPasswordView
};

const viewTitles = {
  'login': 'Entrar',
  'register': 'Criar Conta',
  'forgot-password': 'Recuperar Senha',
  'dashboard': 'Dashboard Geral',
  'inbox': 'Inbox & Captura Rápida',
  'crm': 'CRM & Funil Comercial',
  'clients': 'Clientes & Relacionamento',
  'documents': 'Central de Documentos',
  'services': 'Catálogo de Serviços',
  'proposals': 'Propostas Comerciais',
  'projects': 'Gestão de Projetos',
  'entregas': 'Entregas & Operações',
  'finance': 'Controle Financeiro',
  'agenda': 'Agenda & Reuniões',
  'routine': 'Rotina & Produtividade',
  'goals': 'Metas & Objetivos',
  'reports': 'Relatórios Analíticos',
  'settings': 'Configurações'
};

const protectedRenderers = {
  dashboard: renderDashboardView,
  inbox: renderInboxView,
  crm: renderCRMView,
  clients: renderClientsView,
  documents: renderDocumentsView,
  services: renderServicesView,
  proposals: renderProposalsView,
  projects: renderProjectsView,
  entregas: renderDeliveriesView,
  finance: renderFinanceView,
  agenda: renderAgendaView,
  routine: renderRoutineView,
  goals: renderGoalsView,
  reports: renderReportsView,
  settings: renderSettingsView
};

let currentModule = 'login';

export function initApp() {
  const appRoot = document.getElementById('app-root');
  if (!appRoot) return;

  function resolveRoute() {
    const hash = window.location.hash.replace('#', '').toLowerCase();
    const isAuth = auth.isAuthenticated();

    if (!isAuth) {
      if (hash === 'register' || hash === 'forgot-password') {
        return hash;
      }
      if (hash !== 'login') {
        window.location.hash = 'login';
      }
      return 'login';
    }

    if (publicRenderers[hash] || !hash) {
      if (window.location.hash !== '#dashboard') {
        window.location.hash = 'dashboard';
      }
      return 'dashboard';
    }

    if (protectedRenderers[hash]) {
      return hash;
    }

    window.location.hash = 'dashboard';
    return 'dashboard';
  }

  function renderApp() {
    const isAuth = auth.isAuthenticated();
    const route = resolveRoute();
    currentModule = route;

    if (!isAuth || publicRenderers[route]) {
      document.title = `${viewTitles[route] || 'Autenticação'} - APP TESTE`;
      const currentTheme = store.getState().profile?.theme || 'light';
      document.documentElement.setAttribute('data-theme', currentTheme);

      appRoot.innerHTML = `<div id="auth-root" class="min-h-screen"></div>`;
      const authRoot = document.getElementById('auth-root');
      const renderer = publicRenderers[route] || renderLoginView;
      renderer(authRoot, navigate);
      return;
    }

    const savedTheme = store.getState().profile?.theme || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);

    renderShell();
  }

  function renderShell() {
    document.title = `${viewTitles[currentModule] || 'Gestão Inteligente'} - APP TESTE`;

    appRoot.innerHTML = `
      <div class="flex h-screen overflow-hidden">
        <!-- Desktop Sidebar -->
        <div id="sidebar-container" class="hidden md:block">
          ${renderSidebar(currentModule, navigate)}
        </div>

        <!-- Main Column -->
        <div class="flex-1 flex flex-col min-w-0 overflow-hidden">
          <!-- Top Navbar -->
          <div id="navbar-container">
            ${renderNavbar(viewTitles[currentModule] || 'APP TESTE')}
          </div>

          <!-- View Content Container -->
          <main id="main-view-container" class="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 pb-24 md:pb-8">
            <!-- Dynamic view injected here -->
          </main>

          <!-- Mobile Bottom Navigation -->
          <div id="mobile-nav-container">
            ${renderMobileNav(currentModule)}
          </div>
        </div>
      </div>
    `;

    attachGlobalEvents();
    renderCurrentView();
  }

  function renderCurrentView() {
    const mainViewContainer = document.getElementById('main-view-container');
    const renderer = protectedRenderers[currentModule] || renderDashboardView;
    if (mainViewContainer && renderer) {
      renderer(mainViewContainer, navigate);
    }
  }

  function navigate(moduleId) {
    if (publicRenderers[moduleId] || protectedRenderers[moduleId]) {
      currentModule = moduleId;
      if (window.location.hash !== '#' + moduleId) {
        window.location.hash = moduleId;
      }
      renderApp();
    }
  }

  // Logout Global Handler
  const handleLogout = () => {
    try {
      if (modal && typeof modal.confirm === 'function') {
        modal.confirm({
          title: 'Sair da conta?',
          message: 'Deseja realmente encerrar a sessão? Seus dados continuam salvos com segurança.',
          confirmText: 'Sair',
          confirmColor: 'bg-rose-600 hover:bg-rose-700',
          onConfirm: async () => {
            await auth.signOut();
            window.location.hash = 'login';
            renderApp();
          }
        });
        return;
      }
    } catch (err) {
      console.warn('Erro no modal customizado de confirmação:', err);
    }

    if (window.confirm('Deseja realmente sair da sua conta?')) {
      auth.signOut().then(() => {
        window.location.hash = 'login';
        renderApp();
      });
    }
  };

  // Delegated click listener para qualquer botão de logout na interface
  document.addEventListener('click', (e) => {
    const logoutBtn = e.target.closest('#nav-logout-btn, #sidebar-logout-btn, #mobile-drawer-logout, [data-action="logout"]');
    if (logoutBtn) {
      e.preventDefault();
      e.stopPropagation();
      handleLogout();
    }
  });

  function attachGlobalEvents() {
    // Navigation clicks in sidebar
    document.querySelectorAll('[data-nav]').forEach(btn => {
      btn.onclick = () => {
        const mod = btn.getAttribute('data-nav');
        navigate(mod);
      };
    });

    const logoutBtn = document.getElementById('sidebar-logout-btn');
    if (logoutBtn) logoutBtn.onclick = handleLogout;

    const navLogoutBtn = document.getElementById('nav-logout-btn');
    if (navLogoutBtn) navLogoutBtn.onclick = handleLogout;

    // Quick Actions
    const quickBtn = document.getElementById('nav-quick-actions-btn');
    if (quickBtn) quickBtn.onclick = () => openQuickActionsModal(navigate);

    const mobileFab = document.getElementById('mobile-fab-btn');
    if (mobileFab) mobileFab.onclick = () => openQuickActionsModal(navigate);

    // Global Search
    const searchBtn = document.getElementById('nav-search-btn');
    if (searchBtn) searchBtn.onclick = () => openGlobalSearch(navigate);

    const mobileSearchBtn = document.getElementById('mobile-search-btn');
    if (mobileSearchBtn) mobileSearchBtn.onclick = () => openGlobalSearch(navigate);

    // Notifications Drawer
    const notifBtn = document.getElementById('nav-notifications-btn');
    if (notifBtn) notifBtn.onclick = () => openNotificationsDrawer(navigate);

    // Mobile Hamburger & Bottom Nav More
    const menuBtn = document.getElementById('mobile-menu-btn');
    if (menuBtn) menuBtn.onclick = () => openMobileMenuDrawer(currentModule, navigate);

    const mobileMoreBtn = document.getElementById('mobile-more-btn');
    if (mobileMoreBtn) mobileMoreBtn.onclick = () => openMobileMenuDrawer(currentModule, navigate);

    // Theme toggles
    const navThemeBtn = document.getElementById('nav-theme-toggle');
    if (navThemeBtn) {
      navThemeBtn.onclick = () => {
        const current = store.getState().profile?.theme || 'light';
        store.setTheme(current === 'light' ? 'dark' : 'light');
        renderShell();
      };
    }

    const sideThemeBtn = document.getElementById('sidebar-theme-toggle');
    if (sideThemeBtn) {
      sideThemeBtn.onclick = () => {
        const current = store.getState().profile?.theme || 'light';
        store.setTheme(current === 'light' ? 'dark' : 'light');
        renderShell();
      };
    }
  }

  // Keyboard shortcut Ctrl + K
  window.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      if (auth.isAuthenticated()) {
        openGlobalSearch(navigate);
      }
    }
  });

  // Store subscription
  store.subscribe((event) => {
    if (event === 'user_logged_out') {
      renderApp();
    }
  });

  // Re-render when auth changes
  auth.subscribe(() => {
    renderApp();
  });

  // Hash change listener
  window.addEventListener('hashchange', () => {
    renderApp();
  });

  renderApp();
}

window.addEventListener('DOMContentLoaded', initApp);
