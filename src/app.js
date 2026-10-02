import { store } from './state/store.js';
import { renderNavbar } from './components/Navbar.js';
import { renderSidebar } from './components/Sidebar.js';
import { renderMobileNav, openMobileMenuDrawer } from './components/MobileNav.js';
import { openQuickActionsModal } from './components/QuickActionsModal.js';
import { openGlobalSearch } from './components/GlobalSearchModal.js';
import { openNotificationsDrawer } from './components/NotificationsDrawer.js';

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

const viewTitles = {
  dashboard: 'Dashboard Geral',
  inbox: 'Inbox & Captura Rápida',
  crm: 'CRM & Funil Comercial',
  clients: 'Clientes & Relacionamento',
  documents: 'Central de Documentos',
  services: 'Catálogo de Serviços',
  proposals: 'Propostas Comerciais',
  projects: 'Gestão de Projetos',
  entregas: 'Entregas & Operações',
  finance: 'Controle Financeiro',
  agenda: 'Agenda & Reuniões',
  routine: 'Rotina & Produtividade',
  goals: 'Metas & Objetivos',
  reports: 'Relatórios Analíticos',
  settings: 'Configurações'
};

const viewRenderers = {
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

let currentModule = 'dashboard';

export function initApp() {
  const appRoot = document.getElementById('app-root');
  if (!appRoot) return;

  // Initialize theme from profile
  const savedTheme = store.getState().profile.theme || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);

  // Initialize module from URL hash if valid
  const initialHash = window.location.hash.replace('#', '').toLowerCase();
  if (viewRenderers[initialHash]) {
    currentModule = initialHash;
  }

  function renderShell() {
    // Dynamic document title
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
    const renderer = viewRenderers[currentModule] || renderDashboardView;
    if (mainViewContainer && renderer) {
      renderer(mainViewContainer, navigate);
    }
  }

  function navigate(moduleId) {
    if (viewRenderers[moduleId]) {
      currentModule = moduleId;
      if (window.location.hash !== '#' + moduleId) {
        window.location.hash = moduleId;
      }
      renderShell();
    }
  }

  function attachGlobalEvents() {
    // Navigation clicks in sidebar
    document.querySelectorAll('[data-nav]').forEach(btn => {
      btn.onclick = () => {
        const mod = btn.getAttribute('data-nav');
        navigate(mod);
      };
    });

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

    // Mobile Hamburger
    const menuBtn = document.getElementById('mobile-menu-btn');
    if (menuBtn) menuBtn.onclick = () => openMobileMenuDrawer(currentModule, navigate);

    // Theme toggles
    const navThemeBtn = document.getElementById('nav-theme-toggle');
    if (navThemeBtn) {
      navThemeBtn.onclick = () => {
        const current = store.getState().profile.theme || 'light';
        store.setTheme(current === 'light' ? 'dark' : 'light');
        renderShell();
      };
    }

    const sideThemeBtn = document.getElementById('sidebar-theme-toggle');
    if (sideThemeBtn) {
      sideThemeBtn.onclick = () => {
        const current = store.getState().profile.theme || 'light';
        store.setTheme(current === 'light' ? 'dark' : 'light');
        renderShell();
      };
    }
  }

  // Keyboard shortcut Ctrl + K
  window.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      openGlobalSearch(navigate);
    }
  });

  // Store update subscription: keep metrics and state in sync
  store.subscribe((event, payload) => {
    // re-renders current view if necessary
  });

  // Listen to browser hash changes (Back / Forward)
  window.addEventListener('hashchange', () => {
    const hash = window.location.hash.replace('#', '').toLowerCase();
    if (viewRenderers[hash] && hash !== currentModule) {
      currentModule = hash;
      renderShell();
    }
  });

  renderShell();
}

window.addEventListener('DOMContentLoaded', initApp);
