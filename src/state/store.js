import { initialData } from './initialData.js';

const STORAGE_KEY = 'APP_TESTE_DATA_V1';

class Store {
  constructor() {
    this.listeners = new Set();
    this.state = this.loadState();
  }

  loadState() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error('Erro ao carregar dados do LocalStorage:', e);
    }
    return JSON.parse(JSON.stringify(initialData));
  }

  saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch (e) {
      console.error('Erro ao salvar no LocalStorage:', e);
    }
    this.notify('update', this.state);
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify(event, payload) {
    for (const listener of this.listeners) {
      try {
        listener(event, payload);
      } catch (err) {
        console.error('Erro no listener da store:', err);
      }
    }
  }

  getState() {
    return this.state;
  }

  resetDemoData() {
    this.state = JSON.parse(JSON.stringify(initialData));
    this.saveState();
  }

  clearAllData() {
    this.state = {
      profile: { ...this.state.profile },
      categories: [...this.state.categories],
      services: [],
      leads: [],
      clients: [],
      proposals: [],
      projects: [],
      transactions: [],
      tasks: [],
      habits: [],
      goals: [],
      events: [],
      documents: [],
      notifications: []
    };
    this.saveState();
  }

  updateProfile(profileData) {
    this.state.profile = { ...this.state.profile, ...profileData };
    this.saveState();
  }

  setTheme(theme) {
    this.state.profile.theme = theme;
    this.saveState();
    document.documentElement.setAttribute('data-theme', theme);
  }
  // --- LEADS / CRM ---
  addLead(lead) {
    const newLead = {
      id: 'lead-' + Date.now(),
      createdAt: new Date().toISOString().split('T')[0],
      status: 'novo',
      ...lead
    };
    this.state.leads.unshift(newLead);
    this.addNotification({
      title: 'Novo Lead Criado',
      message: ${newLead.name} () cadastrado no funil.,
      type: 'info',
      link: 'crm'
    });
    this.saveState();
    return newLead;
  }

  updateLead(id, updates) {
    const idx = this.state.leads.findIndex(l => l.id === id);
    if (idx !== -1) {
      this.state.leads[idx] = { ...this.state.leads[idx], ...updates, updatedAt: new Date().toISOString() };
      this.saveState();
    }
  }

  deleteLead(id) {
    this.state.leads = this.state.leads.filter(l => l.id !== id);
    this.saveState();
  }

  convertLeadToClient(leadId) {
    const lead = this.state.leads.find(l => l.id === leadId);
    if (!lead) return null;

    lead.status = 'aprovado';

    const newClient = {
      id: 'cli-' + Date.now(),
      name: lead.name,
      company: lead.company,
      phone: lead.phone,
      whatsapp: lead.phone,
      email: lead.email,
      instagram: '',
      website: '',
      address: '',
      channel: lead.channel || 'Indicação',
      entryDate: new Date().toISOString().split('T')[0],
      clientType: 'pontual',
      status: 'active',
      notes: Convertido de Lead em . Notas anteriores: ,
      totalGenerated: 0,
      projectsCount: 0,
      averageTicket: 0,
      contractFrequency: 'Pontual',
      lastServiceDate: '',
      lastContactDate: new Date().toISOString().split('T')[0]
    };

    this.state.clients.unshift(newClient);

    this.addNotification({
      title: 'Lead Convertido em Cliente!',
      message: ${newClient.name} foi adicionado à carteira de clientes ativos.,
      type: 'success',
      link: 'clients'
    });

    this.saveState();
    return newClient;
  }

  // --- CLIENTES ---
  addClient(client) {
    const newClient = {
      id: 'cli-' + Date.now(),
      entryDate: new Date().toISOString().split('T')[0],
      status: 'active',
      totalGenerated: 0,
      projectsCount: 0,
      averageTicket: 0,
      contractFrequency: 'Pontual',
      ...client
    };
    this.state.clients.unshift(newClient);
    this.addNotification({
      title: 'Novo Cliente Cadastrado',
      message: ${newClient.name} foi cadastrado com sucesso.,
      type: 'info',
      link: 'clients'
    });
    this.saveState();
    return newClient;
  }

  updateClient(id, updates) {
    const idx = this.state.clients.findIndex(c => c.id === id);
    if (idx !== -1) {
      this.state.clients[idx] = { ...this.state.clients[idx], ...updates, updatedAt: new Date().toISOString() };
      this.saveState();
    }
  }

  deleteClient(id) {
    this.state.clients = this.state.clients.filter(c => c.id !== id);
    this.saveState();
  }

  // --- SERVIÇOS ---
  addService(service) {
    const newService = {
      id: 'srv-' + Date.now(),
      status: 'active',
      ...service
    };
    this.state.services.unshift(newService);
    this.saveState();
    return newService;
  }

  updateService(id, updates) {
    const idx = this.state.services.findIndex(s => s.id === id);
    if (idx !== -1) {
      this.state.services[idx] = { ...this.state.services[idx], ...updates };
      this.saveState();
    }
  }

  deleteService(id) {
    this.state.services = this.state.services.filter(s => s.id !== id);
    this.saveState();
  }
  // --- PROPOSTAS ---
  addProposal(proposal) {
    const count = this.state.proposals.length + 1;
    const year = new Date().getFullYear();
    const newProposal = {
      id: 'prop-' + Date.now(),
      number: PROP--,
      createdAt: new Date().toISOString().split('T')[0],
      status: 'rascunho',
      discount: 0,
      ...proposal
    };
    newProposal.finalValue = (newProposal.value || 0) - (newProposal.discount || 0);
    this.state.proposals.unshift(newProposal);
    this.addNotification({
      title: 'Nova Proposta Gerada',
      message: Proposta  criada para .,
      type: 'info',
      link: 'proposals'
    });
    this.saveState();
    return newProposal;
  }

  updateProposal(id, updates) {
    const idx = this.state.proposals.findIndex(p => p.id === id);
    if (idx !== -1) {
      const merged = { ...this.state.proposals[idx], ...updates };
      merged.finalValue = (merged.value || 0) - (merged.discount || 0);
      this.state.proposals[idx] = merged;
      this.saveState();
    }
  }

  deleteProposal(id) {
    this.state.proposals = this.state.proposals.filter(p => p.id !== id);
    this.saveState();
  }

  approveProposalAndCreateProject(proposalId) {
    const prop = this.state.proposals.find(p => p.id === proposalId);
    if (!prop) return null;

    prop.status = 'aprovada';

    // Criação automática do projeto relacionado
    const newProject = {
      id: 'proj-' + Date.now(),
      title: ${prop.serviceName} - ,
      clientId: prop.clientId || null,
      clientName: prop.clientName,
      serviceId: prop.serviceId || null,
      serviceName: prop.serviceName,
      value: prop.finalValue || prop.value,
      stage: 'briefing',
      priority: 'alta',
      startDate: new Date().toISOString().split('T')[0],
      deadlineDate: new Date(Date.now() + 20 * 86400000).toISOString().split('T')[0],
      responsible: this.state.profile.name,
      notes: Gerado automaticamente a partir da proposta . Observações: ,
      tasks: (prop.deliverables || ['Alinhamento de briefing', 'Execução', 'Entrega e validação']).map((d, i) => ({
        id: pt--,
        title: typeof d === 'string' ? d : d.title,
        completed: false
      }))
    };

    this.state.projects.unshift(newProject);

    // Se cliente existir, atualiza contagem de projetos
    if (prop.clientId) {
      const client = this.state.clients.find(c => c.id === prop.clientId);
      if (client) {
        client.projectsCount = (client.projectsCount || 0) + 1;
        client.lastServiceDate = new Date().toISOString().split('T')[0];
      }
    }

    this.addNotification({
      title: 'Proposta Aprovada & Projeto Criado!',
      message: A proposta  foi aprovada e gerou o projeto ''.,
      type: 'success',
      link: 'projects'
    });

    this.saveState();
    return newProject;
  }

  // --- PROJETOS ---
  addProject(project) {
    const newProject = {
      id: 'proj-' + Date.now(),
      stage: 'briefing',
      priority: 'media',
      startDate: new Date().toISOString().split('T')[0],
      tasks: [],
      ...project
    };
    this.state.projects.unshift(newProject);

    if (newProject.clientId) {
      const client = this.state.clients.find(c => c.id === newProject.clientId);
      if (client) {
        client.projectsCount = (client.projectsCount || 0) + 1;
        client.lastServiceDate = newProject.startDate;
      }
    }

    this.addNotification({
      title: 'Novo Projeto Iniciado',
      message: Projeto '' criado.,
      type: 'info',
      link: 'projects'
    });
    this.saveState();
    return newProject;
  }

  updateProject(id, updates) {
    const idx = this.state.projects.findIndex(p => p.id === id);
    if (idx !== -1) {
      this.state.projects[idx] = { ...this.state.projects[idx], ...updates };
      this.saveState();
    }
  }

  deleteProject(id) {
    this.state.projects = this.state.projects.filter(p => p.id !== id);
    this.saveState();
  }
  // --- FINANCEIRO & METAS CONECTADAS ---
  addTransaction(tx) {
    const newTx = {
      id: 'tx-' + Date.now(),
      date: new Date().toISOString().split('T')[0],
      dueDate: new Date().toISOString().split('T')[0],
      status: 'paid',
      scope: 'business',
      ...tx
    };
    newTx.amount = parseFloat(newTx.amount) || 0;
    this.state.transactions.unshift(newTx);

    // Conexão com Clientes: se for receita com cliente vinculado
    if (newTx.type === 'income' && newTx.clientId) {
      const client = this.state.clients.find(c => c.id === newTx.clientId);
      if (client) {
        client.totalGenerated = (client.totalGenerated || 0) + newTx.amount;
        if (client.projectsCount > 0) {
          client.averageTicket = Math.round(client.totalGenerated / client.projectsCount);
        }
      }
    }

    // Conexão com Metas: avanço automático conforme receitas ou lançamentos vinculados
    if (newTx.type === 'income') {
      const relatedGoals = this.state.goals.filter(g => 
        g.scope === newTx.scope && 
        (g.linkedCategory === newTx.category || !g.linkedCategory || g.category === 'Receita')
      );
      relatedGoals.forEach(g => {
        g.currentValue = (g.currentValue || 0) + newTx.amount;
      });
    }

    this.saveState();
    return newTx;
  }

  updateTransaction(id, updates) {
    const idx = this.state.transactions.findIndex(t => t.id === id);
    if (idx !== -1) {
      this.state.transactions[idx] = { ...this.state.transactions[idx], ...updates };
      this.saveState();
    }
  }

  deleteTransaction(id) {
    this.state.transactions = this.state.transactions.filter(t => t.id !== id);
    this.saveState();
  }

  // --- TAREFAS & ROTINA ---
  addTask(task) {
    const newTask = {
      id: 'task-' + Date.now(),
      status: 'todo',
      priority: 'media',
      dueDate: new Date().toISOString().split('T')[0],
      ...task
    };
    this.state.tasks.unshift(newTask);
    this.saveState();
    return newTask;
  }

  updateTask(id, updates) {
    const idx = this.state.tasks.findIndex(t => t.id === id);
    if (idx !== -1) {
      this.state.tasks[idx] = { ...this.state.tasks[idx], ...updates };
      this.saveState();
    }
  }

  deleteTask(id) {
    this.state.tasks = this.state.tasks.filter(t => t.id !== id);
    this.saveState();
  }

  toggleTask(id) {
    const task = this.state.tasks.find(t => t.id === id);
    if (task) {
      task.status = task.status === 'done' ? 'todo' : 'done';
      this.saveState();
    }
  }

  // --- HÁBITOS COM GAMIFICAÇÃO & STREAK ---
  addHabit(habit) {
    const newHabit = {
      id: 'hbt-' + Date.now(),
      streak: 1,
      bestStreak: 1,
      consistencyRate: 100,
      completedToday: false,
      frequency: 'daily',
      ...habit
    };
    this.state.habits.push(newHabit);
    this.saveState();
    return newHabit;
  }

  toggleHabitToday(id) {
    const habit = this.state.habits.find(h => h.id === id);
    if (habit) {
      habit.completedToday = !habit.completedToday;
      if (habit.completedToday) {
        habit.streak = (habit.streak || 0) + 1;
        if (habit.streak > (habit.bestStreak || 0)) {
          habit.bestStreak = habit.streak;
        }
      } else {
        habit.streak = Math.max(0, (habit.streak || 1) - 1);
      }
      this.saveState();
    }
  }

  deleteHabit(id) {
    this.state.habits = this.state.habits.filter(h => h.id !== id);
    this.saveState();
  }

  // --- METAS ---
  addGoal(goal) {
    const newGoal = {
      id: 'goal-' + Date.now(),
      currentValue: 0,
      status: 'in_progress',
      priority: 'media',
      scope: 'business',
      ...goal
    };
    newGoal.targetValue = parseFloat(newGoal.targetValue) || 1;
    newGoal.currentValue = parseFloat(newGoal.currentValue) || 0;
    this.state.goals.push(newGoal);
    this.saveState();
    return newGoal;
  }

  updateGoal(id, updates) {
    const idx = this.state.goals.findIndex(g => g.id === id);
    if (idx !== -1) {
      this.state.goals[idx] = { ...this.state.goals[idx], ...updates };
      this.saveState();
    }
  }

  deleteGoal(id) {
    this.state.goals = this.state.goals.filter(g => g.id !== id);
    this.saveState();
  }

  // --- AGENDA & EVENTOS ---
  addEvent(event) {
    const newEvent = {
      id: 'evt-' + Date.now(),
      date: new Date().toISOString().split('T')[0],
      startTime: '10:00',
      endTime: '11:00',
      syncedWithGoogle: false,
      ...event
    };
    this.state.events.push(newEvent);
    this.saveState();
    return newEvent;
  }

  updateEvent(id, updates) {
    const idx = this.state.events.findIndex(e => e.id === id);
    if (idx !== -1) {
      this.state.events[idx] = { ...this.state.events[idx], ...updates };
      this.saveState();
    }
  }

  deleteEvent(id) {
    this.state.events = this.state.events.filter(e => e.id !== id);
    this.saveState();
  }

  // --- DOCUMENTOS ---
  addDocument(doc) {
    const newDoc = {
      id: 'doc-' + Date.now(),
      uploadDate: new Date().toISOString().split('T')[0],
      size: '1.2 MB',
      format: 'pdf',
      category: 'Outros',
      url: '#',
      ...doc
    };
    this.state.documents.unshift(newDoc);
    this.saveState();
    return newDoc;
  }

  deleteDocument(id) {
    this.state.documents = this.state.documents.filter(d => d.id !== id);
    this.saveState();
  }

  // --- NOTIFICAÇÕES ---
  addNotification(notif) {
    const newNotif = {
      id: 'notif-' + Date.now(),
      read: false,
      createdAt: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      ...notif
    };
    this.state.notifications.unshift(newNotif);
  }

  markNotificationAsRead(id) {
    const notif = this.state.notifications.find(n => n.id === id);
    if (notif) {
      notif.read = true;
      this.saveState();
    }
  }

  markAllNotificationsAsRead() {
    this.state.notifications.forEach(n => n.read = true);
    this.saveState();
  }
  // --- METRICAS CALCULADAS DO DASHBOARD & RELACIONAMENTOS ---
  getDashboardMetrics(period = 'mes') {
    const txs = this.state.transactions.filter(t => t.scope === 'business');
    const incomeTxs = txs.filter(t => t.type === 'income');
    const expenseTxs = txs.filter(t => t.type === 'expense');

    const totalIncome = incomeTxs.reduce((acc, t) => acc + (t.amount || 0), 0);
    const totalExpense = expenseTxs.reduce((acc, t) => acc + (t.amount || 0), 0);
    const profit = totalIncome - totalExpense;

    const leads = this.state.leads;
    const leadsInFunnel = leads.filter(l => l.status !== 'aprovado' && l.status !== 'cancelado').length;
    const leadsConverted = leads.filter(l => l.status === 'aprovado').length;
    const conversionRate = leads.length > 0 ? Math.round((leadsConverted / leads.length) * 100) : 0;

    const proposals = this.state.proposals;
    const proposalTotal = proposals.reduce((acc, p) => acc + (p.finalValue || p.value || 0), 0);
    const proposalApproved = proposals.filter(p => p.status === 'aprovada').reduce((acc, p) => acc + (p.finalValue || p.value || 0), 0);
    const proposalNegotiating = proposals.filter(p => p.status === 'negociacao' || p.status === 'enviada').reduce((acc, p) => acc + (p.finalValue || p.value || 0), 0);

    const projects = this.state.projects;
    const activeProjects = projects.filter(p => p.stage !== 'entrega' && p.stage !== 'pago' && p.stage !== 'cancelado').length;
    const completedProjects = projects.filter(p => p.stage === 'entrega' || p.stage === 'pago').length;
    const urgentProjects = projects.filter(p => p.priority === 'urgente' && p.stage !== 'entrega').length;

    return {
      financial: {
        income: totalIncome,
        expenses: totalExpense,
        profit: profit,
        balance: profit,
        receivable: 11400,
        payable: 520
      },
      commercial: {
        inFunnel: leadsInFunnel,
        newLeads: leads.filter(l => l.status === 'novo').length,
        converted: leadsConverted,
        conversionRate: conversionRate,
        totalProposalValue: proposalTotal,
        approvedProposalValue: proposalApproved,
        negotiatingProposalValue: proposalNegotiating
      },
      projects: {
        active: activeProjects,
        completed: completedProjects,
        urgent: urgentProjects,
        totalRevenue: projects.reduce((acc, p) => acc + (p.value || 0), 0)
      }
    };
  }

  searchAll(query) {
    if (!query || query.trim() === '') return {};
    const q = query.toLowerCase().trim();

    return {
      clientes: this.state.clients.filter(c => (c.name && c.name.toLowerCase().includes(q)) || (c.company && c.company.toLowerCase().includes(q))),
      leads: this.state.leads.filter(l => (l.name && l.name.toLowerCase().includes(q)) || (l.company && l.company.toLowerCase().includes(q)) || (l.serviceOfInterest && l.serviceOfInterest.toLowerCase().includes(q))),
      projetos: this.state.projects.filter(p => (p.title && p.title.toLowerCase().includes(q)) || (p.clientName && p.clientName.toLowerCase().includes(q))),
      propostas: this.state.proposals.filter(p => (p.number && p.number.toLowerCase().includes(q)) || (p.clientName && p.clientName.toLowerCase().includes(q)) || (p.serviceName && p.serviceName.toLowerCase().includes(q))),
      servicos: this.state.services.filter(s => (s.name && s.name.toLowerCase().includes(q)) || (s.category && s.category.toLowerCase().includes(q))),
      documentos: this.state.documents.filter(d => (d.name && d.name.toLowerCase().includes(q)) || (d.category && d.category.toLowerCase().includes(q))),
      tarefas: this.state.tasks.filter(t => t.title && t.title.toLowerCase().includes(q)),
      eventos: this.state.events.filter(e => (e.title && e.title.toLowerCase().includes(q)) || (e.location && e.location.toLowerCase().includes(q))),
      financeiro: this.state.transactions.filter(t => (t.title && t.title.toLowerCase().includes(q)) || (t.category && t.category.toLowerCase().includes(q)))
    };
  }
}

export const store = new Store();
