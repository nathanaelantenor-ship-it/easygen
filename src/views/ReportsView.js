import { store } from '../state/store.js';
import { toast } from '../components/Toast.js';
import { formatCurrency, formatDate } from '../utils/formatters.js';
import { exportToCSV, exportToExcel, exportToPDF } from '../utils/exportUtils.js';

let activeReport = 'financeiro';

export function renderReportsView(container, onNavigate) {
  const state = store.getState();

  const reportTabs = [
    { id: 'financeiro', label: 'Financeiro' },
    { id: 'comercial', label: 'Comercial' },
    { id: 'crm', label: 'CRM & Funil' },
    { id: 'clientes', label: 'Clientes & LTV' },
    { id: 'projetos', label: 'Projetos' },
    { id: 'servicos', label: 'Serviços' },
    { id: 'produtividade', label: 'Produtividade' },
    { id: 'metas', label: 'Metas' }
  ];

  container.innerHTML = `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 class="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">Central de Relatórios Analíticos</h2>
          <p class="text-xs text-zinc-500">Métricas consolidadas, análises históricas e exportação profissional.</p>
        </div>
        <div class="flex items-center gap-2">
          <select id="report-period" class="px-3 py-1.5 bg-white dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-medium text-zinc-700 dark:text-zinc-300">
            <option value="mes">Mês Atual (Outubro)</option>
            <option value="trimestre">3º Trimestre</option>
            <option value="ano">Ano 2026</option>
          </select>
          <button id="report-export-csv" class="px-3 py-1.5 border border-zinc-200 dark:border-zinc-750 hover:bg-zinc-100 rounded-xl text-xs font-medium">CSV</button>
          <button id="report-export-excel" class="px-3 py-1.5 border border-zinc-200 dark:border-zinc-750 hover:bg-zinc-100 rounded-xl text-xs font-medium">Excel</button>
          <button id="report-export-pdf" class="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold">PDF</button>
        </div>
      </div>

      <!-- Report Type Tabs -->
      <div class="flex items-center gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-2 overflow-x-auto text-xs">
        ${reportTabs.map(tab => `
          <button data-rep="${tab.id}" class="px-3.5 py-1.5 rounded-lg font-medium transition-colors shrink-0 ${activeReport === tab.id ? 'bg-blue-600 text-white font-semibold shadow-2xs' : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'}">
            ${tab.label}
          </button>
        `).join('')}
      </div>

      <!-- Report Main Body -->
      <div id="report-body-area"></div>
    </div>
  `;

  // Attach tabs
  container.querySelectorAll('button[data-rep]').forEach(btn => {
    btn.onclick = () => {
      activeReport = btn.getAttribute('data-rep');
      renderReportsView(container, onNavigate);
    };
  });

  const bodyArea = container.querySelector('#report-body-area');
  renderSelectedReport(bodyArea, activeReport, state);

  // Export Buttons
  container.querySelector('#report-export-csv').onclick = () => {
    const { title, headers, rows } = getReportExportData(activeReport, state);
    exportToCSV(`relatorio_${activeReport}`, rows, headers);
    toast.success(`Relatório de ${title} exportado em CSV!`);
  };

  container.querySelector('#report-export-excel').onclick = () => {
    const { title, headers, rows } = getReportExportData(activeReport, state);
    exportToExcel(`relatorio_${activeReport}`, rows, headers);
    toast.success(`Relatório de ${title} exportado em Excel!`);
  };

  container.querySelector('#report-export-pdf').onclick = () => {
    const { title, headers, rows } = getReportExportData(activeReport, state);
    exportToPDF(`relatorio_${activeReport}`, title, headers, rows);
    toast.success(`Relatório de ${title} exportado em PDF!`);
  };
}

