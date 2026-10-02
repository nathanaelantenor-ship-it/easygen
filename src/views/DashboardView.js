import { store } from '../state/store.js';
import { formatCurrency, formatDate, getStatusBadge } from '../utils/formatters.js';

export function renderDashboardView(container, onNavigate) {
  const state = store.getState();
  const metrics = store.getDashboardMetrics();

  container.innerHTML = `
    <div class="space-y-6">
      <!-- Top Bar: Title & Filter -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 class="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">Visão Geral</h2>
          <p class="text-xs text-zinc-500">Central integrada de indicadores em tempo real para seu negócio criativo.</p>
        </div>
        <div class="flex items-center gap-2">
          <select id="dashboard-period" class="px-3 py-1.5 bg-white dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-medium text-zinc-700 dark:text-zinc-300 focus:outline-none focus:border-blue-600">
            <option value="hoje">Hoje</option>
            <option value="semana">Esta Semana</option>
            <option value="mes" selected>Este Mês (Outubro)</option>
            <option value="trimestre">Este Trimestre</option>
            <option value="ano">Este Ano</option>
          </select>
          <button id="dashboard-refresh-btn" class="p-2 bg-white dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600 rounded-xl text-zinc-600 dark:text-zinc-400 text-xs transition-colors" title="Atualizar dados">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
          </button>
        </div>
      </div>

      <!-- Financial KPI Cards -->
      <div>
        <div class="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-3 px-1">Indicadores Financeiros</div>
        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div class="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-2xs">
            <div class="text-[11px] font-medium text-zinc-500">Receita do Mês</div>
            <div class="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100 mt-1">${formatCurrency(metrics.financial.income)}</div>
            <div class="text-[10px] text-emerald-600 font-medium mt-1 flex items-center gap-1">
              <span>↑ 18%</span> vs anterior
            </div>
          </div>

          <div class="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-2xs">
            <div class="text-[11px] font-medium text-zinc-500">Despesas</div>
            <div class="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100 mt-1">${formatCurrency(metrics.financial.expenses)}</div>
            <div class="text-[10px] text-zinc-400 font-medium mt-1">Custos operacionais</div>
          </div>

          <div class="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-2xs">
            <div class="text-[11px] font-medium text-zinc-500">Lucro Líquido</div>
            <div class="text-base sm:text-lg font-bold text-blue-600 dark:text-blue-400 mt-1">${formatCurrency(metrics.financial.profit)}</div>
            <div class="text-[10px] text-emerald-600 font-medium mt-1">Margem saudável</div>
          </div>

          <div class="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-2xs">
            <div class="text-[11px] font-medium text-zinc-500">Saldo Atual</div>
            <div class="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100 mt-1">${formatCurrency(metrics.financial.balance)}</div>
            <div class="text-[10px] text-zinc-400 font-medium mt-1">Disponível em caixa</div>
          </div>

          <div class="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-2xs">
            <div class="text-[11px] font-medium text-zinc-500">A Receber</div>
            <div class="text-base sm:text-lg font-bold text-indigo-600 dark:text-indigo-400 mt-1">${formatCurrency(metrics.financial.receivable)}</div>
            <div class="text-[10px] text-zinc-400 font-medium mt-1">Faturas pendentes</div>
          </div>

          <div class="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-2xs">
            <div class="text-[11px] font-medium text-zinc-500">A Pagar</div>
            <div class="text-base sm:text-lg font-bold text-rose-600 dark:text-rose-400 mt-1">${formatCurrency(metrics.financial.payable)}</div>
            <div class="text-[10px] text-zinc-400 font-medium mt-1">Próximos vencimentos</div>
          </div>
        </div>
      </div>

      <!-- Commercial & Project Indicators -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <!-- Comercial -->
        <div class="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800">
          <div class="flex items-center justify-between mb-4">
            <div>
              <h3 class="text-sm font-bold text-zinc-900 dark:text-zinc-100">Indicadores Comerciais</h3>
              <p class="text-[11px] text-zinc-400">Eficiência e conversão de propostas</p>
            </div>
            <button data-goto="crm" class="text-xs text-blue-600 hover:underline font-medium">Ver CRM →</button>
          </div>
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div class="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/40">
              <div class="text-lg font-bold text-zinc-900 dark:text-zinc-100">${metrics.commercial.inFunnel}</div>
              <div class="text-[10px] text-zinc-500 mt-0.5">Leads no Funil</div>
            </div>
            <div class="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/40">
              <div class="text-lg font-bold text-emerald-600">${metrics.commercial.converted}</div>
              <div class="text-[10px] text-zinc-500 mt-0.5">Convertidos</div>
            </div>
            <div class="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/40">
              <div class="text-lg font-bold text-blue-600">${metrics.commercial.conversionRate}%</div>
              <div class="text-[10px] text-zinc-500 mt-0.5">Conversão</div>
            </div>
            <div class="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/40">
              <div class="text-xs font-bold text-zinc-900 dark:text-zinc-100 mt-1">${formatCurrency(metrics.commercial.negotiatingProposalValue)}</div>
              <div class="text-[10px] text-zinc-500 mt-0.5">Em Negociação</div>
            </div>
          </div>
        </div>

        <!-- Projetos -->
        <div class="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800">
          <div class="flex items-center justify-between mb-4">
            <div>
              <h3 class="text-sm font-bold text-zinc-900 dark:text-zinc-100">Indicadores de Projetos</h3>
              <p class="text-[11px] text-zinc-400">Status das entregas criativas</p>
            </div>
            <button data-goto="projects" class="text-xs text-blue-600 hover:underline font-medium">Ver Projetos →</button>
          </div>
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div class="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/40">
              <div class="text-lg font-bold text-blue-600">${metrics.projects.active}</div>
              <div class="text-[10px] text-zinc-500 mt-0.5">Projetos Ativos</div>
            </div>
            <div class="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/40">
              <div class="text-lg font-bold text-rose-600">${metrics.projects.urgent}</div>
              <div class="text-[10px] text-zinc-500 mt-0.5">Urgentes / Finais</div>
            </div>
            <div class="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/40">
              <div class="text-lg font-bold text-emerald-600">${metrics.projects.completed}</div>
              <div class="text-[10px] text-zinc-500 mt-0.5">Entregues</div>
            </div>
            <div class="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/40">
              <div class="text-xs font-bold text-zinc-900 dark:text-zinc-100 mt-1">${formatCurrency(metrics.projects.totalRevenue)}</div>
              <div class="text-[10px] text-zinc-500 mt-0.5">Valor em Carteira</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Charts Section -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <!-- Gráfico Financeiro -->
        <div class="lg:col-span-2 p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800">
          <div class="flex items-center justify-between mb-4">
            <div>
              <h3 class="text-sm font-bold text-zinc-900 dark:text-zinc-100">Evolução de Receitas vs Despesas</h3>
              <p class="text-[11px] text-zinc-400">Comparativo do fluxo dos últimos meses</p>
            </div>
            <span class="text-xs font-medium text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md">Positivo</span>
          </div>
          <div class="h-64 relative">
            <canvas id="chart-dashboard-finance"></canvas>
          </div>
        </div>

        <!-- Funil Comercial -->
        <div class="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800">
          <div class="flex items-center justify-between mb-4">
            <div>
              <h3 class="text-sm font-bold text-zinc-900 dark:text-zinc-100">Funil de Vendas</h3>
              <p class="text-[11px] text-zinc-400">Distribuição de leads por estágio</p>
            </div>
          </div>
          <div class="h-64 relative flex items-center justify-center">
            <canvas id="chart-dashboard-funnel"></canvas>
          </div>
        </div>
      </div>

      <!-- Bottom Grids: Recent Transactions and Key Projects -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <!-- Lançamentos Recentes -->
        <div class="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-sm font-bold text-zinc-900 dark:text-zinc-100">Últimos Lançamentos</h3>
            <button data-goto="finance" class="text-xs text-blue-600 hover:underline font-medium">Ver Financeiro →</button>
          </div>
          <div class="divide-y divide-zinc-100 dark:divide-zinc-800">
            ${state.transactions.slice(0, 5).map(tx => `
              <div class="py-3 flex items-center justify-between text-xs">
                <div>
                  <div class="font-medium text-zinc-800 dark:text-zinc-200">${tx.title}</div>
                  <div class="text-[11px] text-zinc-400">${formatDate(tx.date)} • ${tx.category}</div>
                </div>
                <div class="font-semibold ${tx.type === 'income' ? 'text-emerald-600' : 'text-zinc-900 dark:text-zinc-100'}">
                  ${tx.type === 'income' ? '+' : '-'}${formatCurrency(tx.amount)}
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Projetos Recentes -->
        <div class="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-sm font-bold text-zinc-900 dark:text-zinc-100">Projetos em Destaque</h3>
            <button data-goto="projects" class="text-xs text-blue-600 hover:underline font-medium">Ver Todos →</button>
          </div>
          <div class="space-y-3">
            ${state.projects.slice(0, 4).map(proj => {
              const completedTasks = proj.tasks ? proj.tasks.filter(t => t.completed).length : 0;
              const totalTasks = proj.tasks ? proj.tasks.length : 1;
              const percent = Math.round((completedTasks / totalTasks) * 100);
              return `
                <div class="p-3 rounded-xl border border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-850/50">
                  <div class="flex items-center justify-between text-xs mb-1.5">
                    <span class="font-semibold text-zinc-800 dark:text-zinc-200">${proj.title}</span>
                    ${getStatusBadge(proj.stage)}
                  </div>
                  <div class="flex items-center justify-between text-[11px] text-zinc-400 mb-2">
                    <span>${proj.clientName}</span>
                    <span>Prazo: ${formatDate(proj.deadlineDate)}</span>
                  </div>
                  <div class="w-full bg-zinc-200 dark:bg-zinc-700 h-1.5 rounded-full overflow-hidden">
                    <div class="bg-blue-600 h-full rounded-full transition-all" style="width: ${percent}%"></div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      </div>
    </div>
  `;

  // Attach navigation buttons
  container.querySelectorAll('[data-goto]').forEach(btn => {
    btn.onclick = () => {
      const target = btn.getAttribute('data-goto');
      if (onNavigate) onNavigate(target);
    };
  });

  // Render Charts with Chart.js
  setTimeout(() => {
    renderDashboardCharts();
  }, 50);
}

function renderDashboardCharts() {
  if (!window.Chart) return;

  // Chart Finance
  const ctxFinance = document.getElementById('chart-dashboard-finance');
  if (ctxFinance) {
    new window.Chart(ctxFinance, {
      type: 'bar',
      data: {
        labels: ['Jun', 'Jul', 'Ago', 'Set', 'Out'],
        datasets: [
          {
            label: 'Receitas',
            data: [9200, 11500, 10800, 13000, 14000],
            backgroundColor: '#0000FF',
            borderRadius: 6
          },
          {
            label: 'Despesas',
            data: [2100, 2400, 2300, 2800, 3100],
            backgroundColor: '#E5E7EB',
            borderRadius: 6
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'top', labels: { boxWidth: 12, font: { size: 11 } } }
        },
        scales: {
          x: { grid: { display: false } },
          y: { grid: { color: 'rgba(0,0,0,0.05)' } }
        }
      }
    });
  }

  // Chart Funnel
  const ctxFunnel = document.getElementById('chart-dashboard-funnel');
  if (ctxFunnel) {
    const leads = store.getState().leads;
    const stages = [
      { label: 'Novos', count: leads.filter(l => l.status === 'novo').length },
      { label: 'Contato', count: leads.filter(l => l.status === 'contato').length },
      { label: 'Diagnóstico', count: leads.filter(l => l.status === 'diagnostico').length },
      { label: 'Proposta', count: leads.filter(l => l.status === 'orcamento').length },
      { label: 'Negociação', count: leads.filter(l => l.status === 'negociacao').length },
      { label: 'Aprovados', count: leads.filter(l => l.status === 'aprovado').length }
    ];

    new window.Chart(ctxFunnel, {
      type: 'doughnut',
      data: {
        labels: stages.map(s => s.label),
        datasets: [{
          data: stages.map(s => s.count),
          backgroundColor: ['#3B82F6', '#6366F1', '#8B5CF6', '#F59E0B', '#F97316', '#10B981'],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 10 } } }
        }
      }
    });
  }
}
