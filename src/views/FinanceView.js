import { store } from '../state/store.js';
import { modal } from '../components/Modal.js';
import { toast } from '../components/Toast.js';
import { formatCurrency, formatDate } from '../utils/formatters.js';
import { exportToCSV, exportToExcel, exportToPDF } from '../utils/exportUtils.js';

let activeScope = 'business'; // business | personal
let filterTxType = 'all'; // all | income | expense

export function renderFinanceView(container, onNavigate) {
  const { transactions, categories, clients, projects } = store.getState();

  const scopedTxs = transactions.filter(t => t.scope === activeScope);
  const filteredTxs = filterTxType === 'all'
    ? scopedTxs
    : scopedTxs.filter(t => t.type === filterTxType);

  const totalIncome = scopedTxs.filter(t => t.type === 'income').reduce((acc, t) => acc + (t.amount || 0), 0);
  const totalExpense = scopedTxs.filter(t => t.type === 'expense').reduce((acc, t) => acc + (t.amount || 0), 0);
  const balance = totalIncome - totalExpense;

  container.innerHTML = `
    <div class="space-y-6">
      <!-- Header & Scope Toggle -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 class="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">Controle Financeiro</h2>
          <p class="text-xs text-zinc-500">Gestão de fluxo de caixa, contas a pagar/receber e segregação Empresa & Pessoal.</p>
        </div>

        <div class="flex items-center gap-3">
          <!-- Scope Switcher (Empresa vs Pessoal) -->
          <div class="flex items-center p-1 bg-zinc-100 dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700">
            <button id="scope-business-btn" class="px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors ${activeScope === 'business' ? 'bg-blue-600 text-white shadow-2xs' : 'text-zinc-500 hover:text-zinc-800'}">Empresa (PJ)</button>
            <button id="scope-personal-btn" class="px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors ${activeScope === 'personal' ? 'bg-blue-600 text-white shadow-2xs' : 'text-zinc-500 hover:text-zinc-800'}">Pessoal (PF)</button>
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

      <!-- KPI Summary Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div class="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-2xs">
          <div class="flex items-center justify-between text-xs font-medium text-zinc-500 mb-2">
            <span>Total de Entradas (${activeScope === 'business' ? 'PJ' : 'PF'})</span>
            <span class="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
          </div>
          <div class="text-xl sm:text-2xl font-bold text-emerald-600 dark:text-emerald-400">${formatCurrency(totalIncome)}</div>
          <div class="text-[11px] text-zinc-400 mt-1">${scopedTxs.filter(t => t.type === 'income').length} lançamentos realizados</div>
        </div>

        <div class="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-2xs">
          <div class="flex items-center justify-between text-xs font-medium text-zinc-500 mb-2">
            <span>Total de Saídas (${activeScope === 'business' ? 'PJ' : 'PF'})</span>
            <span class="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
          </div>
          <div class="text-xl sm:text-2xl font-bold text-rose-600 dark:text-rose-400">${formatCurrency(totalExpense)}</div>
          <div class="text-[11px] text-zinc-400 mt-1">${scopedTxs.filter(t => t.type === 'expense').length} despesas pagas</div>
        </div>

        <div class="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-2xs">
          <div class="flex items-center justify-between text-xs font-medium text-zinc-500 mb-2">
            <span>Saldo Líquido</span>
            <span class="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
          </div>
          <div class="text-xl sm:text-2xl font-bold ${balance >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-rose-600'}">${formatCurrency(balance)}</div>
          <div class="text-[11px] text-emerald-600 font-medium mt-1">Disponibilidade financeira positiva</div>
        </div>
      </div>

      <!-- Charts Section -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <!-- Monthly Evolution Bar Chart -->
        <div class="lg:col-span-2 p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-xs font-bold uppercase tracking-wider text-zinc-400">Fluxo Comparativo (${activeScope === 'business' ? 'Empresa' : 'Pessoal'})</h3>
            <span class="text-xs font-semibold text-zinc-600 dark:text-zinc-400">Últimos meses</span>
          </div>
          <div class="h-56 relative">
            <canvas id="chart-finance-evolution"></canvas>
          </div>
        </div>

        <!-- Category Doughnut Chart -->
        <div class="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-xs font-bold uppercase tracking-wider text-zinc-400">Por Categoria</h3>
          </div>
          <div class="h-56 relative flex items-center justify-center">
            <canvas id="chart-finance-categories"></canvas>
          </div>
        </div>
      </div>

      <!-- Transactions Table -->
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
                <th class="p-3.5">Forma / Conta</th>
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
                  <td class="p-3.5">${t.clientId ? clients.find(c => c.id === t.clientId)?.name || '-' : '-'}</td>
                  <td class="p-3.5">${formatDate(t.date)}</td>
                  <td class="p-3.5">${t.paymentMethod || 'Pix'} • ${t.account || 'Conta Principal'}</td>
                  <td class="p-3.5 text-right font-bold ${t.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-900 dark:text-zinc-100'}">
                    ${t.type === 'income' ? '+' : '-'}${formatCurrency(t.amount)}
                  </td>
                  <td class="p-3.5 text-right">
                    <button data-delete-tx="${t.id}" class="text-zinc-400 hover:text-rose-600 p-1" title="Excluir">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                    </button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;

  // Scope toggle handlers
  container.querySelector('#scope-business-btn').onclick = () => {
    activeScope = 'business';
    renderFinanceView(container, onNavigate);
  };
  container.querySelector('#scope-personal-btn').onclick = () => {
    activeScope = 'personal';
    renderFinanceView(container, onNavigate);
  };

  // Filter type
  container.querySelectorAll('button[data-type]').forEach(btn => {
    btn.onclick = () => {
      filterTxType = btn.getAttribute('data-type');
      renderFinanceView(container, onNavigate);
    };
  });

  // Delete transaction
  container.querySelectorAll('button[data-delete-tx]').forEach(btn => {
    btn.onclick = () => {
      const id = btn.getAttribute('data-delete-tx');
      if (confirm('Deseja excluir este lançamento financeiro?')) {
        store.deleteTransaction(id);
        toast.info('Lançamento removido.');
        renderFinanceView(container, onNavigate);
      }
    };
  });

  // Export handlers
  container.querySelector('#finance-export-btn').onclick = () => {
    const headers = ['Título', 'Tipo', 'Âmbito', 'Valor', 'Categoria', 'Data', 'Conta'];
    const rows = filteredTxs.map(t => [t.title, t.type, t.scope, t.amount, t.category, t.date, t.account]);
    exportToCSV(`financeiro_${activeScope}`, rows, headers);
    toast.success('Extrato financeiro exportado!');
  };

  // New Income
  container.querySelector('#finance-new-income-btn').onclick = () => {
    openTransactionModal('income', activeScope, () => renderFinanceView(container, onNavigate));
  };

  // New Expense
  container.querySelector('#finance-new-expense-btn').onclick = () => {
    openTransactionModal('expense', activeScope, () => renderFinanceView(container, onNavigate));
  };

  setTimeout(() => renderFinanceCharts(scopedTxs), 50);
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
  const { categories, clients, projects, goals } = store.getState();
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
          <label class="block text-xs font-medium text-zinc-600 dark:text-zinc-300 mb-1">Valor (R$) *</label>
          <input required type="number" step="0.01" name="amount" class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs" placeholder="2500.00">
        </div>
        <div>
          <label class="block text-xs font-medium text-zinc-600 dark:text-zinc-300 mb-1">Data</label>
          <input type="date" name="date" value="${new Date().toISOString().split('T')[0]}" class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs">
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
              ${clients.map(c => `<option value="${c.id}">${c.name} (${c.company})</option>`).join('')}
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

    store.addTransaction({
      title: fd.get('title'),
      type: type,
      scope: scope,
      amount: parseFloat(fd.get('amount')) || 0,
      date: fd.get('date'),
      category: fd.get('category'),
      paymentMethod: fd.get('paymentMethod'),
      clientId: fd.get('clientId') || null,
      projectId: fd.get('projectId') || null,
      notes: fd.get('notes')
    });

    toast.success(isIncome ? 'Receita lançada e saldo atualizado!' : 'Despesa registrada!');
    m.close();
    if (onSuccess) onSuccess();
  };
}
