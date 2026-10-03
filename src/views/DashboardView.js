import { store } from '../state/store.js';
import { formatCurrency, formatDate, getStatusBadge } from '../utils/formatters.js';
import { modal } from '../components/Modal.js';
import { toast } from '../components/Toast.js';

export function renderDashboardView(container, onNavigate) {
  const state = store.getState();
  const profile = state.profile || {};
  const metrics = store.getDashboardMetrics();
  const attentionItems = store.calculateAttentionItems();
  const health = store.calculateBusinessHealth();
  const widgets = profile.dashboardWidgets || {
    attention: true,
    finance: true,
    cashflow: true,
    commercial: true,
    health: true,
    projects: true,
    deliveries: true,
    routine: true
  };

  // Saudação de acordo com o horário
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';
  const firstName = (profile.name || 'Criativo').split(' ')[0];

  // Pipeline aberto
  const openProposals = (state.proposals || []).filter(p => p.status === 'enviada' || p.status === 'negociacao');
  const openPipelineValue = openProposals.reduce((acc, p) => acc + (p.finalValue || p.value || 0), 0);

  // XP progress calculation
  const currentXP = profile.xp ?? 0;
  const currentLevel = profile.level ?? 1;
  const xpInCurrentLevel = currentXP % 100;

  // Transações atrasadas e previstas calculadas dinamicamente
  const overdueTxs = (state.transactions || []).filter(t => t.type === 'income' && t.status !== 'paid' && t.dueDate && t.dueDate < new Date().toISOString().split('T')[0]);
  const overdueTotal = overdueTxs.reduce((acc, t) => acc + (t.amount || 0), 0);
  const pendingIncome = (state.transactions || []).filter(t => t.type === 'income' && t.status !== 'paid');
  const previstoMes = metrics.financial.income + pendingIncome.reduce((acc, t) => acc + (t.amount || 0), 0);

  // Onboarding Checklist
  const hasClients = (state.clients || []).length > 0;
  const hasServices = (state.services || []).length > 0;
  const hasProjectsOrDeliveries = (state.projects || []).length > 0 || (state.deliveries || []).length > 0;
  const hasTransactions = (state.transactions || []).length > 0;
  const completedSteps = [hasClients, hasServices, hasProjectsOrDeliveries, hasTransactions].filter(Boolean).length;
  const isNewUser = (state.clients || []).length === 0 && (state.leads || []).length === 0 && (state.projects || []).length === 0 && (state.transactions || []).length === 0;

  container.innerHTML = `
    <div class="space-y-6">
      <!-- Top Command Bar: Greeting, Attention count, XP & Actions -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 shadow-2xs">
        <div class="space-y-1">
          <div class="flex items-center gap-2">
            <h2 class="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">${greeting}, ${firstName}.</h2>
            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
              attentionItems.length > 0 
                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200 dark:border-amber-800' 
                : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
            }">
              ${attentionItems.length > 0 ? `${attentionItems.length} itens precisam da sua atenção` : 'Tudo em dia'}
            </span>
          </div>
          <p class="text-xs text-zinc-500">Centro de comando operacional do seu negócio criativo.</p>
        </div>

        <div class="flex items-center flex-wrap gap-2.5">
          <!-- Discreto XP Indicator -->
          ${profile.xpEnabled !== false ? `
            <div class="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/60 dark:border-zinc-700/60 text-xs">
              <span class="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
              <span class="font-semibold text-zinc-800 dark:text-zinc-200">Nível ${currentLevel}</span>
              <span class="text-zinc-400">•</span>
              <span class="text-[11px] text-zinc-500">${currentXP} XP</span>
              <div class="w-12 bg-zinc-200 dark:bg-zinc-700 h-1.5 rounded-full overflow-hidden ml-1">
                <div class="bg-blue-600 h-full rounded-full" style="width: ${xpInCurrentLevel}%"></div>
              </div>
            </div>
          ` : ''}

          <!-- Quick Capture FAB / Inbox Trigger -->
          <button id="dashboard-quick-capture-btn" class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
            <span>Captura Rápida</span>
          </button>

          <!-- Edit Dashboard Widgets Button -->
          <button id="dashboard-edit-widgets-btn" class="p-2 bg-white dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600 rounded-xl text-zinc-600 dark:text-zinc-400 text-xs transition-colors" title="Personalizar Dashboard">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
          </button>
        </div>
      </div>

      <!-- ONBOARDING & EMPTY STATE GUIA RÁPIDO (V2.1) -->
      ${isNewUser || completedSteps < 4 ? `
        <div id="onboarding-guide-banner" class="p-6 rounded-3xl bg-gradient-to-br from-blue-50/80 via-white to-indigo-50/50 dark:from-zinc-900 dark:via-zinc-850 dark:to-zinc-900 border border-blue-100 dark:border-zinc-800 shadow-sm space-y-4">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div class="flex items-center gap-2">
                <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-600 text-white tracking-wide uppercase">Primeiros Passos</span>
                <span class="text-xs font-semibold text-zinc-500">${completedSteps}/4 passos concluídos</span>
              </div>
              <h3 class="text-base font-bold text-zinc-900 dark:text-zinc-100 mt-1">Seu negócio começa aqui</h3>
              <p class="text-xs text-zinc-500">Configure os pilares essenciais para transformar propostas em contratos e entregas em faturamento.</p>
            </div>
            <div class="flex items-center gap-3">
              <div class="w-24 bg-zinc-200 dark:bg-zinc-700 h-2 rounded-full overflow-hidden">
                <div class="bg-blue-600 h-full rounded-full transition-all duration-500" style="width: ${(completedSteps / 4) * 100}%"></div>
              </div>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <!-- Passo 1: Cliente -->
            <button data-goto="clients" class="p-3.5 rounded-2xl border text-left transition-all ${hasClients ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800' : 'bg-white dark:bg-zinc-800 border-zinc-200/80 dark:border-zinc-700 hover:border-blue-400 dark:hover:border-blue-500 shadow-2xs cursor-pointer'}">
              <div class="flex items-center justify-between mb-1.5">
                <span class="text-[10px] font-bold uppercase tracking-wider ${hasClients ? 'text-emerald-700 dark:text-emerald-400' : 'text-blue-600 dark:text-blue-400'}">Passo 1</span>
                <span class="w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${hasClients ? 'bg-emerald-600 text-white' : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-500'}">${hasClients ? '✓' : '1'}</span>
              </div>
              <div class="text-xs font-bold text-zinc-900 dark:text-zinc-100">Cadastre seu 1º cliente</div>
              <div class="text-[11px] text-zinc-400 mt-0.5">${hasClients ? 'Concluído' : '+ Novo cliente'}</div>
            </button>

            <!-- Passo 2: Serviços -->
            <button data-goto="services" class="p-3.5 rounded-2xl border text-left transition-all ${hasServices ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800' : 'bg-white dark:bg-zinc-800 border-zinc-200/80 dark:border-zinc-700 hover:border-blue-400 dark:hover:border-blue-500 shadow-2xs cursor-pointer'}">
              <div class="flex items-center justify-between mb-1.5">
                <span class="text-[10px] font-bold uppercase tracking-wider ${hasServices ? 'text-emerald-700 dark:text-emerald-400' : 'text-blue-600 dark:text-blue-400'}">Passo 2</span>
                <span class="w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${hasServices ? 'bg-emerald-600 text-white' : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-500'}">${hasServices ? '✓' : '2'}</span>
              </div>
              <div class="text-xs font-bold text-zinc-900 dark:text-zinc-100">Adicione seus serviços</div>
              <div class="text-[11px] text-zinc-400 mt-0.5">${hasServices ? 'Concluído' : '+ Tabela de serviços'}</div>
            </button>

            <!-- Passo 3: Projeto / Entrega -->
            <button data-goto="projects" class="p-3.5 rounded-2xl border text-left transition-all ${hasProjectsOrDeliveries ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800' : 'bg-white dark:bg-zinc-800 border-zinc-200/80 dark:border-zinc-700 hover:border-blue-400 dark:hover:border-blue-500 shadow-2xs cursor-pointer'}">
              <div class="flex items-center justify-between mb-1.5">
                <span class="text-[10px] font-bold uppercase tracking-wider ${hasProjectsOrDeliveries ? 'text-emerald-700 dark:text-emerald-400' : 'text-blue-600 dark:text-blue-400'}">Passo 3</span>
                <span class="w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${hasProjectsOrDeliveries ? 'bg-emerald-600 text-white' : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-500'}">${hasProjectsOrDeliveries ? '✓' : '3'}</span>
              </div>
              <div class="text-xs font-bold text-zinc-900 dark:text-zinc-100">Crie seu 1º projeto</div>
              <div class="text-[11px] text-zinc-400 mt-0.5">${hasProjectsOrDeliveries ? 'Concluído' : '+ Projeto ou entrega'}</div>
            </button>

            <!-- Passo 4: Finanças -->
            <button data-goto="finance" class="p-3.5 rounded-2xl border text-left transition-all ${hasTransactions ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800' : 'bg-white dark:bg-zinc-800 border-zinc-200/80 dark:border-zinc-700 hover:border-blue-400 dark:hover:border-blue-500 shadow-2xs cursor-pointer'}">
              <div class="flex items-center justify-between mb-1.5">
                <span class="text-[10px] font-bold uppercase tracking-wider ${hasTransactions ? 'text-emerald-700 dark:text-emerald-400' : 'text-blue-600 dark:text-blue-400'}">Passo 4</span>
                <span class="w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${hasTransactions ? 'bg-emerald-600 text-white' : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-500'}">${hasTransactions ? '✓' : '4'}</span>
              </div>
              <div class="text-xs font-bold text-zinc-900 dark:text-zinc-100">Registre 1ª receita</div>
              <div class="text-[11px] text-zinc-400 mt-0.5">${hasTransactions ? 'Concluído' : '+ Lançamento financeiro'}</div>
            </button>
          </div>
        </div>
      ` : ''}

      <!-- SECTION: PRECISA DA SUA ATENÇÃO -->
      ${widgets.attention ? `
        <div class="space-y-3">
          <div class="flex items-center justify-between px-1">
            <div class="flex items-center gap-2">
              <span class="w-2 h-2 rounded-full ${attentionItems.length > 0 ? 'bg-amber-500 animate-ping' : 'bg-emerald-500'}"></span>
              <span class="text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-zinc-100">Precisa da sua atenção</span>
            </div>
            <span class="text-[11px] text-zinc-400 font-medium">${attentionItems.length} alertas gerados automaticamente</span>
          </div>

          ${attentionItems.length > 0 ? `
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              ${attentionItems.map(item => `
                <div class="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-2xs hover:border-zinc-300 dark:hover:border-zinc-700 transition-all flex flex-col justify-between">
                  <div>
                    <div class="flex items-center justify-between mb-2">
                      <span class="px-2 py-0.5 rounded text-[10px] font-bold border ${item.badgeColor}">${item.badge}</span>
                      <span class="w-1.5 h-1.5 rounded-full ${item.severity === 'high' ? 'bg-rose-500' : 'bg-amber-500'}"></span>
                    </div>
                    <h4 class="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate" title="${item.title}">${item.title}</h4>
                    <p class="text-[11px] text-zinc-500 mt-1">${item.subtitle}</p>
                  </div>
                  <div class="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800/80">
                    <button data-goto="${item.link}" data-target-id="${item.targetId || ''}" class="w-full py-1.5 px-2 rounded-lg bg-zinc-50 dark:bg-zinc-800 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-bold text-[10px] tracking-wider transition-colors text-center uppercase">
                      ${item.actionLabel}
                    </button>
                  </div>
                </div>
              `).join('')}
            </div>
          ` : `
            <div class="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 text-center py-6">
              <div class="w-9 h-9 rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400 flex items-center justify-center mx-auto mb-2 font-bold text-sm">✓</div>
              <h4 class="text-xs font-semibold text-zinc-900 dark:text-zinc-100">Tudo em dia!</h4>
              <p class="text-[11px] text-zinc-400 mt-0.5">Nenhum projeto atrasado, proposta pendente ou pagamento vencido no momento.</p>
            </div>
          `}
        </div>
      ` : ''}

      <!-- SECTION: SAÚDE DO NEGÓCIO (V2) -->
      ${widgets.health ? `
        <div class="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-2xs space-y-4">
          <div class="flex items-center justify-between">
            <div>
              <div class="flex items-center gap-2">
                <h3 class="text-sm font-bold text-zinc-900 dark:text-zinc-100">Saúde do Negócio</h3>
                <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                  Score Geral: ${health.overall}/100
                </span>
              </div>
              <p class="text-[11px] text-zinc-400 mt-0.5">Diagnóstico analítico transparente dos 4 pilares da sua operação criativa</p>
            </div>
            <button data-goto="reports" class="text-xs text-blue-600 hover:underline font-semibold">Ver Relatórios →</button>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <!-- Pilar Comercial -->
            <div class="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-850/60 border border-zinc-100 dark:border-zinc-800">
              <div class="flex items-center justify-between mb-1.5">
                <span class="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Comercial</span>
                <span class="text-xs font-bold ${health.commercial.score >= 70 ? 'text-emerald-600' : 'text-amber-600'}">${health.commercial.score}/100</span>
              </div>
              <div class="w-full bg-zinc-200 dark:bg-zinc-700 h-1.5 rounded-full overflow-hidden mb-2">
                <div class="bg-blue-600 h-full rounded-full transition-all" style="width: ${health.commercial.score}%"></div>
              </div>
              <p class="text-[10px] text-zinc-500 leading-tight">${health.commercial.diagnosis}</p>
            </div>

            <!-- Pilar Financeiro -->
            <div class="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-850/60 border border-zinc-100 dark:border-zinc-800">
              <div class="flex items-center justify-between mb-1.5">
                <span class="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Financeiro</span>
                <span class="text-xs font-bold ${health.finance.score >= 70 ? 'text-emerald-600' : 'text-amber-600'}">${health.finance.score}/100</span>
              </div>
              <div class="w-full bg-zinc-200 dark:bg-zinc-700 h-1.5 rounded-full overflow-hidden mb-2">
                <div class="bg-blue-600 h-full rounded-full transition-all" style="width: ${health.finance.score}%"></div>
              </div>
              <p class="text-[10px] text-zinc-500 leading-tight">${health.finance.diagnosis}</p>
            </div>

            <!-- Pilar Projetos -->
            <div class="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-850/60 border border-zinc-100 dark:border-zinc-800">
              <div class="flex items-center justify-between mb-1.5">
                <span class="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Projetos</span>
                <span class="text-xs font-bold ${health.projects.score >= 70 ? 'text-emerald-600' : 'text-amber-600'}">${health.projects.score}/100</span>
              </div>
              <div class="w-full bg-zinc-200 dark:bg-zinc-700 h-1.5 rounded-full overflow-hidden mb-2">
                <div class="bg-blue-600 h-full rounded-full transition-all" style="width: ${health.projects.score}%"></div>
              </div>
              <p class="text-[10px] text-zinc-500 leading-tight">${health.projects.diagnosis}</p>
            </div>

            <!-- Pilar Relacionamento -->
            <div class="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-850/60 border border-zinc-100 dark:border-zinc-800">
              <div class="flex items-center justify-between mb-1.5">
                <span class="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Relacionamento</span>
                <span class="text-xs font-bold ${health.relationship.score >= 70 ? 'text-emerald-600' : 'text-amber-600'}">${health.relationship.score}/100</span>
              </div>
              <div class="w-full bg-zinc-200 dark:bg-zinc-700 h-1.5 rounded-full overflow-hidden mb-2">
                <div class="bg-blue-600 h-full rounded-full transition-all" style="width: ${health.relationship.score}%"></div>
              </div>
              <p class="text-[10px] text-zinc-500 leading-tight">${health.relationship.diagnosis}</p>
            </div>
          </div>
        </div>
      ` : ''}

      <!-- SECTION: DASHBOARD FINANCEIRO & CONTAS A RECEBER -->
      ${widgets.finance ? `
        <div>
          <div class="flex items-center justify-between mb-3 px-1">
            <div class="text-xs font-semibold uppercase tracking-wider text-zinc-400">Indicadores Financeiros</div>
            <button data-goto="finance" class="text-xs text-blue-600 hover:underline font-medium">Contas a Receber & Pagar →</button>
          </div>
          <div class="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
            <div class="p-3.5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-2xs">
              <div class="text-[10px] font-medium text-zinc-500">Receita Mês</div>
              <div class="text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-100 mt-0.5">${formatCurrency(metrics.financial.income)}</div>
              <div class="text-[10px] text-emerald-600 font-medium mt-1">Realizado</div>
            </div>

            <div class="p-3.5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-2xs">
              <div class="text-[10px] font-medium text-zinc-500">Despesas</div>
              <div class="text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-100 mt-0.5">${formatCurrency(metrics.financial.expenses)}</div>
              <div class="text-[10px] text-zinc-400 font-medium mt-1">Custos</div>
            </div>

            <div class="p-3.5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-2xs">
              <div class="text-[10px] font-medium text-zinc-500">Lucro Líquido</div>
              <div class="text-sm sm:text-base font-bold text-blue-600 dark:text-blue-400 mt-0.5">${formatCurrency(metrics.financial.profit)}</div>
              <div class="text-[10px] text-emerald-600 font-medium mt-1">Positivo</div>
            </div>

            <div class="p-3.5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-2xs">
              <div class="text-[10px] font-medium text-zinc-500">Saldo Atual</div>
              <div class="text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-100 mt-0.5">${formatCurrency(metrics.financial.balance)}</div>
              <div class="text-[10px] text-zinc-400 font-medium mt-1">Disponível</div>
            </div>

            <div class="p-3.5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-2xs">
              <div class="text-[10px] font-medium text-zinc-500">Previsto Mês</div>
              <div class="text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-100 mt-0.5">${formatCurrency(previstoMes)}</div>
              <div class="text-[10px] text-blue-600 font-medium mt-1">Contratado</div>
            </div>

            <div class="p-3.5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-2xs">
              <div class="text-[10px] font-medium text-zinc-500">A Receber</div>
              <div class="text-sm sm:text-base font-bold text-indigo-600 dark:text-indigo-400 mt-0.5">${formatCurrency(metrics.financial.receivable)}</div>
              <div class="text-[10px] text-zinc-400 font-medium mt-1">Futuro</div>
            </div>

            <div class="p-3.5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-2xs">
              <div class="text-[10px] font-medium text-zinc-500">Atrasados</div>
              <div class="text-sm sm:text-base font-bold text-rose-600 dark:text-rose-400 mt-0.5">${formatCurrency(overdueTotal)}</div>
              <div class="text-[10px] text-rose-500 font-medium mt-1">${overdueTxs.length} ${overdueTxs.length === 1 ? 'cobrança' : 'cobranças'}</div>
            </div>

            <div class="p-3.5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-2xs">
              <div class="text-[10px] font-medium text-zinc-500">Margem %</div>
              <div class="text-sm sm:text-base font-bold text-emerald-600 mt-0.5">${metrics.financial.income > 0 ? Math.round(((metrics.financial.income - metrics.financial.expenses) / metrics.financial.income) * 100) : 0}%</div>
              <div class="text-[10px] text-zinc-400 font-medium mt-1">Operacional</div>
            </div>
          </div>
        </div>
      ` : ''}

      <!-- SECTION: DASHBOARD COMERCIAL (BANNER + DETALHES) -->
      ${widgets.commercial ? `
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <!-- Banner Destaque Comercial -->
          <div class="lg:col-span-2 p-5 rounded-2xl bg-gradient-to-r from-blue-900 to-indigo-950 text-white shadow-md flex flex-col justify-between">
            <div class="flex items-center justify-between">
              <span class="px-2.5 py-1 rounded-lg bg-blue-500/20 text-blue-200 text-xs font-semibold border border-blue-400/30">
                Pipeline Comercial Ativo
              </span>
              <button data-goto="proposals" class="text-xs text-blue-200 hover:text-white underline font-medium">Ver Propostas →</button>
            </div>
            <div class="my-4">
              <div class="text-xs uppercase tracking-wider text-blue-200/70">Oportunidades Abertas em Negociação</div>
              <div class="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1 text-white">
                ${formatCurrency(openPipelineValue)}
              </div>
              <p class="text-xs text-blue-200/80 mt-1">Total de ${openProposals.length} propostas em análise com clientes potenciais.</p>
            </div>
            <div class="grid grid-cols-3 gap-3 pt-3 border-t border-blue-800/40 text-xs">
              <div>
                <span class="text-blue-300/70 text-[10px] block">Taxa de Conversão</span>
                <span class="font-bold text-sm text-white">${metrics.commercial.conversionRate}%</span>
              </div>
              <div>
                <span class="text-blue-300/70 text-[10px] block">Ticket Médio</span>
                <span class="font-bold text-sm text-white">${formatCurrency(openPipelineValue / (openProposals.length || 1))}</span>
              </div>
              <div>
                <span class="text-blue-300/70 text-[10px] block">Tempo Médio Fechamento</span>
                <span class="font-bold text-sm text-white">6 dias</span>
              </div>
            </div>
          </div>

          <!-- Métricas de Funil -->
          <div class="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 flex flex-col justify-between">
            <div class="flex items-center justify-between mb-3">
              <h3 class="text-sm font-bold text-zinc-900 dark:text-zinc-100">Funil de Vendas</h3>
              <button data-goto="crm" class="text-xs text-blue-600 hover:underline font-semibold">Abrir CRM →</button>
            </div>
            <div class="grid grid-cols-2 gap-2 text-center text-xs">
              <div class="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-850">
                <span class="text-lg font-bold text-blue-600">${metrics.commercial.inFunnel}</span>
                <span class="block text-[10px] text-zinc-400 mt-0.5">Leads Ativos</span>
              </div>
              <div class="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-850">
                <span class="text-lg font-bold text-amber-600">${(state.leads || []).filter(l => l.status === 'diagnostico').length}</span>
                <span class="block text-[10px] text-zinc-400 mt-0.5">Diagnóstico</span>
              </div>
              <div class="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-850">
                <span class="text-lg font-bold text-indigo-600">${openProposals.length}</span>
                <span class="block text-[10px] text-zinc-400 mt-0.5">Propostas</span>
              </div>
              <div class="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-850">
                <span class="text-lg font-bold text-emerald-600">${metrics.commercial.converted}</span>
                <span class="block text-[10px] text-zinc-400 mt-0.5">Aprovados</span>
              </div>
            </div>
            <div class="mt-3 text-center">
              <button data-goto="crm" class="w-full py-2 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/50 text-blue-600 dark:text-blue-300 font-semibold rounded-xl text-xs transition-colors">
                + Novo Lead no CRM
              </button>
            </div>
          </div>
        </div>
      ` : ''}

      <!-- SECTION: GRÁFICO DE FLUXO DE CAIXA (COM ALTERNADOR DE PERÍODO) -->
      ${widgets.cashflow ? `
        <div class="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-2xs space-y-4">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 class="text-sm font-bold text-zinc-900 dark:text-zinc-100">Fluxo de Caixa & Projeção Financeira</h3>
              <p class="text-[11px] text-zinc-400">Comparativo entre Recebido, Previsto e Despesas</p>
            </div>
            <div class="flex items-center gap-1 p-1 bg-zinc-100 dark:bg-zinc-800/80 rounded-xl" id="cashflow-period-selector">
              <button data-period="7d" class="px-2.5 py-1 text-[11px] font-semibold rounded-lg text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">7 dias</button>
              <button data-period="30d" class="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-white dark:bg-zinc-700 text-blue-600 dark:text-white shadow-xs">30 dias</button>
              <button data-period="90d" class="px-2.5 py-1 text-[11px] font-semibold rounded-lg text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">90 dias</button>
              <button data-period="mes" class="px-2.5 py-1 text-[11px] font-semibold rounded-lg text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">Mês</button>
              <button data-period="trimestre" class="px-2.5 py-1 text-[11px] font-semibold rounded-lg text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">Trimestre</button>
            </div>
          </div>
          <div class="h-64 relative">
            <canvas id="chart-dashboard-finance"></canvas>
          </div>
        </div>
      ` : ''}

      <!-- SECTION: PROJETOS, ENTREGAS E LANÇAMENTOS -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <!-- Projetos em Destaque -->
        ${widgets.projects ? `
          <div class="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 flex flex-col justify-between">
            <div>
              <div class="flex items-center justify-between mb-3">
                <h3 class="text-sm font-bold text-zinc-900 dark:text-zinc-100">Projetos em Andamento</h3>
                <button data-goto="projects" class="text-xs text-blue-600 hover:underline font-semibold">Ver Todos →</button>
              </div>
              <div class="space-y-3">
                ${(state.projects || []).length > 0 ? (state.projects || []).slice(0, 3).map(proj => {
                  const completedTasks = proj.tasks ? proj.tasks.filter(t => t.completed).length : 0;
                  const totalTasks = proj.tasks ? proj.tasks.length : 1;
                  const percent = Math.round((completedTasks / totalTasks) * 100);
                  return `
                    <div class="p-3 rounded-xl border border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-850/50 hover:border-zinc-200 dark:hover:border-zinc-700 transition-colors">
                      <div class="flex items-center justify-between text-xs mb-1.5">
                        <span class="font-semibold text-zinc-800 dark:text-zinc-200 truncate max-w-[150px]">${proj.title}</span>
                        ${getStatusBadge(proj.stage)}
                      </div>
                      <div class="flex items-center justify-between text-[11px] text-zinc-400 mb-2">
                        <span class="truncate max-w-[130px]">${proj.clientName}</span>
                        <span>${formatDate(proj.deadlineDate)}</span>
                      </div>
                      <div class="w-full bg-zinc-200 dark:bg-zinc-700 h-1.5 rounded-full overflow-hidden">
                        <div class="bg-blue-600 h-full rounded-full transition-all" style="width: ${percent}%"></div>
                      </div>
                    </div>
                  `;
                }).join('') : `
                  <div class="p-6 text-center text-zinc-400 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl">
                    <p class="text-xs font-medium">Nenhum projeto em andamento.</p>
                    <p class="text-[10px] text-zinc-400 mt-0.5">Inicie novos contratos pelo botão abaixo.</p>
                  </div>
                `}
              </div>
            </div>
            <button data-goto="projects" class="w-full mt-3 py-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700/80 text-zinc-800 dark:text-zinc-200 rounded-xl text-xs font-semibold transition-colors cursor-pointer">
              + Novo Projeto
            </button>
          </div>
        ` : ''}

        <!-- Próximas Entregas (Kanban) -->
        ${widgets.deliveries ? `
          <div class="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 flex flex-col justify-between">
            <div>
              <div class="flex items-center justify-between mb-3">
                <h3 class="text-sm font-bold text-zinc-900 dark:text-zinc-100">Próximas Entregas</h3>
                <button data-goto="entregas" class="text-xs text-blue-600 hover:underline font-semibold cursor-pointer">Ver Kanban →</button>
              </div>
              <div class="space-y-3">
                ${(state.deliveries || []).length > 0 ? (state.deliveries || []).slice(0, 3).map(del => {
                  const checklist = del.checklist || [];
                  const completedChecks = checklist.filter(c => c.completed).length;
                  const chkPercent = checklist.length > 0 ? Math.round((completedChecks / checklist.length) * 100) : 0;
                  return `
                    <div class="p-3 rounded-xl border border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-850/50">
                      <div class="flex items-center justify-between text-xs mb-1">
                        <span class="font-semibold text-zinc-900 dark:text-zinc-100 truncate max-w-[160px]">${del.title}</span>
                        <span class="px-2 py-0.5 rounded text-[10px] font-bold ${
                          del.priority === 'urgente' ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400' :
                          del.priority === 'alta' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400' :
                          'bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-400'
                        }">${del.priority.toUpperCase()}</span>
                      </div>
                      <div class="flex items-center justify-between text-[11px] text-zinc-400 mb-1.5">
                        <span class="truncate max-w-[130px]">${del.clientName || 'Geral'}</span>
                        <span>${del.dueDate ? del.dueDate.split('-').reverse().slice(0, 2).join('/') : 'Sem prazo'}</span>
                      </div>
                      ${checklist.length > 0 ? `
                        <div class="w-full bg-zinc-200 dark:bg-zinc-700 h-1.5 rounded-full overflow-hidden">
                          <div class="bg-blue-600 h-full rounded-full transition-all" style="width: ${chkPercent}%"></div>
                        </div>
                      ` : ''}
                    </div>
                  `;
                }).join('') : `
                  <div class="p-6 text-center text-zinc-400 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl">
                    <p class="text-xs font-medium">Nenhuma entrega pendente.</p>
                    <p class="text-[10px] text-zinc-400 mt-0.5">Demandas cadastradas aparecerão aqui.</p>
                  </div>
                `}
              </div>
            </div>
            <button data-goto="entregas" class="w-full mt-3 py-2 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 text-blue-600 dark:text-blue-300 rounded-xl text-xs font-semibold transition-colors cursor-pointer">
              + Nova Entrega
            </button>
          </div>
        ` : ''}

        <!-- Últimos Lançamentos Financeiros -->
        <div class="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 flex flex-col justify-between">
          <div>
            <div class="flex items-center justify-between mb-3">
              <h3 class="text-sm font-bold text-zinc-900 dark:text-zinc-100">Últimos Lançamentos</h3>
              <button data-goto="finance" class="text-xs text-blue-600 hover:underline font-semibold cursor-pointer">Extrato →</button>
            </div>
            <div class="divide-y divide-zinc-100 dark:divide-zinc-800">
              ${(state.transactions || []).length > 0 ? (state.transactions || []).slice(0, 4).map(tx => `
                <div class="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <div class="font-medium text-zinc-800 dark:text-zinc-200 truncate max-w-[160px]">${tx.title}</div>
                    <div class="text-[10px] text-zinc-400">${formatDate(tx.date)} • ${tx.category}</div>
                  </div>
                  <div class="font-semibold ${tx.type === 'income' ? 'text-emerald-600' : 'text-zinc-900 dark:text-zinc-100'}">
                    ${tx.type === 'income' ? '+' : '-'}${formatCurrency(tx.amount)}
                  </div>
                </div>
              `).join('') : `
                <div class="p-6 text-center text-zinc-400">
                  <p class="text-xs font-medium">Nenhum lançamento financeiro.</p>
                  <p class="text-[10px] text-zinc-400 mt-0.5">Receitas e despesas aparecerão no extrato.</p>
                </div>
              `}
            </div>
          </div>
          <button data-goto="finance" class="w-full mt-3 py-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700/80 text-zinc-800 dark:text-zinc-200 rounded-xl text-xs font-semibold transition-colors cursor-pointer">
            + Novo Lançamento
          </button>
        </div>
      </div>
    </div>
  `;

  // Navigation handlers
  container.querySelectorAll('[data-goto]').forEach(btn => {
    btn.onclick = () => {
      const target = btn.getAttribute('data-goto');
      if (onNavigate) onNavigate(target);
    };
  });

  // Quick Capture Button
  const quickBtn = container.querySelector('#dashboard-quick-capture-btn');
  if (quickBtn) {
    quickBtn.onclick = () => {
      openQuickCaptureModal(onNavigate);
    };
  }

  // Edit Widgets Modal
  const editWidgetsBtn = container.querySelector('#dashboard-edit-widgets-btn');
  if (editWidgetsBtn) {
    editWidgetsBtn.onclick = () => {
      openEditWidgetsModal(container, onNavigate);
    };
  }

  // Cashflow period selector
  const periodSelector = container.querySelector('#cashflow-period-selector');
  if (periodSelector) {
    periodSelector.querySelectorAll('button').forEach(btn => {
      btn.onclick = () => {
        periodSelector.querySelectorAll('button').forEach(b => {
          b.className = 'px-2.5 py-1 text-[11px] font-semibold rounded-lg text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors';
        });
        btn.className = 'px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-white dark:bg-zinc-700 text-blue-600 dark:text-white shadow-xs';
        renderCashflowChart(btn.getAttribute('data-period'));
      };
    });
  }

  // Render Charts
  setTimeout(() => {
    renderCashflowChart('30d');
  }, 60);
}

