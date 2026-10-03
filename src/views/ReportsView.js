import { store } from '../state/store.js';
import { toast } from '../components/Toast.js';
import { formatCurrency, formatDate } from '../utils/formatters.js';
import { renderExportButtonHtml, bindExportButton } from '../components/ExportMenu.js';

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
          ${renderExportButtonHtml('reports-export-dropdown', 'Exportar Relatório')}
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

  // Universal Export Handler
  bindExportButton(container, 'reports-export-dropdown', () => {
    const { title, headers, rows, summary } = getReportExportData(activeReport, state);
    return {
      filename: `relatorio_${activeReport}_${new Date().toISOString().split('T')[0]}`,
      title: `Relatório Analítico: ${title}`,
      headers,
      rows,
      summary: summary || [{ label: 'Módulo Analisado', value: title }, { label: 'Linhas Exportadas', value: rows.length }],
      filters: `Módulo: ${title}`
    };
  });
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
    const txs = state.transactions || [];
    const totalIn = txs.filter(t => t.type === 'income').reduce((a, b) => a + (b.amount || 0), 0);
    const totalOut = txs.filter(t => t.type === 'expense').reduce((a, b) => a + (b.amount || 0), 0);
    return {
      title: 'Relatório Financeiro',
      headers: ['Data', 'Título', 'Categoria', 'Âmbito', 'Tipo', 'Valor', 'Status'],
      rows: txs.map(t => [
        formatDate(t.date),
        t.title || '',
        t.category || 'Geral',
        t.scope === 'business' ? 'Empresa' : 'Pessoal',
        t.type === 'income' ? 'Receita' : 'Despesa',
        formatCurrency(t.amount || 0),
        t.status === 'paid' ? 'Pago' : 'Previsto'
      ]),
      summary: [
        { label: 'Total de Receitas', value: formatCurrency(totalIn) },
        { label: 'Total de Despesas', value: formatCurrency(totalOut) },
        { label: 'Resultado Líquido', value: formatCurrency(totalIn - totalOut) }
      ]
    };
  } else if (type === 'comercial') {
    const props = state.proposals || [];
    const totalApproved = props.filter(p => p.status === 'aprovada').reduce((a, b) => a + (b.finalValue || b.value || 0), 0);
    return {
      title: 'Relatório Comercial & Propostas',
      headers: ['Número', 'Cliente', 'Serviço', 'Valor Base', 'Valor Final', 'Status', 'Validade'],
      rows: props.map(p => [
        p.number || '',
        p.clientName || '-',
        p.serviceName || '-',
        formatCurrency(p.value || 0),
        formatCurrency(p.finalValue || p.value || 0),
        p.status || '',
        formatDate(p.validity)
      ]),
      summary: [
        { label: 'Total de Propostas', value: props.length },
        { label: 'Propostas Aprovadas', value: props.filter(p => p.status === 'aprovada').length },
        { label: 'Receita Aprovada', value: formatCurrency(totalApproved) }
      ]
    };
  } else if (type === 'crm') {
    const leads = state.leads || [];
    const totalPipeline = leads.reduce((a, b) => a + (b.estimatedValue || 0), 0);
    return {
      title: 'Relatório de CRM & Funil de Vendas',
      headers: ['Nome', 'Empresa', 'Telefone', 'Canal', 'Serviço', 'Valor Estimado', 'Status'],
      rows: leads.map(l => [
        l.name || '',
        l.company || '-',
        l.phone || '-',
        l.channel || '-',
        l.serviceOfInterest || '-',
        formatCurrency(l.estimatedValue || 0),
        l.status || ''
      ]),
      summary: [
        { label: 'Total de Oportunidades', value: leads.length },
        { label: 'Valor em Pipeline', value: formatCurrency(totalPipeline) },
        { label: 'Leads Aprovados', value: leads.filter(l => l.status === 'aprovado').length }
      ]
    };
  } else if (type === 'clientes') {
    const clients = state.clients || [];
    const totalLtv = clients.reduce((a, b) => a + (b.totalGenerated || 0), 0);
    return {
      title: 'Relatório de Clientes e LTV',
      headers: ['Nome', 'Empresa', 'Tipo', 'LTV Total', 'Projetos', 'Ticket Médio'],
      rows: clients.map(c => [
        c.name || '',
        c.company || '-',
        c.clientType || 'Mensalista',
        formatCurrency(c.totalGenerated || 0),
        c.projectsCount || 0,
        formatCurrency(c.averageTicket || 0)
      ]),
      summary: [
        { label: 'Base de Clientes', value: clients.length },
        { label: 'LTV Consolidado', value: formatCurrency(totalLtv) },
        { label: 'Ticket Médio Global', value: formatCurrency(clients.length > 0 ? totalLtv / clients.length : 0) }
      ]
    };
  } else if (type === 'projetos') {
    const projects = state.projects || [];
    const totalVal = projects.reduce((a, b) => a + (b.value || 0), 0);
    return {
      title: 'Relatório de Projetos em Produção',
      headers: ['Projeto', 'Cliente', 'Serviço', 'Valor', 'Estágio', 'Prioridade', 'Prazo'],
      rows: projects.map(p => [
        p.title || '',
        p.clientName || '-',
        p.serviceName || '-',
        formatCurrency(p.value || 0),
        p.stage || '',
        (p.priority || '').toUpperCase(),
        formatDate(p.deadlineDate)
      ]),
      summary: [
        { label: 'Total de Projetos', value: projects.length },
        { label: 'Projetos Ativos', value: projects.filter(p => p.stage !== 'entrega' && p.stage !== 'pago' && p.stage !== 'cancelado').length },
        { label: 'Faturamento em Produção', value: formatCurrency(totalVal) }
      ]
    };
  } else if (type === 'servicos') {
    const services = state.services || [];
    return {
      title: 'Relatório do Catálogo de Serviços',
      headers: ['Serviço', 'Categoria', 'Preço Base', 'Prazo Estimado', 'Descrição'],
      rows: services.map(s => [
        s.name || '',
        s.category || 'Geral',
        formatCurrency(s.price || 0),
        s.estimatedDays ? `${s.estimatedDays} dias` : '-',
        s.description || ''
      ]),
      summary: [
        { label: 'Serviços Ativos', value: services.length },
        { label: 'Média de Preço Base', value: formatCurrency(services.length > 0 ? services.reduce((a, b) => a + (b.price || 0), 0) / services.length : 0) }
      ]
    };
  } else if (type === 'produtividade') {
    const tasks = state.tasks || [];
    const habits = state.habits || [];
    return {
      title: 'Relatório de Produtividade & Rotina',
      headers: ['Tipo', 'Título', 'Prioridade / Categoria', 'Status / Sequência', 'Prazo'],
      rows: [
        ...tasks.map(t => ['Tarefa', t.title, (t.priority || '').toUpperCase(), t.status === 'done' ? 'Concluída' : 'Pendente', formatDate(t.dueDate)]),
        ...habits.map(h => ['Hábito', h.name, h.category || 'Geral', `${h.streak || 0} dias streak`, h.completedToday ? 'Concluído Hoje' : 'Pendente'])
      ],
      summary: [
        { label: 'Total de Tarefas', value: tasks.length },
        { label: 'Tarefas Concluídas', value: tasks.filter(t => t.status === 'done').length },
        { label: 'Total de Hábitos', value: habits.length }
      ]
    };
  } else {
    const goals = state.goals || [];
    return {
      title: 'Relatório Estratégico de Metas',
      headers: ['Meta', 'Âmbito', 'Categoria', 'Valor Atual', 'Valor Alvo', 'Progresso', 'Prazo'],
      rows: goals.map(g => [
        g.title || '',
        g.scope === 'business' ? 'Empresa' : 'Pessoal',
        g.category || 'Geral',
        formatCurrency(g.currentValue || 0),
        formatCurrency(g.targetValue || 0),
        `${Math.min(100, Math.round(((g.currentValue || 0) / (g.targetValue || 1)) * 100))}%`,
        formatDate(g.deadline)
      ]),
      summary: [
        { label: 'Total de Metas', value: goals.length },
        { label: 'Metas Atingidas', value: goals.filter(g => (g.currentValue || 0) >= (g.targetValue || 1)).length }
      ]
    };
  }
}
