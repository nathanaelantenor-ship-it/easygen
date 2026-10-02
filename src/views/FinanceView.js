import { store } from '../state/store.js';
import { modal } from '../components/Modal.js';
import { toast } from '../components/Toast.js';
import { formatCurrency, formatDate } from '../utils/formatters.js';
import { exportToCSV } from '../utils/exportUtils.js';

let activeScope = 'business'; // business | personal
let financeSubView = 'visao_geral'; // visao_geral | contas_receber | contas_pagar | extrato
let filterTxType = 'all'; // all | income | expense

export function renderFinanceView(container, onNavigate) {
  const { transactions, categories, clients, projects } = store.getState();

  const scopedTxs = transactions.filter(t => t.scope === activeScope);
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
          <p class="text-xs text-zinc-500">Gestão de fluxo de caixa, contas a receber/pagar, parcelamentos e segregação PJ vs PF.</p>
        </div>

        <div class="flex items-center gap-3">
          <!-- Scope Switcher (Empresa vs Pessoal) -->
          <div class="flex items-center p-1 bg-zinc-100 dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700">
            <button id="scope-business-btn" class="px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors ${activeScope === 'business' ? 'bg-blue-600 text-white shadow-2xs' : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'}">Empresa (PJ)</button>
            <button id="scope-personal-btn" class="px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors ${activeScope === 'personal' ? 'bg-blue-600 text-white shadow-2xs' : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'}">Pessoal (PF)</button>
          </div>

          <div class="flex items-center gap-1.5">
            <button id="finance-export-btn" class="px-3 py-1.5 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-xl text-xs font-medium text-zinc-700 dark:text-zinc-300 transition-colors">
              Exportar
            </button>
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

        <!-- Charts Section -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div class="lg:col-span-2 p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-xs font-bold uppercase tracking-wider text-zinc-400">Fluxo Comparativo (${activeScope === 'business' ? 'Empresa' : 'Pessoal'})</h3>
              <span class="text-xs font-semibold text-zinc-600 dark:text-zinc-400">Entradas vs Saídas</span>
            </div>
            <div class="h-56 relative">
              <canvas id="chart-finance-evolution"></canvas>
            </div>
          </div>

          <div class="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-xs font-bold uppercase tracking-wider text-zinc-400">Por Categoria</h3>
            </div>
            <div class="h-56 relative flex items-center justify-center">
              <canvas id="chart-finance-categories"></canvas>
            </div>
          </div>
        </div>
      </div>
    `;

    setTimeout(() => renderFinanceCharts(scopedTxs), 50);
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
            <span class="text-[10px] text-zinc-400 block mt-0.5">${futureIncome.length} parcelas / recebimentos futuros</span>
          </div>
          <div class="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-2xs">
            <span class="text-[11px] font-medium text-zinc-500 block">Vencido / Atrasado</span>
            <div class="text-lg font-bold text-rose-600 mt-1">${formatCurrency(totalOverdueIncome)}</div>
            <span class="text-[10px] text-rose-500 block mt-0.5">${overdueIncome.length} cobranças em atraso</span>
          </div>
        </div>

        <!-- Receivables List -->
        <div class="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-2xs">
          <div class="p-3 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
            <span class="text-xs font-bold text-zinc-900 dark:text-zinc-100">Contas e Parcelas a Receber</span>
            <span class="text-xs text-zinc-400">${pendingIncome.length} pendentes</span>
          </div>

          ${pendingIncome.length === 0 ? `
            <div class="p-8 text-center text-xs text-zinc-400">
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
                          <div>${t.title}</div>
                          <div class="text-[10px] text-zinc-400">${t.category} • ${t.paymentMethod || 'Pix'}</div>
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
                          <button class="mark-paid-action px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-2xs transition-colors" data-id="${t.id}">
                            Baixar Recebimento (+30 XP)
                          </button>
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
        toast.success('Recebimento baixado com sucesso! (+30 XP)');
        renderFinanceView(container, onNavigate);
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
            <div class="text-lg font-bold text-zinc-900 dark:text-zinc-100 mt-1">${formatCurrency(paidExpense)}</div>
            <span class="text-[10px] text-zinc-400 block mt-0.5">Despesas pagas no período</span>
          </div>
          <div class="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-2xs">
            <span class="text-[11px] font-medium text-zinc-500 block">Previsto a Pagar</span>
            <div class="text-lg font-bold text-orange-600 mt-1">${formatCurrency(totalFutureExpense)}</div>
            <span class="text-[10px] text-zinc-400 block mt-0.5">${futureExpense.length} compromissos futuros</span>
          </div>
          <div class="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-2xs">
            <span class="text-[11px] font-medium text-zinc-500 block">Vencido / A Pagar Urgente</span>
            <div class="text-lg font-bold text-rose-600 mt-1">${formatCurrency(totalOverdueExpense)}</div>
            <span class="text-[10px] text-rose-500 block mt-0.5">${overdueExpense.length} contas vencidas</span>
          </div>
        </div>

        <!-- Payables List -->
        <div class="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-2xs">
          <div class="p-3 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
            <span class="text-xs font-bold text-zinc-900 dark:text-zinc-100">Contas e Despesas a Pagar</span>
            <span class="text-xs text-zinc-400">${pendingExpense.length} pendentes</span>
          </div>

          ${pendingExpense.length === 0 ? `
            <div class="p-8 text-center text-xs text-zinc-400">
              Nenhuma conta a pagar pendente. Todos os pagamentos estão liquidados!
            </div>
          ` : `
            <div class="overflow-x-auto">
              <table class="w-full text-left text-xs text-zinc-600 dark:text-zinc-400">
                <thead class="bg-zinc-50 dark:bg-zinc-850 text-zinc-900 dark:text-zinc-200 border-b border-zinc-200 dark:border-zinc-800 font-semibold">
                  <tr>
                    <th class="p-3.5">Título / Fornecedor</th>
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
                          <div>${t.title}</div>
                          <div class="text-[10px] text-zinc-400">${t.paymentMethod || 'Pix'}</div>
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
                            ${isOverdue ? 'VENCIDA' : 'A PAGAR'}
                          </span>
                        </td>
                        <td class="p-3.5 text-right font-bold text-rose-600 text-sm">
                          ${formatCurrency(t.amount)}
                        </td>
                        <td class="p-3.5 text-right">
                          <button class="mark-paid-action px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold shadow-2xs transition-colors" data-id="${t.id}">
                            Confirmar Pagamento
                          </button>
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
        toast.success('Despesa confirmada como paga!');
        renderFinanceView(container, onNavigate);
      };
    });
  }

  function renderExtratoSubView() {
    subviewContent.innerHTML = `
      <div class="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-2xs">
        <div class="flex items-center justify-between p-3 border-b border-zinc-100 dark:border-zinc-800 overflow-x-auto text-xs">
          <div class="flex items-center gap-1.5">
            <button data-type="all" class="px-3 py-1 rounded-lg font-medium transition-colors ${filterTxType === 'all' ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900' : 'text-zinc-500 hover:text-zinc-800'}">Todos</button>
            <button data-type="income" class="px-3 py-1 rounded-lg font-medium transition-colors ${filterTxType === 'income' ? 'bg-emerald-600 text-white' : 'text-zinc-500 hover:text-zinc-800'}">Receitas</button>
            <button data-type="expense" class="px-3 py-1 rounded-lg font-medium transition-colors ${filterTxType === 'expense' ? 'bg-rose-600 text-white' : 'text-zinc-500 hover:text-zinc-800'}">Despesas</button>
          </div>
          <span class="text-xs text-zinc-400">${filteredTxs.length} lançamentos</span>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs text-zinc-600 dark:text-zinc-400">
            <thead class="bg-zinc-50 dark:bg-zinc-850 text-zinc-900 dark:text-zinc-200 border-b border-zinc-200 dark:border-zinc-800 font-semibold">
              <tr>
                <th class="p-3.5">Título / Descrição</th>
                <th class="p-3.5">Categoria</th>
                <th class="p-3.5">Cliente / Vínculo</th>
                <th class="p-3.5">Data</th>
                <th class="p-3.5">Status</th>
                <th class="p-3.5 text-right">Valor</th>
                <th class="p-3.5 text-right">Ação</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-zinc-100 dark:divide-zinc-800">
              ${filteredTxs.map(t => `
                <tr class="hover:bg-zinc-50/70 dark:hover:bg-zinc-850/50 transition-colors">
                  <td class="p-3.5 font-medium text-zinc-900 dark:text-zinc-100">
                    <div>${t.title}</div>
                    ${t.notes ? `<div class="text-[10px] text-zinc-400">${t.notes}</div>` : ''}
                  </td>
                  <td class="p-3.5">
                    <span class="px-2 py-0.5 rounded-full text-[11px] font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                      ${t.category}
                    </span>
                  </td>
                  <td class="p-3.5">${t.clientName || (t.clientId ? clients.find(c => c.id === t.clientId)?.name : '-') || '-'}</td>
                  <td class="p-3.5">${formatDate(t.date || t.dueDate)}</td>
                  <td class="p-3.5">
                    <span class="px-2 py-0.5 rounded text-[10px] font-bold ${
                      t.status === 'paid' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400' : 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400'
                    }">${(t.status || 'paid').toUpperCase()}</span>
                  </td>
                  <td class="p-3.5 text-right font-bold ${t.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-900 dark:text-zinc-100'}">
                    ${t.type === 'income' ? '+' : '-'}${formatCurrency(t.amount)}
                  </td>
                  <td class="p-3.5 text-right space-x-1">
                    ${t.status === 'pending' ? `
                      <button data-mark-paid="${t.id}" class="px-2 py-1 bg-emerald-600 text-white rounded text-[10px] font-semibold hover:bg-emerald-700">Baixar</button>
                    ` : ''}
                    <button data-delete-tx="${t.id}" class="text-zinc-400 hover:text-rose-600 p-1" title="Excluir">
                      <svg class="w-4 h-4 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                    </button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;

    // Filter type
    subviewContent.querySelectorAll('button[data-type]').forEach(btn => {
      btn.onclick = () => {
        filterTxType = btn.getAttribute('data-type');
        renderExtratoSubView();
      };
    });

    // Mark paid in extrato
    subviewContent.querySelectorAll('button[data-mark-paid]').forEach(btn => {
      btn.onclick = () => {
        const id = btn.getAttribute('data-mark-paid');
        store.markTransactionAsPaid(id);
        toast.success('Lançamento baixado!');
        renderFinanceView(container, onNavigate);
      };
    });

    // Delete transaction
    subviewContent.querySelectorAll('button[data-delete-tx]').forEach(btn => {
      btn.onclick = () => {
        const id = btn.getAttribute('data-delete-tx');
        if (confirm('Deseja excluir este lançamento financeiro?')) {
          store.deleteTransaction(id);
          toast.info('Lançamento removido.');
          renderFinanceView(container, onNavigate);
        }
      };
    });
  }

  // Scope toggle handlers
  container.querySelector('#scope-business-btn').onclick = () => {
    activeScope = 'business';
    renderFinanceView(container, onNavigate);
  };
  container.querySelector('#scope-personal-btn').onclick = () => {
    activeScope = 'personal';
    renderFinanceView(container, onNavigate);
  };

  // Subview tab clicks
  container.querySelector('#fsub-overview').onclick = () => {
    financeSubView = 'visao_geral';
    renderFinanceView(container, onNavigate);
  };
  container.querySelector('#fsub-receivables').onclick = () => {
    financeSubView = 'contas_receber';
    renderFinanceView(container, onNavigate);
  };
  container.querySelector('#fsub-payables').onclick = () => {
    financeSubView = 'contas_pagar';
    renderFinanceView(container, onNavigate);
  };
  container.querySelector('#fsub-extrato').onclick = () => {
    financeSubView = 'extrato';
    renderFinanceView(container, onNavigate);
  };

  // Export handlers
  container.querySelector('#finance-export-btn').onclick = () => {
    const headers = ['Título', 'Tipo', 'Âmbito', 'Valor', 'Categoria', 'Data', 'Status'];
    const rows = scopedTxs.map(t => [t.title, t.type, t.scope, t.amount, t.category, t.date || t.dueDate, t.status]);
    exportToCSV(`financeiro_${activeScope}`, rows, headers);
    toast.success('Extrato financeiro exportado com sucesso!');
  };

  // New Income
  container.querySelector('#finance-new-income-btn').onclick = () => {
    openTransactionModal('income', activeScope, () => renderFinanceView(container, onNavigate));
  };

  // New Expense
  container.querySelector('#finance-new-expense-btn').onclick = () => {
    openTransactionModal('expense', activeScope, () => renderFinanceView(container, onNavigate));
  };

  renderSubView();
}

function renderFinanceCharts(txs) {
  if (!window.Chart) return;

  const ctxEvol = document.getElementById('chart-finance-evolution');
  if (ctxEvol) {
    new window.Chart(ctxEvol, {
      type: 'bar',
      data: {
        labels: ['Jul', 'Ago', 'Set', 'Out'],
        datasets: [
          { label: 'Entradas', data: [7500, 9200, 13000, 14000], backgroundColor: '#10B981', borderRadius: 6 },
          { label: 'Saídas', data: [2100, 2400, 2800, 3100], backgroundColor: '#F43F5E', borderRadius: 6 }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'top', labels: { boxWidth: 10, font: { size: 10 } } } },
        scales: { x: { grid: { display: false } }, y: { grid: { color: 'rgba(0,0,0,0.05)' } } }
      }
    });
  }

  const ctxCat = document.getElementById('chart-finance-categories');
  if (ctxCat) {
    const categoriesMap = {};
    txs.forEach(t => {
      categoriesMap[t.category] = (categoriesMap[t.category] || 0) + (t.amount || 0);
    });

    const labels = Object.keys(categoriesMap);
    const data = Object.values(categoriesMap);

    new window.Chart(ctxCat, {
      type: 'doughnut',
      data: {
        labels: labels.length > 0 ? labels : ['Sem dados'],
        datasets: [{
          data: data.length > 0 ? data : [1],
          backgroundColor: ['#0000FF', '#10B981', '#6366F1', '#F59E0B', '#EF4444', '#8B5CF6'],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom', labels: { boxWidth: 8, font: { size: 9 } } } }
      }
    });
  }
}

function openTransactionModal(type, scope, onSuccess) {
  const { categories, clients, projects } = store.getState();
  const isIncome = type === 'income';
  const filteredCategories = categories.filter(c => c.type === scope);

  const content = `
    <form id="tx-full-modal-form" class="space-y-3">
      <div>
        <label class="block text-xs font-medium text-zinc-600 dark:text-zinc-300 mb-1">Título / Descrição *</label>
        <input required name="title" class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs" placeholder="${isIncome ? 'Ex: Recebimento do projeto...' : 'Ex: Compra de suprimentos...'}">
      </div>
      <div class="grid grid-cols-2 gap-2">
        <div>
          <label class="block text-xs font-medium text-zinc-600 dark:text-zinc-300 mb-1">Valor Total (R$) *</label>
          <input required type="number" step="0.01" name="amount" class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs" placeholder="2500.00">
        </div>
        <div>
          <label class="block text-xs font-medium text-zinc-600 dark:text-zinc-300 mb-1">Parcelamento</label>
          <select name="installments" class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs font-semibold">
            <option value="1" selected>À vista (1x)</option>
            <option value="2">Parcelado em 2x</option>
            <option value="3">Parcelado em 3x</option>
            <option value="4">Parcelado em 4x</option>
            <option value="5">Parcelado em 5x</option>
            <option value="6">Parcelado em 6x</option>
            <option value="10">Parcelado em 10x</option>
            <option value="12">Parcelado em 12x</option>
          </select>
        </div>
      </div>
      <div class="grid grid-cols-2 gap-2">
        <div>
          <label class="block text-xs font-medium text-zinc-600 dark:text-zinc-300 mb-1">Vencimento / Data</label>
          <input type="date" name="date" value="${new Date().toISOString().split('T')[0]}" class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs">
        </div>
        <div>
          <label class="block text-xs font-medium text-zinc-600 dark:text-zinc-300 mb-1">Status Inicial</label>
          <select name="status" class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs">
            <option value="paid" selected>Já Pago (Baixado)</option>
            <option value="pending">Pendente (A Receber / A Pagar)</option>
          </select>
        </div>
      </div>
      <div class="grid grid-cols-2 gap-2">
        <div>
          <label class="block text-xs font-medium text-zinc-600 dark:text-zinc-300 mb-1">Categoria</label>
          <select name="category" class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs">
            ${filteredCategories.map(c => `<option value="${c.name}">${c.name}</option>`).join('')}
          </select>
        </div>
        <div>
          <label class="block text-xs font-medium text-zinc-600 dark:text-zinc-300 mb-1">Forma de Pagamento</label>
          <select name="paymentMethod" class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs">
            <option value="Pix">Pix</option>
            <option value="Boleto">Boleto</option>
            <option value="Cartão de Crédito">Cartão de Crédito</option>
            <option value="Transferência">Transferência</option>
          </select>
        </div>
      </div>
      ${scope === 'business' ? `
        <div class="grid grid-cols-2 gap-2">
          <div>
            <label class="block text-xs font-medium text-zinc-600 dark:text-zinc-300 mb-1">Cliente Vinculado</label>
            <select name="clientId" class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs">
              <option value="">Nenhum</option>
              ${clients.map(c => `<option value="${c.id}">${c.name} (${c.company || 'PF'})</option>`).join('')}
            </select>
          </div>
          <div>
            <label class="block text-xs font-medium text-zinc-600 dark:text-zinc-300 mb-1">Projeto Vinculado</label>
            <select name="projectId" class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs">
              <option value="">Nenhum</option>
              ${projects.map(p => `<option value="${p.id}">${p.title}</option>`).join('')}
            </select>
          </div>
        </div>
      ` : ''}
      <div>
        <label class="block text-xs font-medium text-zinc-600 dark:text-zinc-300 mb-1">Observações</label>
        <textarea name="notes" rows="2" class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs" placeholder="Detalhes fiscais ou bancários..."></textarea>
      </div>
      <div class="pt-2 flex justify-end gap-2">
        <button type="submit" class="px-4 py-2 ${isIncome ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'} text-white rounded-lg text-xs font-semibold transition-colors">
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

  m.panel.querySelector('#tx-full-modal-form').onsubmit = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const installmentsCount = parseInt(fd.get('installments')) || 1;
    const clientId = fd.get('clientId');
    const client = clients.find(c => c.id === clientId);

    const txData = {
      title: fd.get('title'),
      type: type,
      scope: scope,
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
    };

    if (installmentsCount > 1) {
      store.addTransactionWithInstallments(txData, installmentsCount);
      toast.success(`Lançamento parcelado em ${installmentsCount}x criado com sucesso!`);
    } else {
      store.addTransaction(txData);
      toast.success(isIncome ? 'Receita lançada e saldo atualizado!' : 'Despesa registrada!');
    }

    m.close();
    if (onSuccess) onSuccess();
  };
}