function renderCashflowChart(period = '30d') {
  if (!window.Chart) return;
  const ctx = document.getElementById('chart-dashboard-finance');
  const container = ctx ? ctx.parentElement : null;
  if (!ctx || !container) return;

  if (window._dashFinanceChart) {
    window._dashFinanceChart.destroy();
  }

  const cashflow = store.getFinancialCashflow('business', period);

  if (!cashflow.hasData) {
    container.innerHTML = `
      <div class="h-full min-h-[200px] flex flex-col items-center justify-center text-center p-6 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl">
        <svg class="w-8 h-8 text-zinc-300 dark:text-zinc-600 mb-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>
        <span class="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Ainda não há dados suficientes para gerar este gráfico.</span>
        <span class="text-[11px] text-zinc-400 mt-0.5">Registre receitas ou despesas reais para visualizar as projeções de caixa.</span>
      </div>
    `;
    return;
  }

  // Se o canvas foi substituído anteriormente por empty state, recria o canvas
  if (!document.getElementById('chart-dashboard-finance')) {
    container.innerHTML = '<canvas id="chart-dashboard-finance"></canvas>';
  }
  const realCtx = document.getElementById('chart-dashboard-finance');

  window._dashFinanceChart = new window.Chart(realCtx, {
    type: 'bar',
    data: {
      labels: cashflow.labels,
      datasets: [
        {
          label: 'Recebido (Realizado)',
          data: cashflow.realIncome,
          backgroundColor: '#0000FF',
          borderRadius: 6
        },
        {
          label: 'Previsto a Receber',
          data: cashflow.projectedIncome,
          backgroundColor: '#93C5FD',
          borderRadius: 6
        },
        {
          label: 'Despesas Realizadas',
          data: cashflow.realExpense,
          backgroundColor: '#F43F5E',
          borderRadius: 6
        },
        {
          label: 'Despesas Previstas',
          data: cashflow.projectedExpense,
          backgroundColor: '#FECDD3',
          borderRadius: 6
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'top', labels: { boxWidth: 10, font: { size: 10 } } },
        tooltip: {
          callbacks: {
            label: (ctx) => `${ctx.dataset.label}: ${formatCurrency(ctx.parsed.y)}`
          }
        }
      },
      scales: {
        x: { grid: { display: false } },
        y: {
          grid: { color: 'rgba(0,0,0,0.05)' },
          ticks: { callback: (val) => formatCurrency(val) }
        }
      }
    }
  });
}