function renderSelectedReport(container, reportType, state) {
  if (reportType === 'financeiro') {
    const txs = state.transactions;
    const totalIn = txs.filter(t => t.type === 'income').reduce((a, b) => a + (b.amount || 0), 0);
    const totalOut = txs.filter(t => t.type === 'expense').reduce((a, b) => a + (b.amount || 0), 0);

    container.innerHTML = `
      <div class="space-y-4">
        <div class="grid grid-cols-3 gap-3">
          <div class="p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl">
            <span class="text-xs text-zinc-400">Total de Entradas</span>
            <div class="text-lg font-bold text-emerald-600 mt-1">${formatCurrency(totalIn)}</div>
          </div>
          <div class="p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl">
            <span class="text-xs text-zinc-400">Total de Saídas</span>
            <div class="text-lg font-bold text-rose-600 mt-1">${formatCurrency(totalOut)}</div>
          </div>
          <div class="p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl">
            <span class="text-xs text-zinc-400">Margem Líquida</span>
            <div class="text-lg font-bold text-blue-600 mt-1">${formatCurrency(totalIn - totalOut)}</div>
          </div>
        </div>

        <div class="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden">
          <table class="w-full text-left text-xs text-zinc-600 dark:text-zinc-400">
            <thead class="bg-zinc-50 dark:bg-zinc-850 text-zinc-900 dark:text-zinc-200 border-b border-zinc-200 dark:border-zinc-800 font-semibold">
              <tr>
                <th class="p-3">Data</th>
                <th class="p-3">Descrição</th>
                <th class="p-3">Categoria</th>
                <th class="p-3">Âmbito</th>
                <th class="p-3 text-right">Valor</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-zinc-100 dark:divide-zinc-800">
              ${txs.map(t => `
                <tr>
                  <td class="p-3">${formatDate(t.date)}</td>
                  <td class="p-3 font-medium text-zinc-900 dark:text-zinc-100">${t.title}</td>
                  <td class="p-3">${t.category}</td>
                  <td class="p-3 capitalize">${t.scope === 'business' ? 'PJ' : 'PF'}</td>
                  <td class="p-3 text-right font-bold ${t.type === 'income' ? 'text-emerald-600' : 'text-zinc-900 dark:text-zinc-100'}">
                    ${t.type === 'income' ? '+' : '-'}${formatCurrency(t.amount)}
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  } else if (reportType === 'clientes') {
    container.innerHTML = `
      <div class="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden">
        <table class="w-full text-left text-xs text-zinc-600 dark:text-zinc-400">
          <thead class="bg-zinc-50 dark:bg-zinc-850 text-zinc-900 dark:text-zinc-200 border-b border-zinc-200 dark:border-zinc-800 font-semibold">
            <tr>
              <th class="p-3">Cliente</th>
              <th class="p-3">Empresa</th>
              <th class="p-3">Tipo</th>
              <th class="p-3">LTV Total</th>
              <th class="p-3">Qtd Projetos</th>
              <th class="p-3">Ticket Médio</th>
              <th class="p-3">Entrada</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-zinc-100 dark:divide-zinc-800">
            ${state.clients.map(c => `
              <tr>
                <td class="p-3 font-bold text-zinc-900 dark:text-zinc-100">${c.name}</td>
                <td class="p-3">${c.company || '-'}</td>
                <td class="p-3 capitalize">${c.clientType}</td>
                <td class="p-3 font-bold text-blue-600 dark:text-blue-400">${formatCurrency(c.totalGenerated)}</td>
                <td class="p-3">${c.projectsCount}</td>
                <td class="p-3">${formatCurrency(c.averageTicket)}</td>
                <td class="p-3">${formatDate(c.entryDate)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  } else {
    // Relatórios de Projetos, CRM, Propostas, Serviços, Metas
    const list = reportType === 'projetos' ? state.projects :
                 reportType === 'crm' ? state.leads :
                 reportType === 'metas' ? state.goals :
                 state.proposals;

    container.innerHTML = `
      <div class="p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl space-y-4">
        <div class="flex items-center justify-between">
          <h4 class="font-bold text-sm text-zinc-900 dark:text-zinc-100">Visão Consolidada: ${reportType.toUpperCase()}</h4>
          <span class="text-xs text-zinc-400">${list.length} registros analisados</span>
        </div>
        <div class="divide-y divide-zinc-100 dark:divide-zinc-800 text-xs">
          ${list.map(item => `
            <div class="py-2.5 flex items-center justify-between">
              <div>
                <span class="font-semibold text-zinc-800 dark:text-zinc-200">${item.title || item.name || item.number}</span>
                <span class="text-zinc-400 ml-2">(${item.category || item.clientName || item.status})</span>
              </div>
              <span class="font-bold text-zinc-900 dark:text-zinc-100">
                ${item.value ? formatCurrency(item.value) : item.targetValue ? formatCurrency(item.targetValue) : item.estimatedValue ? formatCurrency(item.estimatedValue) : '-'}
              </span>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }
}

function getReportExportData(type, state) {
  if (type === 'financeiro') {
    return {
      title: 'Relatório Financeiro',
      headers: ['Data', 'Título', 'Categoria', 'Âmbito', 'Valor (R$)'],
      rows: state.transactions.map(t => [t.date, t.title, t.category, t.scope, t.amount])
    };
  } else if (type === 'clientes') {
    return {
      title: 'Relatório de Clientes e LTV',
      headers: ['Nome', 'Empresa', 'Tipo', 'LTV (R$)', 'Projetos', 'Ticket Médio'],
      rows: state.clients.map(c => [c.name, c.company, c.clientType, c.totalGenerated, c.projectsCount, c.averageTicket])
    };
  } else if (type === 'projetos') {
    return {
      title: 'Relatório de Projetos',
      headers: ['Projeto', 'Cliente', 'Valor (R$)', 'Estágio', 'Prazo'],
      rows: state.projects.map(p => [p.title, p.clientName, p.value, p.stage, p.deadlineDate])
    };
  } else {
    return {
      title: `Relatório de ${type}`,
      headers: ['Identificação', 'Referência', 'Valor (R$)', 'Status'],
      rows: state.proposals.map(p => [p.number, p.clientName, p.finalValue || p.value, p.status])
    };
  }
}
