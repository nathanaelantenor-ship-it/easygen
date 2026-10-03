import { store } from '../state/store.js';
import { modal } from '../components/Modal.js';
import { toast } from '../components/Toast.js';
import { formatCurrency, formatDate } from '../utils/formatters.js';
import { renderExportButtonHtml, bindExportButton } from '../components/ExportMenu.js';

let activeScope = 'business'; // business | personal
let financeSubView = 'visao_geral'; // visao_geral | contas_receber | contas_pagar | extrato
let filterTxType = 'all'; // all | income | expense
let financeCashflowPeriod = '30d'; // 7d | 30d | current_vs_previous | 90d | 6m | 12m

export function renderFinanceView(container, onNavigate) {
  const { transactions, categories, clients, projects, recurringRules = [] } = store.getState();

  const scopedTxs = transactions.filter(t => t.scope === activeScope && t.status !== 'cancelled');
  const filteredTxs = filterTxType === 'all'
    ? scopedTxs
    : scopedTxs.filter(t => t.type === filterTxType);

  const todayStr = new Date().toISOString().split('T')[0];

  // Global totals (paid)
  const paidIncome = scopedTxs.filter(t => t.type === 'income' && t.status === 'paid').reduce((acc, t) => acc + (t.amount || 0), 0);
  const paidExpense = scopedTxs.filter(t => t.type === 'expense' && t.status === 'paid').reduce((acc, t) => acc + (t.amount || 0), 0);
  const netBalance = paidIncome - paidExpense;

  // Receivables
  const pendingIncome = scopedTxs.filter(t => t.type === 'income' && t.status === 'pending');
  const overdueIncome = pendingIncome.filter(t => (t.dueDate || t.date) < todayStr);
  const futureIncome = pendingIncome.filter(t => (t.dueDate || t.date) >= todayStr);

  const totalOverdueIncome = overdueIncome.reduce((acc, t) => acc + (t.amount || 0), 0);
  const totalFutureIncome = futureIncome.reduce((acc, t) => acc + (t.amount || 0), 0);

  // Payables
  const pendingExpense = scopedTxs.filter(t => t.type === 'expense' && t.status === 'pending');
  const overdueExpense = pendingExpense.filter(t => (t.dueDate || t.date) < todayStr);
  const futureExpense = pendingExpense.filter(t => (t.dueDate || t.date) >= todayStr);

  const totalOverdueExpense = overdueExpense.reduce((acc, t) => acc + (t.amount || 0), 0);
  const totalFutureExpense = futureExpense.reduce((acc, t) => acc + (t.amount || 0), 0);

  container.innerHTML = `
    <div class="space-y-6">
      <!-- Header & Scope Toggle -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 class="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">Controle Financeiro</h2>
          <p class="text-xs text-zinc-500">Gestão de fluxo de caixa, recorrências reais, contas a receber/pagar e segregação PJ vs PF.</p>
        </div>

        <div class="flex items-center gap-3 flex-wrap">
          <!-- Scope Switcher (Empresa vs Pessoal) -->
          <div class="flex items-center p-1 bg-zinc-100 dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700">
            <button id="scope-business-btn" class="px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors ${activeScope === 'business' ? 'bg-blue-600 text-white shadow-2xs' : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'}">Empresa (PJ)</button>
            <button id="scope-personal-btn" class="px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors ${activeScope === 'personal' ? 'bg-blue-600 text-white shadow-2xs' : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'}">Pessoal (PF)</button>
          </div>

          <div class="flex items-center gap-1.5">
            ${renderExportButtonHtml('finance-export-dropdown', 'Exportar')}
            <button id="finance-new-income-btn" class="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold transition-colors shadow-xs">
              + Receita
            </button>
            <button id="finance-new-expense-btn" class="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold transition-colors shadow-xs">
              - Despesa
            </button>
          </div>
        </div>
      </div>

      <!-- Financial Sub-Views Tabs -->
      <div class="flex items-center gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-2 text-xs font-medium overflow-x-auto">
        <button id="fsub-overview" class="fsub-tab px-3.5 py-1.5 rounded-xl transition-colors ${financeSubView === 'visao_geral' ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-bold shadow-2xs' : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'}">
          Visão Geral & Fluxo
        </button>
        <button id="fsub-receivables" class="fsub-tab px-3.5 py-1.5 rounded-xl transition-colors ${financeSubView === 'contas_receber' ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-bold shadow-2xs' : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'}">
          Contas a Receber (${pendingIncome.length})
        </button>
        <button id="fsub-payables" class="fsub-tab px-3.5 py-1.5 rounded-xl transition-colors ${financeSubView === 'contas_pagar' ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-bold shadow-2xs' : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'}">
          Contas a Pagar (${pendingExpense.length})
        </button>
        <button id="fsub-extrato" class="fsub-tab px-3.5 py-1.5 rounded-xl transition-colors ${financeSubView === 'extrato' ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-bold shadow-2xs' : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'}">
          Extrato Completo (${scopedTxs.length})
        </button>
      </div>

      <!-- Subview Content Area -->
      <div id="finance-subview-content"></div>
    </div>
  `;

  const subviewContent = container.querySelector('#finance-subview-content');

  // Subview Renderers
  function renderSubView() {
    if (financeSubView === 'visao_geral') {
      renderOverviewSubView();
    } else if (financeSubView === 'contas_receber') {
      renderReceivablesSubView();
    } else if (financeSubView === 'contas_pagar') {
      renderPayablesSubView();
    } else {
      renderExtratoSubView();
    }
  }

  function renderOverviewSubView() {
    subviewContent.innerHTML = `
      <div class="space-y-6">
        <!-- 3 Master KPIs -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div class="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-2xs">
            <div class="flex items-center justify-between text-xs font-medium text-zinc-500 mb-2">
              <span>Total de Entradas Baixadas</span>
              <span class="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            </div>
            <div class="text-xl sm:text-2xl font-bold text-emerald-600 dark:text-emerald-400">${formatCurrency(paidIncome)}</div>
            <div class="text-[11px] text-zinc-400 mt-1">${scopedTxs.filter(t => t.type === 'income' && t.status === 'paid').length} recebimentos confirmados</div>
          </div>

          <div class="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-2xs">
            <div class="flex items-center justify-between text-xs font-medium text-zinc-500 mb-2">
              <span>Total de Saídas Pagas</span>
              <span class="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
            </div>
            <div class="text-xl sm:text-2xl font-bold text-rose-600 dark:text-rose-400">${formatCurrency(paidExpense)}</div>
            <div class="text-[11px] text-zinc-400 mt-1">${scopedTxs.filter(t => t.type === 'expense' && t.status === 'paid').length} despesas liquidadas</div>
          </div>

          <div class="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-2xs">
            <div class="flex items-center justify-between text-xs font-medium text-zinc-500 mb-2">
              <span>Saldo Líquido Realizado</span>
              <span class="w-2.5 h-2.5 rounded-full ${netBalance >= 0 ? 'bg-blue-500' : 'bg-rose-500'}"></span>
            </div>
            <div class="text-xl sm:text-2xl font-bold ${netBalance >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-rose-600'}">${formatCurrency(netBalance)}</div>
            <div class="text-[11px] ${netBalance >= 0 ? 'text-emerald-600' : 'text-rose-500'} font-medium mt-1">
              ${netBalance >= 0 ? 'Disponibilidade financeira positiva' : 'Atenção ao déficit operacional'}
            </div>
          </div>
        </div>

        <!-- Charts Section (100% Real - Zero Mock Data) -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div class="lg:col-span-2 p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <div>
                <h3 class="text-xs font-bold uppercase tracking-wider text-zinc-400">Fluxo Comparativo (${activeScope === 'business' ? 'Empresa' : 'Pessoal'})</h3>
                <span class="text-xs font-semibold text-zinc-600 dark:text-zinc-400">Realizado vs Previsto</span>
              </div>

              <!-- Seletor de Período Real -->
              <div class="flex items-center p-0.5 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-[10px] font-semibold" id="finance-period-toggle">
                <button data-period="7d" class="px-2 py-1 rounded ${financeCashflowPeriod === '7d' ? 'bg-white dark:bg-zinc-700 text-blue-600 shadow-2xs' : 'text-zinc-500'}">7d</button>
                <button data-period="30d" class="px-2 py-1 rounded ${financeCashflowPeriod === '30d' ? 'bg-white dark:bg-zinc-700 text-blue-600 shadow-2xs' : 'text-zinc-500'}">30d</button>
                <button data-period="current_vs_previous" class="px-2 py-1 rounded ${financeCashflowPeriod === 'current_vs_previous' ? 'bg-white dark:bg-zinc-700 text-blue-600 shadow-2xs' : 'text-zinc-500'}">Mês Ant/Atual</button>
                <button data-period="90d" class="px-2 py-1 rounded ${financeCashflowPeriod === '90d' ? 'bg-white dark:bg-zinc-700 text-blue-600 shadow-2xs' : 'text-zinc-500'}">90d</button>
                <button data-period="6m" class="px-2 py-1 rounded ${financeCashflowPeriod === '6m' ? 'bg-white dark:bg-zinc-700 text-blue-600 shadow-2xs' : 'text-zinc-500'}">6m</button>
                <button data-period="12m" class="px-2 py-1 rounded ${financeCashflowPeriod === '12m' ? 'bg-white dark:bg-zinc-700 text-blue-600 shadow-2xs' : 'text-zinc-500'}">12m</button>
              </div>
            </div>

            <div class="h-60 relative" id="chart-finance-evolution-container">
              <canvas id="chart-finance-evolution"></canvas>
            </div>
          </div>

          <div class="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-xs font-bold uppercase tracking-wider text-zinc-400">Por Categoria</h3>
              <span class="text-[11px] text-zinc-400">Despesas e Receitas</span>
            </div>
            <div class="h-60 relative flex items-center justify-center" id="chart-finance-categories-container">
              <canvas id="chart-finance-categories"></canvas>
            </div>
          </div>
        </div>
      </div>
    `;

    // Period buttons binding
    subviewContent.querySelectorAll('#finance-period-toggle button').forEach(btn => {
      btn.onclick = () => {
        financeCashflowPeriod = btn.getAttribute('data-period');
        renderOverviewSubView();
      };
    });

    setTimeout(() => renderFinanceCharts(), 60);
  }

  function renderReceivablesSubView() {
    subviewContent.innerHTML = `
      <div class="space-y-4">
        <!-- Receivables KPIs -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div class="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-2xs">
            <span class="text-[11px] font-medium text-zinc-500 block">Já Recebido / Baixado</span>
            <div class="text-lg font-bold text-emerald-600 mt-1">${formatCurrency(paidIncome)}</div>
            <span class="text-[10px] text-zinc-400 block mt-0.5">Saldo consolidado no caixa</span>
          </div>
          <div class="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-2xs">
            <span class="text-[11px] font-medium text-zinc-500 block">Previsto a Receber</span>
            <div class="text-lg font-bold text-blue-600 mt-1">${formatCurrency(totalFutureIncome)}</div>
            <span class="text-[10px] text-zinc-400 block mt-0.5">${futureIncome.length} parcelas / ocorrências futuras</span>
          </div>
          <div class="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-2xs">
            <span class="text-[11px] font-medium text-zinc-500 block">Vencido / Atrasado</span>
            <div class="text-lg font-bold text-rose-600 mt-1">${formatCurrency(totalOverdueIncome)}</div>
            <span class="text-[10px] text-rose-500 block mt-0.5">${overdueIncome.length} cobranças em atraso</span>
          </div>
        </div>

        <!-- Receivables List -->
        <div class="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-2xs">
          <div class="p-3.5 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
            <span class="text-xs font-bold text-zinc-900 dark:text-zinc-100">Contas e Recorrências a Receber</span>
            <span class="text-xs text-zinc-400">${pendingIncome.length} pendentes</span>
          </div>

          ${pendingIncome.length === 0 ? `
            <div class="p-10 text-center text-xs text-zinc-400">
              <i class="ph ph-check-circle text-2xl text-emerald-500 block mb-1"></i>
              Nenhuma conta a receber pendente. Todas as receitas estão em dia!
            </div>
          ` : `
            <div class="overflow-x-auto">
              <table class="w-full text-left text-xs text-zinc-600 dark:text-zinc-400">
                <thead class="bg-zinc-50 dark:bg-zinc-850 text-zinc-900 dark:text-zinc-200 border-b border-zinc-200 dark:border-zinc-800 font-semibold">
                  <tr>
                    <th class="p-3.5">Título / Parcela</th>
                    <th class="p-3.5">Cliente</th>
                    <th class="p-3.5">Vencimento</th>
                    <th class="p-3.5">Status</th>
                    <th class="p-3.5 text-right">Valor</th>
                    <th class="p-3.5 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-zinc-100 dark:divide-zinc-800">
                  ${pendingIncome.map(t => {
                    const isOverdue = (t.dueDate || t.date) < todayStr;
                    return `
                      <tr class="hover:bg-zinc-50/70 dark:hover:bg-zinc-850/50 transition-colors">
                        <td class="p-3.5 font-bold text-zinc-900 dark:text-zinc-100">
                          <div class="flex items-center gap-1.5">
                            <span>${t.title}</span>
                            ${t.isRecurring ? `<span class="px-1.5 py-0.2 rounded text-[9px] bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-bold">REC</span>` : ''}
                          </div>
                          <div class="text-[10px] text-zinc-400 font-normal mt-0.5">${t.category} • ${t.paymentMethod || 'Pix'}</div>
                        </td>
                        <td class="p-3.5">${t.clientName || clients.find(c => c.id === t.clientId)?.name || '-'}</td>
                        <td class="p-3.5 font-medium ${isOverdue ? 'text-rose-600 font-bold' : ''}">
                          ${formatDate(t.dueDate || t.date)}
                        </td>
                        <td class="p-3.5">
                          <span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isOverdue 
                              ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400' 
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400'
                          }">
                            ${isOverdue ? 'ATRASADO' : 'A RECEBER'}
                          </span>
                        </td>
                        <td class="p-3.5 text-right font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                          ${formatCurrency(t.amount)}
                        </td>
                        <td class="p-3.5 text-right">
                          <div class="flex items-center justify-end gap-1.5">
                            <button class="mark-paid-action px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-2xs transition-colors" data-id="${t.id}">
                              Baixar Recebimento (+30 XP)
                            </button>
                            ${t.isRecurring ? `
                              <button class="cancel-rec-btn p-1.5 text-zinc-400 hover:text-rose-600 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800" data-rule-id="${t.recurringId}" title="Cancelar recorrência futura">
                                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
                              </button>
                            ` : ''}
                          </div>
                        </td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
            </div>
          `}
        </div>
      </div>
    `;

    subviewContent.querySelectorAll('.mark-paid-action').forEach(btn => {
      btn.onclick = () => {
        const id = btn.getAttribute('data-id');
        store.markTransactionAsPaid(id);
        toast.success('Receita marcada como paga e saldo atualizado!');
        renderFinanceView(container, onNavigate);
      };
    });

    subviewContent.querySelectorAll('.cancel-rec-btn').forEach(btn => {
      btn.onclick = () => {
        const ruleId = btn.getAttribute('data-rule-id');
        if (confirm('Deseja cancelar as próximas ocorrências desta recorrência? O histórico de recebimentos anteriores será mantido.')) {
          store.cancelRecurringRule(ruleId);
          toast.info('Recorrência cancelada para datas futuras.');
          renderFinanceView(container, onNavigate);
        }
      };
    });
  }

  function renderPayablesSubView() {
    subviewContent.innerHTML = `
      <div class="space-y-4">
        <!-- Payables KPIs -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div class="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-2xs">
            <span class="text-[11px] font-medium text-zinc-500 block">Já Pago / Liquidado</span>
            <div class="text-lg font-bold text-rose-600 mt-1">${formatCurrency(paidExpense)}</div>
            <span class="text-[10px] text-zinc-400 block mt-0.5">Despesas pagas no caixa</span>
          </div>
          <div class="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-2xs">
            <span class="text-[11px] font-medium text-zinc-500 block">Previsto a Pagar</span>
            <div class="text-lg font-bold text-amber-600 mt-1">${formatCurrency(totalFutureExpense)}</div>
            <span class="text-[10px] text-zinc-400 block mt-0.5">${futureExpense.length} compromissos / recorrências</span>
          </div>
          <div class="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-2xs">
            <span class="text-[11px] font-medium text-zinc-500 block">Despesas Vencidas</span>
            <div class="text-lg font-bold text-rose-700 mt-1">${formatCurrency(totalOverdueExpense)}</div>
            <span class="text-[10px] text-rose-500 block mt-0.5">${overdueExpense.length} contas em atraso</span>
          </div>
        </div>

        <!-- Payables List -->
        <div class="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-2xs">
          <div class="p-3.5 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
            <span class="text-xs font-bold text-zinc-900 dark:text-zinc-100">Contas e Recorrências a Pagar</span>
            <span class="text-xs text-zinc-400">${pendingExpense.length} pendentes</span>
          </div>

          ${pendingExpense.length === 0 ? `
            <div class="p-10 text-center text-xs text-zinc-400">
              <i class="ph ph-check-circle text-2xl text-emerald-500 block mb-1"></i>
              Nenhuma conta a pagar pendente. Todos os compromissos estão liquidados!
            </div>
          ` : `
            <div class="overflow-x-auto">
              <table class="w-full text-left text-xs text-zinc-600 dark:text-zinc-400">
                <thead class="bg-zinc-50 dark:bg-zinc-850 text-zinc-900 dark:text-zinc-200 border-b border-zinc-200 dark:border-zinc-800 font-semibold">
                  <tr>
                    <th class="p-3.5">Despesa / Fornecedor</th>
                    <th class="p-3.5">Categoria</th>
                    <th class="p-3.5">Vencimento</th>
                    <th class="p-3.5">Status</th>
                    <th class="p-3.5 text-right">Valor</th>
                    <th class="p-3.5 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-zinc-100 dark:divide-zinc-800">
                  ${pendingExpense.map(t => {
                    const isOverdue = (t.dueDate || t.date) < todayStr;
                    return `
                      <tr class="hover:bg-zinc-50/70 dark:hover:bg-zinc-850/50 transition-colors">
                        <td class="p-3.5 font-bold text-zinc-900 dark:text-zinc-100">
                          <div class="flex items-center gap-1.5">
                            <span>${t.title}</span>
                            ${t.isRecurring ? `<span class="px-1.5 py-0.2 rounded text-[9px] bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-bold">REC</span>` : ''}
                          </div>
                          <div class="text-[10px] text-zinc-400 font-normal mt-0.5">${t.paymentMethod || 'Boleto/Pix'}</div>
                        </td>
                        <td class="p-3.5">${t.category}</td>
                        <td class="p-3.5 font-medium ${isOverdue ? 'text-rose-600 font-bold' : ''}">
                          ${formatDate(t.dueDate || t.date)}
                        </td>
                        <td class="p-3.5">
                          <span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isOverdue 
                              ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400' 
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400'
                          }">
                            ${isOverdue ? 'VENCIDO' : 'A PAGAR'}
                          </span>
                        </td>
                        <td class="p-3.5 text-right font-bold text-rose-600 dark:text-rose-400 text-sm">
                          ${formatCurrency(t.amount)}
                        </td>
                        <td class="p-3.5 text-right">
                          <div class="flex items-center justify-end gap-1.5">
                            <button class="mark-paid-action px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold shadow-2xs transition-colors" data-id="${t.id}">
                              Confirmar Pagamento
                            </button>
                            ${t.isRecurring ? `
                              <button class="cancel-rec-btn p-1.5 text-zinc-400 hover:text-rose-600 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800" data-rule-id="${t.recurringId}" title="Cancelar recorrência futura">
                                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
                              </button>
                            ` : ''}
                          </div>
                        </td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
            </div>
          `}
        </div>
      </div>
    `;

    subviewContent.querySelectorAll('.mark-paid-action').forEach(btn => {
      btn.onclick = () => {
        const id = btn.getAttribute('data-id');
        store.updateTransaction(id, { status: 'paid', paidAt: new Date().toISOString().split('T')[0] });
        toast.success('Despesa confirmada e baixada!');
        renderFinanceView(container, onNavigate);
      };
    });

    subviewContent.querySelectorAll('.cancel-rec-btn').forEach(btn => {
      btn.onclick = () => {
        const ruleId = btn.getAttribute('data-rule-id');
        if (confirm('Deseja cancelar as próximas despesas desta recorrência? O histórico passado de pagamentos será preservado.')) {
          store.cancelRecurringRule(ruleId);
          toast.info('Recorrência de despesa cancelada.');
          renderFinanceView(container, onNavigate);
        }
      };
    });
  }

  function renderExtratoSubView() {
    subviewContent.innerHTML = `
      <div class="space-y-4">
        <!-- Filtro Rápido Tipo -->
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-1.5 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl text-xs font-medium">
            <button id="filter-type-all" class="px-3 py-1 rounded-lg ${filterTxType === 'all' ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 font-semibold shadow-2xs' : 'text-zinc-500'}">Todos</button>
            <button id="filter-type-income" class="px-3 py-1 rounded-lg ${filterTxType === 'income' ? 'bg-white dark:bg-zinc-700 text-emerald-600 font-semibold shadow-2xs' : 'text-zinc-500'}">Receitas</button>
            <button id="filter-type-expense" class="px-3 py-1 rounded-lg ${filterTxType === 'expense' ? 'bg-white dark:bg-zinc-700 text-rose-600 font-semibold shadow-2xs' : 'text-zinc-500'}">Despesas</button>
          </div>
          <span class="text-xs text-zinc-400">${filteredTxs.length} registros no extrato</span>
        </div>

        <div class="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-2xs">
          ${filteredTxs.length === 0 ? `
            <div class="p-10 text-center text-xs text-zinc-400">
              Nenhuma movimentação registrada no extrato deste perfil.
            </div>
          ` : `
            <div class="overflow-x-auto">
              <table class="w-full text-left text-xs text-zinc-600 dark:text-zinc-400">
                <thead class="bg-zinc-50 dark:bg-zinc-850 text-zinc-900 dark:text-zinc-200 border-b border-zinc-200 dark:border-zinc-800 font-semibold">
                  <tr>
                    <th class="p-3.5">Data</th>
                    <th class="p-3.5">Descrição</th>
                    <th class="p-3.5">Categoria</th>
                    <th class="p-3.5">Status</th>
                    <th class="p-3.5 text-right">Valor</th>
                    <th class="p-3.5 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-zinc-100 dark:divide-zinc-800">
                  ${filteredTxs.map(t => `
                    <tr class="hover:bg-zinc-50/70 dark:hover:bg-zinc-850/50 transition-colors">
                      <td class="p-3.5 whitespace-nowrap">${formatDate(t.date || t.dueDate)}</td>
                      <td class="p-3.5 font-bold text-zinc-900 dark:text-zinc-100">
                        <div class="flex items-center gap-1.5">
                          <span>${t.title}</span>
                          ${t.isRecurring ? `<span class="px-1.5 py-0.2 rounded text-[9px] bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-bold">REC</span>` : ''}
                        </div>
                        ${t.clientName ? `<div class="text-[10px] text-zinc-400 font-normal">Cliente: ${t.clientName}</div>` : ''}
                      </td>
                      <td class="p-3.5">${t.category}</td>
                      <td class="p-3.5">
                        <span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          t.status === 'paid' 
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400' 
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400'
                        }">
                          ${t.status === 'paid' ? 'Pago' : 'Pendente'}
                        </span>
                      </td>
                      <td class="p-3.5 text-right font-bold text-sm ${t.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}">
                        ${t.type === 'income' ? '+' : '-'} ${formatCurrency(t.amount)}
                      </td>
                      <td class="p-3.5 text-right">
                        <div class="flex items-center justify-end gap-1">
                          <button class="edit-tx-btn p-1.5 text-zinc-400 hover:text-blue-600 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800" data-id="${t.id}" title="Editar">
                            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                          </button>
                          <button class="delete-tx-btn p-1.5 text-zinc-400 hover:text-rose-600 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800" data-id="${t.id}" title="Excluir">
                            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          `}
        </div>
      </div>
    `;

    subviewContent.querySelector('#filter-type-all').onclick = () => { filterTxType = 'all'; renderExtratoSubView(); };
    subviewContent.querySelector('#filter-type-income').onclick = () => { filterTxType = 'income'; renderExtratoSubView(); };
    subviewContent.querySelector('#filter-type-expense').onclick = () => { filterTxType = 'expense'; renderExtratoSubView(); };

    subviewContent.querySelectorAll('.edit-tx-btn').forEach(btn => {
      btn.onclick = () => {
        const id = btn.getAttribute('data-id');
        openEditTransactionModal(id, () => renderFinanceView(container, onNavigate));
      };
    });

    subviewContent.querySelectorAll('.delete-tx-btn').forEach(btn => {
      btn.onclick = () => {
        const id = btn.getAttribute('data-id');
        if (confirm('Deseja realmente excluir este lançamento financeiro?')) {
          store.deleteTransaction(id);
          toast.info('Lançamento excluído com sucesso.');
          renderFinanceView(container, onNavigate);
        }
      };
    });
  }

  // Bind subview tabs
  container.querySelector('#fsub-overview').onclick = () => { financeSubView = 'visao_geral'; renderFinanceView(container, onNavigate); };
  container.querySelector('#fsub-receivables').onclick = () => { financeSubView = 'contas_receber'; renderFinanceView(container, onNavigate); };
  container.querySelector('#fsub-payables').onclick = () => { financeSubView = 'contas_pagar'; renderFinanceView(container, onNavigate); };
  container.querySelector('#fsub-extrato').onclick = () => { financeSubView = 'extrato'; renderFinanceView(container, onNavigate); };

  // Scope switcher
  container.querySelector('#scope-business-btn').onclick = () => { activeScope = 'business'; renderFinanceView(container, onNavigate); };
  container.querySelector('#scope-personal-btn').onclick = () => { activeScope = 'personal'; renderFinanceView(container, onNavigate); };

  // New buttons
  container.querySelector('#finance-new-income-btn').onclick = () => {
    openTransactionModal('income', activeScope, () => renderFinanceView(container, onNavigate));
  };
  container.querySelector('#finance-new-expense-btn').onclick = () => {
    openTransactionModal('expense', activeScope, () => renderFinanceView(container, onNavigate));
  };

  // Universal Export Dropdown
  bindExportButton(container, 'finance-export-dropdown', () => {
    const headers = ['Data', 'Título', 'Tipo', 'Categoria', 'Escopo', 'Status', 'Recorrência', 'Cliente', 'Valor (R$)'];
    const rows = filteredTxs.map(t => [
      formatDate(t.date || t.dueDate),
      t.title,
      t.type === 'income' ? 'Receita' : 'Despesa',
      t.category,
      t.scope === 'business' ? 'PJ' : 'PF',
      t.status === 'paid' ? 'Pago' : 'Pendente',
      t.isRecurring ? 'Sim' : 'Não',
      t.clientName || '-',
      (t.amount || 0).toFixed(2).replace('.', ',')
    ]);

    const summary = [
      { label: 'Total Entradas Baixadas', value: formatCurrency(paidIncome) },
      { label: 'Total Saídas Pagas', value: formatCurrency(paidExpense) },
      { label: 'Saldo Líquido Realizado', value: formatCurrency(netBalance) },
      { label: 'A Receber Previsto', value: formatCurrency(totalFutureIncome) },
      { label: 'A Pagar Previsto', value: formatCurrency(totalFutureExpense) }
    ];

    return {
      filename: `financeiro_${activeScope}_${new Date().toISOString().split('T')[0]}`,
      title: `Extrato Financeiro — ${activeScope === 'business' ? 'Empresa (PJ)' : 'Pessoal (PF)'}`,
      headers,
      rows,
      summary,
      filters: `Escopo: ${activeScope.toUpperCase()} • Tipo: ${filterTxType}`
    };
  });

  renderSubView();
}

// Renderiza Gráfico 100% Real
function renderFinanceCharts() {
  if (!window.Chart) return;

  const ctxEvol = document.getElementById('chart-finance-evolution');
  const containerEvol = document.getElementById('chart-finance-evolution-container');

  if (ctxEvol && containerEvol) {
    const cashflow = store.getFinancialCashflow(activeScope, financeCashflowPeriod);

    if (!cashflow.hasData) {
      containerEvol.innerHTML = `
        <div class="h-full flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl">
          <svg class="w-10 h-10 text-zinc-300 dark:text-zinc-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>
          <span class="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Ainda não há dados suficientes para gerar este gráfico.</span>
          <span class="text-[11px] text-zinc-400 mt-1 max-w-xs">Adicione receitas ou despesas reais para visualizar o fluxo comparativo.</span>
        </div>
      `;
    } else {
      if (window._finEvolChart) {
        window._finEvolChart.destroy();
      }

      window._finEvolChart = new window.Chart(ctxEvol, {
        type: 'bar',
        data: {
          labels: cashflow.labels,
          datasets: [
            {
              label: 'Entradas Realizadas',
              data: cashflow.realIncome,
              backgroundColor: '#10B981',
              borderRadius: 6
            },
            {
              label: 'Saídas Realizadas',
              data: cashflow.realExpense,
              backgroundColor: '#F43F5E',
              borderRadius: 6
            },
            {
              label: 'Entradas Previstas',
              data: cashflow.projectedIncome,
              backgroundColor: '#A7F3D0',
              borderRadius: 6,
              borderWidth: 1,
              borderColor: '#10B981'
            },
            {
              label: 'Saídas Previstas',
              data: cashflow.projectedExpense,
              backgroundColor: '#FECDD3',
              borderRadius: 6,
              borderWidth: 1,
              borderColor: '#F43F5E'
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'top',
              labels: { boxWidth: 10, font: { size: 10 } }
            },
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
  }

  // Gráfico de Categorias Real
  const ctxCat = document.getElementById('chart-finance-categories');
  const containerCat = document.getElementById('chart-finance-categories-container');

  if (ctxCat && containerCat) {
    const txs = store.getState().transactions.filter(t => t.scope === activeScope && t.status !== 'cancelled');
    const categoriesMap = {};
    txs.forEach(t => {
      categoriesMap[t.category] = (categoriesMap[t.category] || 0) + (t.amount || 0);
    });

    const labels = Object.keys(categoriesMap);
    const data = Object.values(categoriesMap);

    if (labels.length === 0) {
      containerCat.innerHTML = `
        <div class="text-center p-4">
          <span class="text-xs text-zinc-400">Sem categorias movimentadas no período.</span>
        </div>
      `;
    } else {
      if (window._finCatChart) {
        window._finCatChart.destroy();
      }

      window._finCatChart = new window.Chart(ctxCat, {
        type: 'doughnut',
        data: {
          labels,
          datasets: [{
            data,
            backgroundColor: ['#0000FF', '#10B981', '#6366F1', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4'],
            borderWidth: 0
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'bottom', labels: { boxWidth: 8, font: { size: 9 } } }
          }
        }
      });
    }
  }
}

// Modal de Novo Lançamento com Recorrência Real
function openTransactionModal(type, scope, onSuccess) {
  const { categories, clients, projects } = store.getState();
  const isIncome = type === 'income';
  const filteredCategories = categories.filter(c => c.type === scope);

  const content = `
    <form id="tx-full-modal-form" class="space-y-3.5">
      <div>
        <label class="block text-xs font-medium text-zinc-600 dark:text-zinc-300 mb-1">Título / Descrição *</label>
        <input required name="title" class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs text-zinc-900 dark:text-zinc-100" placeholder="${isIncome ? 'Ex: Contrato de Retainer Mensal...' : 'Ex: Assinatura Adobe Creative Cloud...'}">
      </div>

      <div class="grid grid-cols-2 gap-2">
        <div>
          <label class="block text-xs font-medium text-zinc-600 dark:text-zinc-300 mb-1">Valor Total (R$) *</label>
          <input required type="number" step="0.01" name="amount" class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs text-zinc-900 dark:text-zinc-100" placeholder="1500.00">
        </div>
        <div>
          <label class="block text-xs font-medium text-zinc-600 dark:text-zinc-300 mb-1">Data / Vencimento Inicial</label>
          <input type="date" name="date" value="${new Date().toISOString().split('T')[0]}" class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs text-zinc-900 dark:text-zinc-100">
        </div>
      </div>

      <!-- SEÇÃO DE RECORRÊNCIA REAL -->
      <div class="p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-200 dark:border-zinc-700 space-y-2.5">
        <label class="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" id="chk-is-recurring" class="rounded border-zinc-300 dark:border-zinc-700 text-blue-600 focus:ring-blue-600">
          <span class="text-xs font-bold text-zinc-900 dark:text-zinc-100">Tornar lançamento recorrente</span>
        </label>

        <div id="recurring-fields-container" class="hidden space-y-2.5 pt-1">
          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="block text-[11px] font-semibold text-zinc-500 uppercase">Frequência</label>
              <select name="frequency" class="w-full px-2.5 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs">
                <option value="mensal" selected>Mensal</option>
                <option value="semanal">Semanal</option>
                <option value="bimestral">Bimestral</option>
                <option value="trimestral">Trimestral</option>
                <option value="semestral">Semestral</option>
                <option value="anual">Anual</option>
                <option value="personalizada">Personalizada</option>
              </select>
            </div>
            <div>
              <label class="block text-[11px] font-semibold text-zinc-500 uppercase">Duração</label>
              <select id="select-duration-mode" name="durationMode" class="w-full px-2.5 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs">
                <option value="occurrences" selected>Número de ocorrências</option>
                <option value="until_date">Até uma data final</option>
                <option value="infinite">Sem término (Contínuo)</option>
              </select>
            </div>
          </div>

          <div id="occurrences-count-group">
            <label class="block text-[11px] font-semibold text-zinc-500 uppercase">Número de Meses / Parcelas</label>
            <input type="number" min="1" max="60" name="occurrencesCount" value="6" class="w-full px-2.5 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs" placeholder="Ex: 6 para 6 meses">
          </div>

          <div id="end-date-group" class="hidden">
            <label class="block text-[11px] font-semibold text-zinc-500 uppercase">Data de Término</label>
            <input type="date" name="endDate" class="w-full px-2.5 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs">
          </div>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-2">
        <div>
          <label class="block text-xs font-medium text-zinc-600 dark:text-zinc-300 mb-1">Status Inicial</label>
          <select name="status" class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs">
            <option value="pending" selected>Pendente (A Receber / A Pagar)</option>
            <option value="paid">Já Pago (Baixado)</option>
          </select>
        </div>
        <div>
          <label class="block text-xs font-medium text-zinc-600 dark:text-zinc-300 mb-1">Forma de Pagamento</label>
          <select name="paymentMethod" class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs">
            <option value="Pix">Pix</option>
            <option value="Boleto">Boleto</option>
            <option value="Cartão de Crédito">Cartão de Crédito</option>
            <option value="Transferência">Transferência</option>
          </select>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-2">
        <div>
          <label class="block text-xs font-medium text-zinc-600 dark:text-zinc-300 mb-1">Categoria</label>
          <select name="category" class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs">
            ${filteredCategories.map(c => `<option value="${c.name}">${c.name}</option>`).join('')}
          </select>
        </div>
        ${scope === 'business' ? `
          <div>
            <label class="block text-xs font-medium text-zinc-600 dark:text-zinc-300 mb-1">Cliente Vinculado</label>
            <select name="clientId" class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs">
              <option value="">Nenhum</option>
              ${clients.map(c => `<option value="${c.id}">${c.name} (${c.company || 'PF'})</option>`).join('')}
            </select>
          </div>
        ` : '<div></div>'}
      </div>

      ${scope === 'business' ? `
        <div>
          <label class="block text-xs font-medium text-zinc-600 dark:text-zinc-300 mb-1">Projeto Vinculado (Opcional)</label>
          <select name="projectId" class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs">
            <option value="">Nenhum</option>
            ${projects.map(p => `<option value="${p.id}">${p.title}</option>`).join('')}
          </select>
        </div>
      ` : ''}

      <div>
        <label class="block text-xs font-medium text-zinc-600 dark:text-zinc-300 mb-1">Observações</label>
        <textarea name="notes" rows="2" class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs resize-none" placeholder="Instruções ou referências de faturamento..."></textarea>
      </div>

      <div class="pt-2 flex justify-end gap-2">
        <button type="submit" class="px-4 py-2 ${isIncome ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'} text-white rounded-xl text-xs font-semibold transition-colors">
          ${isIncome ? 'Confirmar Receita' : 'Confirmar Despesa'}
        </button>
      </div>
    </form>
  `;

  const m = modal.open({
    title: isIncome ? `Nova Receita (${scope.toUpperCase()})` : `Nova Despesa (${scope.toUpperCase()})`,
    content,
    size: 'md'
  });

  const form = m.panel.querySelector('#tx-full-modal-form');
  const chkRecurring = form.querySelector('#chk-is-recurring');
  const recurringContainer = form.querySelector('#recurring-fields-container');
  const selectDuration = form.querySelector('#select-duration-mode');
  const occGroup = form.querySelector('#occurrences-count-group');
  const endGroup = form.querySelector('#end-date-group');

  chkRecurring.onchange = () => {
    recurringContainer.classList.toggle('hidden', !chkRecurring.checked);
  };

  selectDuration.onchange = () => {
    if (selectDuration.value === 'occurrences') {
      occGroup.classList.remove('hidden');
      endGroup.classList.add('hidden');
    } else if (selectDuration.value === 'until_date') {
      occGroup.classList.add('hidden');
      endGroup.classList.remove('hidden');
    } else {
      occGroup.classList.add('hidden');
      endGroup.classList.add('hidden');
    }
  };

  form.onsubmit = (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const clientId = fd.get('clientId');
    const client = clients.find(c => c.id === clientId);

    if (chkRecurring.checked) {
      const res = store.addRecurringRule({
        title: fd.get('title'),
        type,
        scope,
        amount: parseFloat(fd.get('amount')) || 0,
        startDate: fd.get('date'),
        endDate: fd.get('endDate') || null,
        durationMode: fd.get('durationMode'),
        occurrencesCount: fd.get('occurrencesCount'),
        frequency: fd.get('frequency'),
        category: fd.get('category'),
        paymentMethod: fd.get('paymentMethod'),
        initialStatus: fd.get('status'),
        clientId: clientId || null,
        clientName: client ? client.name : null,
        projectId: fd.get('projectId') || null,
        notes: fd.get('notes')
      });
      toast.success(`Recorrência criada com ${res.occurrences.length} ocorrências geradas!`);
    } else {
      store.addTransaction({
        title: fd.get('title'),
        type,
        scope,
        amount: parseFloat(fd.get('amount')) || 0,
        date: fd.get('date'),
        dueDate: fd.get('date'),
        status: fd.get('status'),
        category: fd.get('category'),
        paymentMethod: fd.get('paymentMethod'),
        clientId: clientId || null,
        clientName: client ? client.name : null,
        projectId: fd.get('projectId') || null,
        notes: fd.get('notes')
      });
      toast.success(isIncome ? 'Receita lançada e saldo atualizado!' : 'Despesa registrada!');
    }

    m.close();
    if (onSuccess) onSuccess();
  };
}

// Modal de Edição de Lançamento (com opções de recorrência)
function openEditTransactionModal(txId, onSuccess) {
  const { transactions, categories } = store.getState();
  const tx = transactions.find(t => t.id === txId);
  if (!tx) return;

  const content = `
    <form id="tx-edit-modal-form" class="space-y-3.5">
      <div>
        <label class="block text-xs font-medium text-zinc-600 dark:text-zinc-300 mb-1">Título *</label>
        <input required name="title" value="${tx.title || ''}" class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs text-zinc-900 dark:text-zinc-100">
      </div>
      <div class="grid grid-cols-2 gap-2">
        <div>
          <label class="block text-xs font-medium text-zinc-600 dark:text-zinc-300 mb-1">Valor (R$) *</label>
          <input required type="number" step="0.01" name="amount" value="${tx.amount || 0}" class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs text-zinc-900 dark:text-zinc-100">
        </div>
        <div>
          <label class="block text-xs font-medium text-zinc-600 dark:text-zinc-300 mb-1">Vencimento / Data</label>
          <input type="date" name="date" value="${tx.date || tx.dueDate}" class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs text-zinc-900 dark:text-zinc-100">
        </div>
      </div>
      <div class="grid grid-cols-2 gap-2">
        <div>
          <label class="block text-xs font-medium text-zinc-600 dark:text-zinc-300 mb-1">Categoria</label>
          <select name="category" class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs">
            ${categories.filter(c => c.type === tx.scope).map(c => `<option value="${c.name}" ${c.name === tx.category ? 'selected' : ''}>${c.name}</option>`).join('')}
          </select>
        </div>
        <div>
          <label class="block text-xs font-medium text-zinc-600 dark:text-zinc-300 mb-1">Status</label>
          <select name="status" class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs">
            <option value="paid" ${tx.status === 'paid' ? 'selected' : ''}>Já Pago</option>
            <option value="pending" ${tx.status === 'pending' ? 'selected' : ''}>Pendente</option>
          </select>
        </div>
      </div>

      ${tx.isRecurring ? `
        <div class="p-3 bg-purple-50 dark:bg-purple-950/30 rounded-xl border border-purple-200 dark:border-purple-800/40">
          <label class="block text-[11px] font-bold text-purple-900 dark:text-purple-300 uppercase mb-1">Este lançamento faz parte de uma recorrência</label>
          <p class="text-[11px] text-zinc-500 mb-2">O que deseja alterar?</p>
          <div class="space-y-1.5 text-xs text-zinc-700 dark:text-zinc-300">
            <label class="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="editScope" value="single" checked class="text-purple-600">
              <span>Somente este lançamento</span>
            </label>
            <label class="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="editScope" value="future" class="text-purple-600">
              <span>Este e os próximos não pagos</span>
            </label>
            <label class="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="editScope" value="all" class="text-purple-600">
              <span>Toda a recorrência</span>
            </label>
          </div>
        </div>
      ` : ''}

      <div class="pt-2 flex justify-end gap-2">
        <button type="submit" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold">Salvar Alterações</button>
      </div>
    </form>
  `;

  const m = modal.open({
    title: `Editar Lançamento`,
    content,
    size: 'md'
  });

  m.panel.querySelector('#tx-edit-modal-form').onsubmit = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const updates = {
      title: fd.get('title'),
      amount: parseFloat(fd.get('amount')) || 0,
      date: fd.get('date'),
      dueDate: fd.get('date'),
      category: fd.get('category'),
      status: fd.get('status')
    };

    if (tx.isRecurring) {
      const editScope = fd.get('editScope') || 'single';
      store.updateRecurringTransaction(txId, updates, editScope);
    } else {
      store.updateTransaction(txId, updates);
    }

    toast.success('Lançamento atualizado!');
    m.close();
    if (onSuccess) onSuccess();
  };
}