function openQuickCaptureModal(onNavigate) {
  const content = `
    <div class="space-y-4">
      <p class="text-xs text-zinc-500">Capture qualquer demanda, ideia ou cliente rapidamente sem preencher vários campos. Você poderá converter depois.</p>
      <div>
        <label class="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">O que você precisa registrar?</label>
        <textarea id="quick-capture-text" rows="3" class="w-full px-3 py-2 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:border-blue-600" placeholder="Ex: Enviar identidade visual do IBMR amanhã às 15h..."></textarea>
      </div>
      <div>
        <label class="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Sugestão de Conversão</label>
        <select id="quick-capture-type" class="w-full px-3 py-2 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:border-blue-600">
          <option value="task">Tarefa</option>
          <option value="delivery">Entrega</option>
          <option value="project">Projeto</option>
          <option value="event">Evento na Agenda</option>
          <option value="lead">Lead no CRM</option>
          <option value="note">Anotação Geral</option>
        </select>
      </div>
      <div class="flex justify-end gap-2 pt-2">
        <button id="quick-capture-save-btn" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition-colors">
          Salvar no Inbox (+10 XP)
        </button>
      </div>
    </div>
  `;

  const { panel, close } = modal.open({
    title: '📥 Captura Rápida de Demanda',
    content,
    size: 'md'
  });

  panel.querySelector('#quick-capture-save-btn').onclick = () => {
    const text = panel.querySelector('#quick-capture-text').value.trim();
    const type = panel.querySelector('#quick-capture-type').value;
    if (!text) {
      toast.warning('Digite uma descrição para capturar.');
      return;
    }

    store.addInboxItem(text, type);
    toast.success('Demanda capturada com sucesso no Inbox!');
    close();
    if (onNavigate) onNavigate('inbox');
  };
}

function openEditWidgetsModal(container, onNavigate) {
  const state = store.getState();
  const widgets = state.profile.dashboardWidgets || {};

  const widgetList = [
    { key: 'attention', label: 'Itens que Precisam de Atenção', desc: 'Alertas automáticos de projetos atrasados, propostas sem resposta e cobranças' },
    { key: 'health', label: 'Saúde do Negócio', desc: 'Score e diagnósticos dos 4 pilares: Comercial, Financeiro, Projetos e Relacionamento' },
    { key: 'finance', label: 'Indicadores Financeiros', desc: 'Cartões com receitas, despesas, lucro líquido, saldo e contas a receber' },
    { key: 'commercial', label: 'Painel Comercial & Pipeline', desc: 'Banner de oportunidades abertas, taxa de conversão e ticket médio' },
    { key: 'cashflow', label: 'Gráfico de Fluxo de Caixa', desc: 'Projeção financeira com alternador de período (7d, 30d, 90d, mês, trimestre)' },
    { key: 'projects', label: 'Projetos em Andamento', desc: 'Resumo dos projetos mais recentes e suas barras de progresso' },
    { key: 'deliveries', label: 'Próximas Entregas', desc: 'Demandas e entregáveis com prioridades e checklists operacionais' }
  ];

  const content = `
    <div class="space-y-4">
      <p class="text-xs text-zinc-500">Escolha os blocos e módulos que você deseja ver na sua central de comando.</p>
      <div class="space-y-2.5 max-h-[60vh] overflow-y-auto pr-1">
        ${widgetList.map(w => `
          <label class="flex items-start gap-3 p-3 rounded-xl border border-zinc-200/80 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-850/60 cursor-pointer transition-colors">
            <input type="checkbox" id="widget-toggle-${w.key}" ${widgets[w.key] !== false ? 'checked' : ''} class="mt-0.5 rounded text-blue-600 focus:ring-blue-500 h-4 w-4">
            <div class="flex-1">
              <span class="text-xs font-semibold text-zinc-900 dark:text-zinc-100 block">${w.label}</span>
              <span class="text-[11px] text-zinc-400 block mt-0.5">${w.desc}</span>
            </div>
          </label>
        `).join('')}
      </div>
      <div class="flex justify-end gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
        <button id="save-widgets-btn" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition-colors">
          Salvar Preferências
        </button>
      </div>
    </div>
  `;

  const { panel, close } = modal.open({
    title: '⚙ Personalizar Painel de Comando',
    content,
    size: 'md'
  });

  panel.querySelector('#save-widgets-btn').onclick = () => {
    const updated = {};
    widgetList.forEach(w => {
      const chk = panel.querySelector(`#widget-toggle-${w.key}`);
      updated[w.key] = chk ? chk.checked : true;
    });

    store.updateDashboardWidgets(updated);
    toast.success('Configuração do painel salva com sucesso!');
    close();
    renderDashboardView(container, onNavigate);
  };
}
