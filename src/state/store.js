import { initialData } from './initialData.js';
import { auth } from '../services/authService.js';
import { getSupabase } from '../config/supabase.js';

function getUserStorageKey(userId) {
  return `APP_TESTE_DATA_USER_${userId}`;
}

class Store {
  constructor() {
    this.listeners = new Set();
    this.currentUserId = null;
    this.state = null;
    this.initAuthSync();
  }

  initAuthSync() {
    const user = auth.getCurrentUser();
    if (user && user.id) {
      this.initializeUserSession(user);
    }
    auth.subscribe((updatedUser) => {
      if (updatedUser && updatedUser.id) {
        if (this.currentUserId !== updatedUser.id) {
          this.initializeUserSession(updatedUser);
        }
      } else {
        this.clearUserSession();
      }
    });
  }

  initializeUserSession(user) {
    this.currentUserId = user.id;
    this.state = this.loadUserState(user);
    this.saveState();
    this.syncWithSupabase();
    this.notify('user_changed', this.state);
  }

  clearUserSession() {
    this.currentUserId = null;
    this.state = null;
    this.notify('user_logged_out', null);
  }

  createEmptyUserState(user) {
    return {
      userId: user.id,
      profile: {
        id: user.id,
        name: user.name || user.email.split('@')[0],
        role: user.businessType || "Diretor Criativo",
        company: "",
        cnpj: "",
        email: user.email,
        phone: "",
        instagram: "",
        website: "",
        address: "",
        currency: "BRL",
        theme: "light",
        dateFormat: "DD/MM/YYYY",
        xp: 0,
        level: 1,
        xpEnabled: true,
        avatar: user.avatar || "",
        dashboardWidgets: {
          attention: true,
          finance: true,
          cashflow: true,
          commercial: true,
          health: true,
          projects: true,
          deliveries: true,
          goals: true,
          routine: true
        }
      },
      categories: [
        { id: "cat-1", name: "Serviços & Projetos", icon: "briefcase", color: "#0000FF", type: "business", nature: "income" },
        { id: "cat-2", name: "Recorrência / Retainer", icon: "repeat", color: "#10B981", type: "business", nature: "income" },
        { id: "cat-3", name: "Software & SaaS", icon: "laptop", color: "#6366F1", type: "business", nature: "expense" },
        { id: "cat-4", name: "Equipamentos & Hardware", icon: "monitor", color: "#F59E0B", type: "business", nature: "expense" },
        { id: "cat-5", name: "Internet & Telefonia", icon: "wifi", color: "#06B6D4", type: "business", nature: "expense" },
        { id: "cat-6", name: "Impostos & Tributos", icon: "file-text", color: "#EF4444", type: "business", nature: "expense" },
        { id: "cat-7", name: "Freelancers & Parceiros", icon: "users", color: "#8B5CF6", type: "business", nature: "expense" },
        { id: "cat-8", name: "Moradia & Contas", icon: "home", color: "#3B82F6", type: "personal", nature: "expense" },
        { id: "cat-9", name: "Alimentação", icon: "coffee", color: "#F97316", type: "personal", nature: "expense" },
        { id: "cat-10", name: "Saúde & Bem-estar", icon: "heart", color: "#14B8A6", type: "personal", nature: "expense" },
        { id: "cat-11", name: "Lazer & Viagens", icon: "compass", color: "#84CC16", type: "personal", nature: "expense" }
      ],
      services: [],
      leads: [],
      clients: [],
      proposals: [],
      projects: [],
      transactions: [],
      recurringRules: [],
      tasks: [],
      habits: [],
      goals: [],
      events: [],
      documents: [],
      notifications: [],
      deliveries: [],
      deliveryColumns: [
        { id: 'backlog', title: 'Backlog', color: '#6B7280' },
        { id: 'em_andamento', title: 'Em Andamento', color: '#3B82F6' },
        { id: 'revisao', title: 'Em Revisão', color: '#F59E0B' },
        { id: 'aprovado', title: 'Aprovado', color: '#10B981' },
        { id: 'entregue', title: 'Entregue', color: '#8B5CF6' }
      ],
      deliveryTags: [
        { id: 'tag-1', name: 'Design', color: '#3B82F6' },
        { id: 'tag-2', name: 'UI/UX', color: '#8B5CF6' },
        { id: 'tag-3', name: 'Vídeo', color: '#EC4899' },
        { id: 'tag-4', name: 'Branding', color: '#F59E0B' },
        { id: 'tag-5', name: 'Dev', color: '#10B981' }
      ],
      inbox: []
    };
  }

  loadUserState(user) {
    try {
      const key = getUserStorageKey(user.id);
      const stored = localStorage.getItem(key);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (!parsed.deliveries) parsed.deliveries = [];
        if (!parsed.deliveryColumns) parsed.deliveryColumns = [
          { id: 'backlog', title: 'Backlog', color: '#6B7280' },
          { id: 'em_andamento', title: 'Em Andamento', color: '#3B82F6' },
          { id: 'revisao', title: 'Em Revisão', color: '#F59E0B' },
          { id: 'aprovado', title: 'Aprovado', color: '#10B981' },
          { id: 'entregue', title: 'Entregue', color: '#8B5CF6' }
        ];
        if (!parsed.deliveryTags) parsed.deliveryTags = [];
        if (!parsed.inbox) parsed.inbox = [];
        if (!parsed.clients) parsed.clients = [];
        if (!parsed.leads) parsed.leads = [];
        if (!parsed.projects) parsed.projects = [];
        if (!parsed.services) parsed.services = [];
        if (!parsed.transactions) parsed.transactions = [];
        if (!parsed.recurringRules) parsed.recurringRules = [];
        if (!parsed.tasks) parsed.tasks = [];
        if (!parsed.events) parsed.events = [];
        if (!parsed.habits) parsed.habits = [];
        if (!parsed.goals) parsed.goals = [];
        if (!parsed.documents) parsed.documents = [];
        if (!parsed.notifications) parsed.notifications = [];
        if (parsed.profile) {
          if (!parsed.profile.dashboardWidgets) parsed.profile.dashboardWidgets = {
            attention: true, finance: true, cashflow: true, commercial: true, health: true, projects: true, deliveries: true, goals: true, routine: true
          };
        }
        return parsed;
      }
    } catch (e) {
      console.error('Erro ao carregar dados do usuário:', e);
    }
    // Novo usuário -> Estado 100% limpo, zero dados mockados!
    return this.createEmptyUserState(user);
  }

  saveState() {
    if (!this.currentUserId || !this.state) return;
    try {
      const key = getUserStorageKey(this.currentUserId);
      localStorage.setItem(key, JSON.stringify(this.state));
    } catch (e) {
      console.error('Erro ao salvar no LocalStorage:', e);
    }
    this.notify('update', this.state);
  }

  async syncWithSupabase() {
    const supabase = getSupabase();
    if (!supabase || !this.currentUserId || !this.state) return;
    try {
      // Upsert profile in Supabase
      await supabase.from('profiles').upsert({
        id: this.currentUserId,
        name: this.state.profile.name,
        email: this.state.profile.email,
        avatar: this.state.profile.avatar,
        business_type: this.state.profile.role,
        theme: this.state.profile.theme,
        xp: this.state.profile.xp,
        level: this.state.profile.level,
        dashboard_widgets: this.state.profile.dashboardWidgets,
        updated_at: new Date().toISOString()
      });
    } catch (err) {
      console.warn('Erro na sincronização de perfil com Supabase:', err);
    }
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
    if (!this.state) {
      return {
        profile: { name: 'Visitante', email: '', theme: 'light', xp: 0, level: 1 },
        clients: [], leads: [], projects: [], deliveries: [], transactions: [],
        tasks: [], habits: [], goals: [], events: [], documents: [], inbox: [],
        categories: [], services: [], proposals: [], notifications: []
      };
    }
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
      notifications: [],
      deliveries: [],
      deliveryColumns: [...(initialData.deliveryColumns || [])],
      deliveryTags: [...(initialData.deliveryTags || [])],
      inbox: []
    };
    this.saveState();
  }

  updateProfile(profileData) {
    this.state.profile = { ...this.state.profile, ...profileData };
    this.saveState();
    auth.updateProfileData(profileData);
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
      message: `${newLead.name} (${newLead.company || ''}) cadastrado no funil.`,
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
      notes: `Convertido de Lead em ${new Date().toLocaleDateString('pt-BR')}. Notas anteriores: ${lead.notes || 'Nenhuma'}`,
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
      message: `${newClient.name} foi adicionado à carteira de clientes ativos.`,
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
      message: `${newClient.name} foi cadastrado com sucesso.`,
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
      number: `PROP-${year}-${String(count).padStart(3, '0')}`,
      createdAt: new Date().toISOString().split('T')[0],
      status: 'rascunho',
      discount: 0,
      ...proposal
    };
    newProposal.finalValue = (newProposal.value || 0) - (newProposal.discount || 0);
    this.state.proposals.unshift(newProposal);
    this.addNotification({
      title: 'Nova Proposta Gerada',
      message: `Proposta ${newProposal.number} criada para ${newProposal.clientName || 'cliente'}.`,
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
      title: `${prop.serviceName} - ${prop.clientName || 'Cliente'}`,
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
      notes: `Gerado automaticamente a partir da proposta ${prop.number}. Observações: ${prop.notes || ''}`,
      tasks: (prop.deliverables || ['Alinhamento de briefing', 'Execução', 'Entrega e validação']).map((d, i) => ({
        id: `pt-${Date.now()}-${i}`,
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
      message: `A proposta ${prop.number} foi aprovada e gerou o projeto '${newProject.title}'.`,
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
      message: `Projeto '${newProject.title}' criado.`,
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

  markTransactionAsPaid(id) {
    const tx = this.state.transactions.find(t => t.id === id);
    if (!tx) return null;
    tx.status = 'paid';
    tx.paidAt = new Date().toISOString().split('T')[0];

    // Se for receita com cliente vinculado, atualiza LTV
    if (tx.type === 'income' && tx.clientId) {
      const client = this.state.clients.find(c => c.id === tx.clientId);
      if (client) {
        client.totalGenerated = (client.totalGenerated || 0) + (tx.amount || 0);
        if (client.projectsCount > 0) {
          client.averageTicket = Math.round(client.totalGenerated / client.projectsCount);
        }
      }
    }

    // Atualiza metas vinculadas
    if (tx.type === 'income') {
      const relatedGoals = (this.state.goals || []).filter(g =>
        g.scope === tx.scope &&
        (g.linkedCategory === tx.category || !g.linkedCategory || g.category === 'Receita')
      );
      relatedGoals.forEach(g => {
        g.currentValue = (g.currentValue || 0) + (tx.amount || 0);
      });
    }

    this.addXP(30, `Recebimento de ${tx.title} baixado no caixa`);
    this.saveState();
    return tx;
  }

  addTransactionWithInstallments(txData, count) {
    const totalAmount = parseFloat(txData.amount) || 0;
    const countInt = Math.max(1, parseInt(count) || 1);
    const installmentValue = parseFloat((totalAmount / countInt).toFixed(2));
    const baseDate = txData.date || new Date().toISOString().split('T')[0];
    const initialStatus = txData.status || 'paid';
    const createdTxs = [];

    for (let i = 0; i < countInt; i++) {
      const [y, m, d] = baseDate.split('-').map(Number);
      const instDate = new Date(y, m - 1 + i, d, 12, 0, 0);
      const instDateStr = `${instDate.getFullYear()}-${String(instDate.getMonth() + 1).padStart(2, '0')}-${String(instDate.getDate()).padStart(2, '0')}`;

      const tx = {
        id: `tx-${Date.now()}-${i}`,
        title: `${txData.title} (${i + 1}/${countInt})`,
        type: txData.type,
        scope: txData.scope || 'business',
        amount: i === countInt - 1 ? parseFloat((totalAmount - (installmentValue * (countInt - 1))).toFixed(2)) : installmentValue,
        date: instDateStr,
        dueDate: instDateStr,
        status: i === 0 ? initialStatus : 'pending',
        category: txData.category,
        paymentMethod: txData.paymentMethod || 'Pix',
        clientId: txData.clientId || null,
        clientName: txData.clientName || null,
        projectId: txData.projectId || null,
        notes: txData.notes || '',
        installmentNumber: i + 1,
        totalInstallments: countInt
      };

      if (tx.status === 'paid' && tx.type === 'income' && tx.clientId) {
        const client = this.state.clients.find(c => c.id === tx.clientId);
        if (client) {
          client.totalGenerated = (client.totalGenerated || 0) + tx.amount;
        }
      }

      this.state.transactions.unshift(tx);
      createdTxs.push(tx);
    }

    this.saveState();
    return createdTxs;
  }

  // --- RECORRÊNCIAS FINANCEIRAS REAIS (V2.2) ---
  addRecurringRule(ruleData) {
    if (!this.state.recurringRules) this.state.recurringRules = [];

    const ruleId = 'rec-' + Date.now();
    const startDate = ruleData.startDate || new Date().toISOString().split('T')[0];
    const durationMode = ruleData.durationMode || (ruleData.occurrencesCount ? 'occurrences' : (ruleData.endDate ? 'until_date' : 'infinite'));
    const occurrencesCount = ruleData.occurrencesCount ? parseInt(ruleData.occurrencesCount) : (durationMode === 'infinite' ? 12 : null);

    const rule = {
      id: ruleId,
      userId: this.currentUserId || 'guest',
      title: ruleData.title,
      type: ruleData.type || 'income',
      amount: parseFloat(ruleData.amount) || 0,
      frequency: ruleData.frequency || 'monthly', // weekly, monthly, bimonthly, quarterly, semiannual, annual, custom
      startDate,
      endDate: ruleData.endDate || null,
      occurrencesCount,
      durationMode,
      category: ruleData.category || (ruleData.type === 'income' ? 'Recorrência / Retainer' : 'Software & SaaS'),
      scope: ruleData.scope || 'business',
      clientId: ruleData.clientId || null,
      clientName: ruleData.clientName || null,
      projectId: ruleData.projectId || null,
      paymentMethod: ruleData.paymentMethod || 'Pix',
      notes: ruleData.notes || '',
      status: 'active',
      createdAt: new Date().toISOString()
    };

    // Gera ocorrências com base na regra
    const occurrences = [];
    let countToGenerate = 12;

    if (durationMode === 'occurrences' && occurrencesCount) {
      countToGenerate = Math.min(60, occurrencesCount);
    } else if (durationMode === 'until_date' && rule.endDate) {
      // Calcula ocorrências até a data final
      countToGenerate = 1;
      let checkDate = startDate;
      while (countToGenerate < 60) {
        checkDate = this.calculateNextRecurringDate(startDate, rule.frequency, countToGenerate);
        if (checkDate > rule.endDate) break;
        countToGenerate++;
      }
    }

    const initialStatus = ruleData.initialStatus || (ruleData.type === 'income' ? 'pending' : 'paid');

    for (let i = 0; i < countToGenerate; i++) {
      const occDate = this.calculateNextRecurringDate(startDate, rule.frequency, i);
      if (rule.endDate && occDate > rule.endDate) break;

      const occTx = {
        id: `tx-rec-${Date.now()}-${i}`,
        recurringId: ruleId,
        occurrenceIndex: i + 1,
        totalOccurrences: rule.occurrencesCount || null,
        isRecurring: true,
        title: `${rule.title} (${i + 1}${rule.occurrencesCount ? '/' + rule.occurrencesCount : ''})`,
        type: rule.type,
        amount: rule.amount,
        scope: rule.scope,
        category: rule.category,
        clientId: rule.clientId,
        clientName: rule.clientName,
        projectId: rule.projectId,
        paymentMethod: rule.paymentMethod,
        date: occDate,
        dueDate: occDate,
        status: i === 0 ? initialStatus : 'pending',
        notes: rule.notes
      };

      if (occTx.status === 'paid' && occTx.type === 'income' && occTx.clientId) {
        const client = this.state.clients.find(c => c.id === occTx.clientId);
        if (client) {
          client.totalGenerated = (client.totalGenerated || 0) + occTx.amount;
        }
      }

      this.state.transactions.unshift(occTx);
      occurrences.push(occTx);
    }

    this.state.recurringRules.unshift(rule);
    this.saveState();
    return { rule, occurrences };
  }

  calculateNextRecurringDate(baseDateStr, frequency, index) {
    if (index === 0) return baseDateStr;
    const [y, m, d] = baseDateStr.split('-').map(Number);
    const date = new Date(y, m - 1, d, 12, 0, 0);

    if (frequency === 'weekly' || frequency === 'semanal') {
      date.setDate(date.getDate() + (index * 7));
    } else if (frequency === 'bimonthly' || frequency === 'bimestral') {
      date.setMonth(date.getMonth() + (index * 2));
    } else if (frequency === 'quarterly' || frequency === 'trimestral') {
      date.setMonth(date.getMonth() + (index * 3));
    } else if (frequency === 'semiannual' || frequency === 'semestral') {
      date.setMonth(date.getMonth() + (index * 6));
    } else if (frequency === 'annual' || frequency === 'anual') {
      date.setFullYear(date.getFullYear() + index);
    } else {
      // Mensal ou padrão
      date.setMonth(date.getMonth() + index);
    }

    const resY = date.getFullYear();
    const resM = String(date.getMonth() + 1).padStart(2, '0');
    const resD = String(date.getDate()).padStart(2, '0');
    return `${resY}-${resM}-${resD}`;
  }

  updateRecurringTransaction(txId, updates, editScope = 'single') {
    const tx = this.state.transactions.find(t => t.id === txId);
    if (!tx) return;

    if (editScope === 'single' || !tx.recurringId) {
      const idx = this.state.transactions.findIndex(t => t.id === txId);
      if (idx !== -1) {
        this.state.transactions[idx] = { ...this.state.transactions[idx], ...updates };
      }
    } else if (editScope === 'future') {
      // Altera este lançamento e os próximos não pagos da recorrência
      this.state.transactions.forEach(t => {
        if (t.recurringId === tx.recurringId && t.date >= tx.date && t.status !== 'paid') {
          if (updates.amount !== undefined) t.amount = parseFloat(updates.amount) || 0;
          if (updates.category) t.category = updates.category;
          if (updates.paymentMethod) t.paymentMethod = updates.paymentMethod;
          if (updates.title) {
            const occPart = t.title.match(/\(\d+.*?\)/) ? ' ' + t.title.match(/\(\d+.*?\)/)[0] : '';
            t.title = updates.title.replace(/\s*\(\d+.*?\)/, '') + occPart;
          }
        }
      });
      // Atualiza regra
      const rule = (this.state.recurringRules || []).find(r => r.id === tx.recurringId);
      if (rule) {
        if (updates.amount !== undefined) rule.amount = parseFloat(updates.amount) || 0;
        if (updates.category) rule.category = updates.category;
      }
    } else if (editScope === 'all') {
      // Altera toda a recorrência (mantendo parcelas já pagas sem alteração de valor)
      this.state.transactions.forEach(t => {
        if (t.recurringId === tx.recurringId) {
          if (t.status !== 'paid' && updates.amount !== undefined) {
            t.amount = parseFloat(updates.amount) || 0;
          }
          if (updates.category) t.category = updates.category;
          if (updates.paymentMethod) t.paymentMethod = updates.paymentMethod;
          if (updates.title) {
            const occPart = t.title.match(/\(\d+.*?\)/) ? ' ' + t.title.match(/\(\d+.*?\)/)[0] : '';
            t.title = updates.title.replace(/\s*\(\d+.*?\)/, '') + occPart;
          }
        }
      });
      const rule = (this.state.recurringRules || []).find(r => r.id === tx.recurringId);
      if (rule) {
        if (updates.amount !== undefined) rule.amount = parseFloat(updates.amount) || 0;
        if (updates.category) rule.category = updates.category;
        if (updates.title) rule.title = updates.title;
      }
    }

    this.saveState();
  }

  cancelRecurringRule(ruleId) {
    const rule = (this.state.recurringRules || []).find(r => r.id === ruleId);
    if (rule) {
      rule.status = 'cancelled';
      rule.cancelledAt = new Date().toISOString();
    }

    const todayStr = new Date().toISOString().split('T')[0];
    // Cancela apenas ocorrências futuras pendentes, mantendo histórico pago intacto
    this.state.transactions.forEach(t => {
      if (t.recurringId === ruleId && t.status === 'pending' && (t.date >= todayStr || t.dueDate >= todayStr)) {
        t.status = 'cancelled';
      }
    });

    this.saveState();
  }

  // --- CÁLCULO DE FLUXO DE CAIXA 100% REAL (V2.2) ---
  getFinancialCashflow(scope = 'business', period = '30d') {
    const txs = (this.state.transactions || []).filter(t => t.scope === scope && t.status !== 'cancelled');
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    let labels = [];
    let realIncome = [];
    let realExpense = [];
    let projectedIncome = [];
    let projectedExpense = [];
    let hasData = txs.length > 0;

    if (period === '7d') {
      const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dStr = d.toISOString().split('T')[0];
        labels.push(days[d.getDay()]);

        const paidInc = txs.filter(t => t.type === 'income' && t.status === 'paid' && t.date === dStr).reduce((acc, t) => acc + (t.amount || 0), 0);
        const paidExp = txs.filter(t => t.type === 'expense' && t.status === 'paid' && t.date === dStr).reduce((acc, t) => acc + (t.amount || 0), 0);
        const projInc = txs.filter(t => t.type === 'income' && t.status === 'pending' && (t.dueDate === dStr || t.date === dStr)).reduce((acc, t) => acc + (t.amount || 0), 0);
        const projExp = txs.filter(t => t.type === 'expense' && t.status === 'pending' && (t.dueDate === dStr || t.date === dStr)).reduce((acc, t) => acc + (t.amount || 0), 0);

        realIncome.push(paidInc);
        realExpense.push(paidExp);
        projectedIncome.push(projInc);
        projectedExpense.push(projExp);
      }
    } else if (period === '30d') {
      // Agrupa em 4 semanas dos últimos 30 dias
      for (let w = 3; w >= 0; w--) {
        const startDay = new Date();
        startDay.setDate(startDay.getDate() - (w * 7 + 6));
        const endDay = new Date();
        endDay.setDate(endDay.getDate() - (w * 7));
        const startStr = startDay.toISOString().split('T')[0];
        const endStr = endDay.toISOString().split('T')[0];
        labels.push(`Sem ${4 - w}`);

        const paidInc = txs.filter(t => t.type === 'income' && t.status === 'paid' && t.date >= startStr && t.date <= endStr).reduce((acc, t) => acc + (t.amount || 0), 0);
        const paidExp = txs.filter(t => t.type === 'expense' && t.status === 'paid' && t.date >= startStr && t.date <= endStr).reduce((acc, t) => acc + (t.amount || 0), 0);
        const projInc = txs.filter(t => t.type === 'income' && t.status === 'pending' && (t.dueDate || t.date) >= startStr && (t.dueDate || t.date) <= endStr).reduce((acc, t) => acc + (t.amount || 0), 0);
        const projExp = txs.filter(t => t.type === 'expense' && t.status === 'pending' && (t.dueDate || t.date) >= startStr && (t.dueDate || t.date) <= endStr).reduce((acc, t) => acc + (t.amount || 0), 0);

        realIncome.push(paidInc);
        realExpense.push(paidExp);
        projectedIncome.push(projInc);
        projectedExpense.push(projExp);
      }
    } else if (period === 'current_vs_previous') {
      // Mês atual vs Mês anterior
      const curYear = now.getFullYear();
      const curM = now.getMonth();
      const prevDate = new Date(curYear, curM - 1, 1);
      const prevYear = prevDate.getFullYear();
      const prevM = prevDate.getMonth();

      labels = [`${months[prevM]}/${prevYear}`, `${months[curM]}/${curYear}`];

      [ { y: prevYear, m: prevM }, { y: curYear, m: curM } ].forEach(item => {
        const mStr = `${item.y}-${String(item.m + 1).padStart(2, '0')}`;
        const paidInc = txs.filter(t => t.type === 'income' && t.status === 'paid' && (t.date || '').startsWith(mStr)).reduce((acc, t) => acc + (t.amount || 0), 0);
        const paidExp = txs.filter(t => t.type === 'expense' && t.status === 'paid' && (t.date || '').startsWith(mStr)).reduce((acc, t) => acc + (t.amount || 0), 0);
        const projInc = txs.filter(t => t.type === 'income' && t.status === 'pending' && ((t.dueDate || t.date) || '').startsWith(mStr)).reduce((acc, t) => acc + (t.amount || 0), 0);
        const projExp = txs.filter(t => t.type === 'expense' && t.status === 'pending' && ((t.dueDate || t.date) || '').startsWith(mStr)).reduce((acc, t) => acc + (t.amount || 0), 0);

        realIncome.push(paidInc);
        realExpense.push(paidExp);
        projectedIncome.push(projInc);
        projectedExpense.push(projExp);
      });
    } else {
      // 90d (3 meses), 6m ou 12m
      const monthsCount = period === '90d' ? 3 : (period === '12m' ? 12 : 6);
      for (let i = monthsCount - 1; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const mStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        labels.push(months[d.getMonth()]);

        const paidInc = txs.filter(t => t.type === 'income' && t.status === 'paid' && (t.date || '').startsWith(mStr)).reduce((acc, t) => acc + (t.amount || 0), 0);
        const paidExp = txs.filter(t => t.type === 'expense' && t.status === 'paid' && (t.date || '').startsWith(mStr)).reduce((acc, t) => acc + (t.amount || 0), 0);
        const projInc = txs.filter(t => t.type === 'income' && t.status === 'pending' && ((t.dueDate || t.date) || '').startsWith(mStr)).reduce((acc, t) => acc + (t.amount || 0), 0);
        const projExp = txs.filter(t => t.type === 'expense' && t.status === 'pending' && ((t.dueDate || t.date) || '').startsWith(mStr)).reduce((acc, t) => acc + (t.amount || 0), 0);

        realIncome.push(paidInc);
        realExpense.push(paidExp);
        projectedIncome.push(projInc);
        projectedExpense.push(projExp);
      }
    }

    const totalRealIncome = realIncome.reduce((a, b) => a + b, 0);
    const totalRealExpense = realExpense.reduce((a, b) => a + b, 0);
    const totalProjIncome = projectedIncome.reduce((a, b) => a + b, 0);
    const totalProjExpense = projectedExpense.reduce((a, b) => a + b, 0);

    return {
      labels,
      realIncome,
      realExpense,
      projectedIncome,
      projectedExpense,
      totalRealIncome,
      totalRealExpense,
      netRealBalance: totalRealIncome - totalRealExpense,
      totalProjIncome,
      totalProjExpense,
      netProjectedBalance: (totalRealIncome + totalProjIncome) - (totalRealExpense + totalProjExpense),
      hasData: (totalRealIncome + totalRealExpense + totalProjIncome + totalProjExpense) > 0
    };
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
  // --- ENTREGAS & OPERAÇÕES ---
  addDelivery(delivery) {
    const newDelivery = {
      id: 'del-' + Date.now(),
      title: 'Nova Entrega',
      status: 'backlog',
      priority: 'media',
      coverImage: '',
      dueDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      assignee: this.state.profile.name,
      tags: [],
      description: '',
      checklist: [],
      files: [],
      comments: [],
      history: [
        { id: 'h-' + Date.now(), date: new Date().toISOString().replace('T', ' ').slice(0, 16), text: 'Entrega criada no sistema.' }
      ],
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
      ...delivery
    };

    if (newDelivery.clientId && !newDelivery.clientName) {
      const client = this.state.clients.find(c => c.id === newDelivery.clientId);
      if (client) newDelivery.clientName = client.name;
    }
    if (newDelivery.projectId && !newDelivery.projectName) {
      const project = this.state.projects.find(p => p.id === newDelivery.projectId);
      if (project) newDelivery.projectName = project.title;
    }

    if (!this.state.deliveries) this.state.deliveries = [];
    this.state.deliveries.unshift(newDelivery);

    if (newDelivery.projectId) {
      this.calculateProjectProgressFromDeliveries(newDelivery.projectId);
    }

    this.addNotification({
      title: 'Nova Entrega Cadastrada',
      message: `'${newDelivery.title}' adicionada à Central de Entregas.`,
      type: 'info',
      link: 'entregas'
    });

    this.saveState();
    return newDelivery;
  }

  updateDelivery(id, updates, historyMsg = null) {
    if (!this.state.deliveries) this.state.deliveries = [];
    const idx = this.state.deliveries.findIndex(d => d.id === id);
    if (idx !== -1) {
      const d = this.state.deliveries[idx];
      const history = d.history ? [...d.history] : [];
      if (historyMsg) {
        history.unshift({
          id: 'h-' + Date.now(),
          date: new Date().toISOString().replace('T', ' ').slice(0, 16),
          text: historyMsg
        });
      }
      this.state.deliveries[idx] = {
        ...d,
        ...updates,
        history,
        updatedAt: new Date().toISOString().split('T')[0]
      };

      if (this.state.deliveries[idx].projectId) {
        this.calculateProjectProgressFromDeliveries(this.state.deliveries[idx].projectId);
      }

      this.saveState();
    }
  }

  deleteDelivery(id) {
    if (!this.state.deliveries) return;
    const d = this.state.deliveries.find(x => x.id === id);
    const projectId = d?.projectId;
    this.state.deliveries = this.state.deliveries.filter(x => x.id !== id);
    if (projectId) {
      this.calculateProjectProgressFromDeliveries(projectId);
    }
    this.saveState();
  }

  duplicateDelivery(id, newTitle) {
    if (!this.state.deliveries) return null;
    const orig = this.state.deliveries.find(d => d.id === id);
    if (!orig) return null;

    const dup = {
      ...orig,
      id: 'del-' + Date.now(),
      title: newTitle || `${orig.title} (Cópia)`,
      checklist: (orig.checklist || []).map(item => ({ ...item, id: 'c-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4), completed: false })),
      files: [],
      comments: [],
      history: [
        { id: 'h-' + Date.now(), date: new Date().toISOString().replace('T', ' ').slice(0, 16), text: `Duplicada a partir de '${orig.title}'.` }
      ],
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0]
    };

    this.state.deliveries.unshift(dup);
    if (dup.projectId) {
      this.calculateProjectProgressFromDeliveries(dup.projectId);
    }
    this.saveState();
    return dup;
  }

  moveDeliveryStatus(deliveryId, targetStatus) {
    if (!this.state.deliveries) return;
    const delivery = this.state.deliveries.find(d => d.id === deliveryId);
    if (!delivery) return;

    const prevStatus = delivery.status;
    if (prevStatus === targetStatus) return;

    delivery.status = targetStatus;
    delivery.updatedAt = new Date().toISOString().split('T')[0];
    if (targetStatus === 'entregue') {
      delivery.completedAt = new Date().toISOString().split('T')[0];
    } else {
      delivery.completedAt = null;
    }

    if (!delivery.history) delivery.history = [];
    delivery.history.unshift({
      id: 'h-' + Date.now(),
      date: new Date().toISOString().replace('T', ' ').slice(0, 16),
      text: `Status alterado de '${prevStatus}' para '${targetStatus}'.`
    });

    if (delivery.projectId) {
      this.calculateProjectProgressFromDeliveries(delivery.projectId);
    }

    this.saveState();
  }

  toggleDeliveryChecklistItem(deliveryId, itemId) {
    if (!this.state.deliveries) return;
    const delivery = this.state.deliveries.find(d => d.id === deliveryId);
    if (!delivery || !delivery.checklist) return;

    const item = delivery.checklist.find(i => i.id === itemId);
    if (item) {
      item.completed = !item.completed;
      if (!delivery.history) delivery.history = [];
      delivery.history.unshift({
        id: 'h-' + Date.now(),
        date: new Date().toISOString().replace('T', ' ').slice(0, 16),
        text: `Item do checklist '${item.title}' marcado como ${item.completed ? 'concluído' : 'pendente'}.`
      });
      this.saveState();
    }
  }

  addDeliveryChecklistItem(deliveryId, title) {
    if (!this.state.deliveries) return;
    const delivery = this.state.deliveries.find(d => d.id === deliveryId);
    if (!delivery) return;
    if (!delivery.checklist) delivery.checklist = [];

    const newItem = {
      id: 'c-' + Date.now(),
      title,
      completed: false
    };
    delivery.checklist.push(newItem);
    this.saveState();
    return newItem;
  }

  deleteDeliveryChecklistItem(deliveryId, itemId) {
    if (!this.state.deliveries) return;
    const delivery = this.state.deliveries.find(d => d.id === deliveryId);
    if (!delivery || !delivery.checklist) return;
    delivery.checklist = delivery.checklist.filter(i => i.id !== itemId);
    this.saveState();
  }

  addDeliveryFile(deliveryId, file) {
    if (!this.state.deliveries) return;
    const delivery = this.state.deliveries.find(d => d.id === deliveryId);
    if (!delivery) return;
    if (!delivery.files) delivery.files = [];

    const newFile = {
      id: file.id || ('f-' + Date.now()),
      storageId: file.storageId || null,
      name: file.name,
      size: file.size || '1.5 MB',
      type: file.type || 'arquivo',
      date: new Date().toISOString().split('T')[0],
      uploader: this.state.profile?.name || 'Usuário',
      url: file.url || '#'
    };
    delivery.files.push(newFile);

    // Conexão automática com a Central de Documentos
    this.addDocument({
      id: newFile.storageId || newFile.id,
      storageId: newFile.storageId || null,
      name: newFile.name,
      category: 'Entregas',
      format: newFile.type,
      size: newFile.size,
      clientId: delivery.clientId || null,
      clientName: delivery.clientName || null,
      projectId: delivery.projectId || null,
      projectName: delivery.projectName || null,
      deliveryId: delivery.id,
      deliveryTitle: delivery.title
    });

    if (!delivery.history) delivery.history = [];
    delivery.history.unshift({
      id: 'h-' + Date.now(),
      date: new Date().toISOString().replace('T', ' ').slice(0, 16),
      text: `Arquivo '${newFile.name}' anexado à entrega.`
    });

    this.saveState();
    return newFile;
  }

  deleteDeliveryFile(deliveryId, fileId) {
    if (!this.state.deliveries) return;
    const delivery = this.state.deliveries.find(d => d.id === deliveryId);
    if (!delivery || !delivery.files) return;
    delivery.files = delivery.files.filter(f => f.id !== fileId && f.storageId !== fileId);
    this.saveState();
  }

  addDeliveryComment(deliveryId, text) {
    if (!this.state.deliveries) return;
    const delivery = this.state.deliveries.find(d => d.id === deliveryId);
    if (!delivery) return;
    if (!delivery.comments) delivery.comments = [];

    const now = new Date();
    const newComment = {
      id: 'com-' + Date.now(),
      author: this.state.profile.name,
      date: now.toISOString().split('T')[0],
      time: now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      text
    };
    delivery.comments.push(newComment);

    if (!delivery.history) delivery.history = [];
    delivery.history.unshift({
      id: 'h-' + Date.now(),
      date: now.toISOString().replace('T', ' ').slice(0, 16),
      text: `Novo comentário adicionado por ${newComment.author}.`
    });

    this.saveState();
    return newComment;
  }

  deleteDeliveryComment(deliveryId, commentId) {
    if (!this.state.deliveries) return;
    const delivery = this.state.deliveries.find(d => d.id === deliveryId);
    if (!delivery || !delivery.comments) return;
    delivery.comments = delivery.comments.filter(c => c.id !== commentId);
    this.saveState();
  }

  addDeliveryColumn(column) {
    if (!this.state.deliveryColumns) this.state.deliveryColumns = [];
    const newCol = {
      id: 'col-' + Date.now(),
      title: column.title || 'Nova Coluna',
      color: column.color || 'border-zinc-400'
    };
    this.state.deliveryColumns.push(newCol);
    this.saveState();
    return newCol;
  }

  renameDeliveryColumn(id, title) {
    if (!this.state.deliveryColumns) return;
    const col = this.state.deliveryColumns.find(c => c.id === id);
    if (col) {
      col.title = title;
      this.saveState();
    }
  }

  deleteDeliveryColumn(id) {
    if (!this.state.deliveryColumns) return;
    this.state.deliveryColumns = this.state.deliveryColumns.filter(c => c.id !== id);
    this.saveState();
  }

  addDeliveryTag(tag) {
    if (!this.state.deliveryTags) this.state.deliveryTags = [];
    const newTag = {
      id: 'tag-' + Date.now(),
      name: tag.name,
      color: tag.color || '#3B82F6'
    };
    this.state.deliveryTags.push(newTag);
    this.saveState();
    return newTag;
  }

  calculateProjectProgressFromDeliveries(projectId) {
    const project = this.state.projects.find(p => p.id === projectId);
    if (!project) return;

    const projectDeliveries = (this.state.deliveries || []).filter(d => d.projectId === projectId);
    if (projectDeliveries.length > 0) {
      const deliveredCount = projectDeliveries.filter(d => d.status === 'entregue').length;
      const progressPercent = Math.round((deliveredCount / projectDeliveries.length) * 100);

      if (progressPercent === 100 && project.stage !== 'pago') {
        project.stage = 'entrega';
      }
    }
  }

  getDeliveryMetrics() {
    const deliveries = this.state.deliveries || [];
    const todayStr = new Date().toISOString().split('T')[0];

    const inProgress = deliveries.filter(d => d.status === 'em_andamento').length;
    const inReview = deliveries.filter(d => d.status === 'em_revisao').length;
    const delivered = deliveries.filter(d => d.status === 'entregue').length;
    const dueToday = deliveries.filter(d => d.dueDate === todayStr && d.status !== 'entregue').length;
    const overdue = deliveries.filter(d => d.dueDate && d.dueDate < todayStr && d.status !== 'entregue').length;
    const dueSoon = deliveries.filter(d => {
      if (!d.dueDate || d.status === 'entregue' || d.dueDate <= todayStr) return false;
      const diffDays = (new Date(d.dueDate) - new Date(todayStr)) / 86400000;
      return diffDays <= 3;
    }).length;

    return {
      total: deliveries.length,
      inProgress,
      inReview,
      delivered,
      overdue,
      dueToday,
      dueSoon
    };
  }

  // --- METRICAS CALCULADAS DO DASHBOARD & RELACIONAMENTOS ---
  getDashboardMetrics(period = 'mes') {
    if (!this.state) {
      return {
        financial: { income: 0, expenses: 0, profit: 0, balance: 0, receivable: 0, payable: 0 },
        commercial: { inFunnel: 0, newLeads: 0, converted: 0, conversionRate: 0, totalProposalValue: 0, approvedProposalValue: 0, negotiatingProposalValue: 0 },
        projects: { active: 0, completed: 0, urgent: 0, totalRevenue: 0 },
        deliveries: { total: 0, backlog: 0, inProgress: 0, inReview: 0, delivered: 0, overdue: 0, dueToday: 0, dueSoon: 0 }
      };
    }

    const txs = (this.state.transactions || []).filter(t => t.scope === 'business');
    const incomeTxs = txs.filter(t => t.type === 'income');
    const expenseTxs = txs.filter(t => t.type === 'expense');

    const totalIncome = incomeTxs.filter(t => t.status === 'paid').reduce((acc, t) => acc + (t.amount || 0), 0);
    const totalExpense = expenseTxs.filter(t => t.status === 'paid').reduce((acc, t) => acc + (t.amount || 0), 0);
    const profit = totalIncome - totalExpense;

    const receivable = txs
      .filter(t => t.type === 'income' && t.status !== 'paid')
      .reduce((acc, t) => acc + (t.amount || 0), 0);
    const payable = txs
      .filter(t => t.type === 'expense' && t.status !== 'paid')
      .reduce((acc, t) => acc + (t.amount || 0), 0);

    const leads = this.state.leads || [];
    const leadsInFunnel = leads.filter(l => l.status !== 'aprovado' && l.status !== 'cancelado').length;
    const leadsConverted = leads.filter(l => l.status === 'aprovado').length;
    const conversionRate = leads.length > 0 ? Math.round((leadsConverted / leads.length) * 100) : 0;

    const proposals = this.state.proposals || [];
    const proposalTotal = proposals.reduce((acc, p) => acc + (p.finalValue || p.value || 0), 0);
    const proposalApproved = proposals.filter(p => p.status === 'aprovada').reduce((acc, p) => acc + (p.finalValue || p.value || 0), 0);
    const proposalNegotiating = proposals.filter(p => p.status === 'negociacao' || p.status === 'enviada').reduce((acc, p) => acc + (p.finalValue || p.value || 0), 0);

    const projects = this.state.projects || [];
    const activeProjects = projects.filter(p => p.stage !== 'entrega' && p.stage !== 'pago' && p.stage !== 'cancelado').length;
    const completedProjects = projects.filter(p => p.stage === 'entrega' || p.stage === 'pago').length;
    const urgentProjects = projects.filter(p => p.priority === 'urgente' && p.stage !== 'entrega').length;

    return {
      financial: {
        income: totalIncome,
        expenses: totalExpense,
        profit: profit,
        balance: profit,
        receivable: receivable,
        payable: payable
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
      },
      deliveries: this.getDeliveryMetrics()
    };
  }

  // --- XP & GAMIFICAÇÃO DISCRETA (V2) ---
  addXP(amount, reason = '') {
    if (!this.state.profile) return;
    if (this.state.profile.xpEnabled === false) return;
    const oldLevel = Math.floor((this.state.profile.xp || 0) / 100) + 1;
    this.state.profile.xp = (this.state.profile.xp || 0) + amount;
    const newLevel = Math.floor(this.state.profile.xp / 100) + 1;
    this.state.profile.level = newLevel;

    if (newLevel > oldLevel) {
      this.addNotification({
        title: '🎉 Nível Aumentado!',
        message: `Parabéns! Você alcançou o Nível ${newLevel} no APP TESTE.`,
        type: 'success',
        link: 'dashboard'
      });
    }
    this.saveState();
  }

  toggleXPEnabled() {
    if (!this.state.profile) return;
    this.state.profile.xpEnabled = !this.state.profile.xpEnabled;
    this.saveState();
  }

  // --- ITENS QUE PRECISAM DE ATENÇÃO (V2) ---
  calculateAttentionItems() {
    const items = [];
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    // 1. Projetos atrasados
    const activeProjects = (this.state.projects || []).filter(p => p.stage !== 'entrega' && p.stage !== 'pago' && p.stage !== 'cancelado');
    activeProjects.forEach(p => {
      if (p.deadlineDate && p.deadlineDate < todayStr) {
        const diffDays = Math.ceil((today - new Date(p.deadlineDate)) / (1000 * 60 * 60 * 24));
        items.push({
          id: `att-proj-${p.id}`,
          type: 'project',
          severity: 'high',
          badge: 'Projeto Atrasado',
          badgeColor: 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 border-rose-200 dark:border-rose-900',
          title: p.title,
          subtitle: `${p.clientName || 'Cliente'} • ${diffDays} ${diffDays === 1 ? 'dia atrasado' : 'dias atrasado'}`,
          actionLabel: 'ABRIR PROJETO',
          link: 'projects',
          targetId: p.id
        });
      }
    });

    // 2. Propostas sem resposta há mais de 3 dias
    const openProposals = (this.state.proposals || []).filter(p => p.status === 'enviada' || p.status === 'negociacao');
    openProposals.forEach(p => {
      if (p.createdAt) {
        const diffDays = Math.floor((today - new Date(p.createdAt)) / (1000 * 60 * 60 * 24));
        if (diffDays >= 3) {
          const valFormatted = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(p.finalValue || p.value || 0);
          items.push({
            id: `att-prop-${p.id}`,
            type: 'proposal',
            severity: 'medium',
            badge: 'Proposta Sem Resposta',
            badgeColor: 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border-amber-200 dark:border-amber-900',
            title: `${p.clientName || 'Cliente'} (${p.number})`,
            subtitle: `${valFormatted} • Enviada há ${diffDays} dias`,
            actionLabel: 'ABRIR PROPOSTA',
            link: 'proposals',
            targetId: p.id
          });
        }
      }
    });

    // 3. Pagamentos próximos ou atrasados
    const pendingTxs = (this.state.transactions || []).filter(t => t.status !== 'paid' && t.type === 'income');
    pendingTxs.forEach(t => {
      const valFormatted = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(t.amount || 0);
      const clientName = t.clientName || (t.clientId ? (this.state.clients.find(c => c.id === t.clientId)?.name) : 'Recebimento');
      if (t.dueDate < todayStr) {
        const diffDays = Math.ceil((today - new Date(t.dueDate)) / (1000 * 60 * 60 * 24));
        items.push({
          id: `att-tx-overdue-${t.id}`,
          type: 'finance',
          severity: 'high',
          badge: 'Recebimento Atrasado',
          badgeColor: 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 border-rose-200 dark:border-rose-900',
          title: clientName,
          subtitle: `${valFormatted} • Vencido há ${diffDays} ${diffDays === 1 ? 'dia' : 'dias'}`,
          actionLabel: 'VER FINANCEIRO',
          link: 'finance',
          targetId: t.id
        });
      } else {
        const diffDays = Math.ceil((new Date(t.dueDate) - today) / (1000 * 60 * 60 * 24));
        if (diffDays <= 5) {
          const dueFormatted = t.dueDate.split('-').reverse().slice(0, 2).join('/');
          items.push({
            id: `att-tx-soon-${t.id}`,
            type: 'finance',
            severity: 'low',
            badge: 'Pagamento Próximo',
            badgeColor: 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400 border-blue-200 dark:border-blue-900',
            title: clientName,
            subtitle: `${valFormatted} • Vencimento em ${dueFormatted}`,
            actionLabel: 'VER FINANCEIRO',
            link: 'finance',
            targetId: t.id
          });
        }
      }
    });

    // 4. Clientes inativos (> 60 dias sem novo serviço)
    const activeClients = (this.state.clients || []).filter(c => c.status === 'active' || c.clientType === 'mensal');
    activeClients.forEach(c => {
      const refDate = c.lastServiceDate || c.entryDate;
      if (refDate) {
        const diffDays = Math.floor((today - new Date(refDate)) / (1000 * 60 * 60 * 24));
        if (diffDays >= 60) {
          items.push({
            id: `att-cli-${c.id}`,
            type: 'client',
            severity: 'medium',
            badge: 'Cliente Inativo',
            badgeColor: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700',
            title: c.name,
            subtitle: `${diffDays} dias sem novo serviço`,
            actionLabel: 'VER CLIENTE',
            link: 'clients',
            targetId: c.id
          });
        }
      }
    });

    return items;
  }

  // --- SAÚDE DO NEGÓCIO (V2) ---
  calculateBusinessHealth() {
    if (!this.state) {
      return {
        overall: 100,
        commercial: { score: 100, diagnosis: 'Iniciando operação. Cadastre seu primeiro lead no CRM.' },
        finance: { score: 100, diagnosis: 'Nenhuma despesa ou conta pendente. Tudo pronto para começar.' },
        projects: { score: 100, diagnosis: 'Nenhum projeto atrasado. Cronograma 100% em dia.' },
        relationship: { score: 100, diagnosis: 'Base de clientes pronta para receber novos cadastros.' }
      };
    }

    const leads = this.state.leads || [];
    const proposals = this.state.proposals || [];
    const projects = this.state.projects || [];
    const clients = this.state.clients || [];
    const transactions = this.state.transactions || [];

    // Se conta 100% nova sem nenhum registro
    if (leads.length === 0 && clients.length === 0 && projects.length === 0 && transactions.length === 0) {
      return {
        overall: 100,
        commercial: { score: 100, diagnosis: 'Iniciando operação. Cadastre seu primeiro lead no CRM.' },
        finance: { score: 100, diagnosis: 'Sem contas pendentes ou atrasadas. Tudo pronto para faturar.' },
        projects: { score: 100, diagnosis: 'Sem projetos atrasados. Inicie seus entregáveis no fluxo.' },
        relationship: { score: 100, diagnosis: 'Base de clientes pronta para receber novos cadastros.' }
      };
    }

    // 1. Comercial Score
    const leadsInFunnel = leads.filter(l => l.status !== 'aprovado' && l.status !== 'cancelado').length;
    const leadsConverted = leads.filter(l => l.status === 'aprovado').length;
    const conversionRate = leads.length > 0 ? (leadsConverted / leads.length) * 100 : 0;
    let commercialScore = 50;
    if (leadsInFunnel >= 3) commercialScore += 20;
    if (conversionRate >= 20) commercialScore += 20;
    if (proposals.some(p => p.status === 'negociacao')) commercialScore += 10;
    commercialScore = Math.min(100, Math.max(20, Math.round(commercialScore)));

    const openPipelineVal = proposals.filter(p => p.status === 'enviada' || p.status === 'negociacao').reduce((acc, p) => acc + (p.finalValue || p.value || 0), 0);
    const pipeFormatted = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(openPipelineVal);
    const commercialDiagnosis = leads.length === 0 
      ? 'Nenhum lead em negociação no momento. Cadastre leads no CRM.'
      : `Pipeline com ${pipeFormatted} em negociação e taxa de conversão de ${Math.round(conversionRate)}%.`;

    // 2. Financeiro Score
    const businessTxs = transactions.filter(t => t.scope === 'business');
    const income = businessTxs.filter(t => t.type === 'income').reduce((acc, t) => acc + (t.amount || 0), 0);
    const expense = businessTxs.filter(t => t.type === 'expense').reduce((acc, t) => acc + (t.amount || 0), 0);
    const overdueCount = transactions.filter(t => t.status !== 'paid' && t.dueDate && t.dueDate < new Date().toISOString().split('T')[0]).length;
    const margin = income > 0 ? Math.round(((income - expense) / income) * 100) : 0;

    let financeScore = 60;
    if (income > expense) financeScore += 20;
    if (margin >= 40) financeScore += 15;
    if (overdueCount > 0) financeScore -= (overdueCount * 10);
    financeScore = Math.min(100, Math.max(15, Math.round(financeScore)));

    let financeDiagnosis = transactions.length === 0
      ? 'Nenhuma movimentação no período. Registre sua primeira receita.'
      : `Margem operacional de ${margin}% e saldo positivo.`;
    if (overdueCount > 0) {
      financeDiagnosis = `Indicador reduzido porque existem ${overdueCount} ${overdueCount === 1 ? 'conta vencida' : 'contas vencidas'}. Margem de ${margin}%.`;
    }

    // 3. Projetos Score
    const activeProjects = projects.filter(p => p.stage !== 'entrega' && p.stage !== 'pago' && p.stage !== 'cancelado');
    const overdueProjects = activeProjects.filter(p => p.deadlineDate && p.deadlineDate < new Date().toISOString().split('T')[0]);
    let projectsScore = 75;
    if (overdueProjects.length === 0) projectsScore += 20;
    else projectsScore -= (overdueProjects.length * 15);
    projectsScore = Math.min(100, Math.max(20, Math.round(projectsScore)));

    const projectsDiagnosis = projects.length === 0
      ? 'Nenhum projeto cadastrado ainda. Crie seu primeiro projeto para acompanhar etapas.'
      : overdueProjects.length === 0 
        ? `Todos os ${activeProjects.length} projetos ativos estão dentro do cronograma previsto.` 
        : `${overdueProjects.length} ${overdueProjects.length === 1 ? 'projeto atrasado' : 'projetos atrasados'} requerem alinhamento imediato.`;

    // 4. Relacionamento Score
    const totalClients = clients.length;
    const inactiveClients = clients.filter(c => {
      const ref = c.lastServiceDate || c.entryDate;
      if (!ref) return false;
      const days = Math.floor((new Date() - new Date(ref)) / (1000 * 60 * 60 * 24));
      return days >= 60;
    }).length;
    const activeRatio = totalClients > 0 ? ((totalClients - inactiveClients) / totalClients) * 100 : 100;
    let relationshipScore = Math.min(100, Math.max(30, Math.round(activeRatio)));
    const relationshipDiagnosis = totalClients === 0
      ? 'Nenhum cliente cadastrado ainda. Adicione contatos na Central de Clientes.'
      : `${Math.round(activeRatio)}% da base de clientes com contato e serviço recente nos últimos 60 dias.`;

    const overallScore = Math.round((commercialScore + financeScore + projectsScore + relationshipScore) / 4);

    return {
      overall: overallScore,
      commercial: { score: commercialScore, diagnosis: commercialDiagnosis },
      finance: { score: financeScore, diagnosis: financeDiagnosis },
      projects: { score: projectsScore, diagnosis: projectsDiagnosis },
      relationship: { score: relationshipScore, diagnosis: relationshipDiagnosis }
    };
  }

  // --- INBOX / CAPTURA RÁPIDA (V2) ---
  addInboxItem(text, suggestedType = 'task') {
    if (!this.state.inbox) this.state.inbox = [];
    const item = {
      id: 'inb-' + Date.now(),
      text,
      createdAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
      status: 'pending',
      suggestedType
    };
    this.state.inbox.unshift(item);
    this.addXP(10, 'Demanda rápida capturada no Inbox');
    this.saveState();
    return item;
  }

  convertInboxItem(id, targetType, extraData = {}) {
    if (!this.state.inbox) return;
    const item = this.state.inbox.find(i => i.id === id);
    if (!item) return;

    if (targetType === 'task') {
      this.addTask({ title: item.text, ...extraData });
    } else if (targetType === 'delivery') {
      this.addDelivery({ title: item.text, ...extraData });
    } else if (targetType === 'project') {
      this.addProject({ title: item.text, ...extraData });
    } else if (targetType === 'event') {
      this.addEvent({ title: item.text, ...extraData });
    } else if (targetType === 'lead') {
      this.addLead({ name: item.text, notes: 'Criado a partir do Inbox', ...extraData });
    }

    item.status = 'converted';
    item.convertedTo = targetType;
    item.convertedAt = new Date().toISOString().replace('T', ' ').slice(0, 16);
    this.addXP(25, `Item do Inbox transformado em ${targetType}`);
    this.saveState();
  }

  deleteInboxItem(id) {
    if (!this.state.inbox) return;
    this.state.inbox = this.state.inbox.filter(i => i.id !== id);
    this.saveState();
  }

  // --- ATIVIDADES NO CRM (V2) ---
  addLeadActivity(leadId, activity) {
    const lead = this.state.leads.find(l => l.id === leadId);
    if (!lead) return;
    if (!lead.activities) lead.activities = [];

    const newActivity = {
      id: 'act-' + Date.now(),
      date: new Date().toISOString().replace('T', ' ').slice(0, 16),
      user: this.state.profile.name,
      ...activity
    };
    lead.activities.unshift(newActivity);
    lead.lastContact = new Date().toISOString().split('T')[0];

    this.addXP(15, 'Atividade comercial registrada');
    this.saveState();
    return newActivity;
  }

  // --- ATIVIDADES / HISTÓRICO DO CLIENTE 360 (V2) ---
  addClientActivity(clientId, activity) {
    const client = this.state.clients.find(c => c.id === clientId);
    if (!client) return;
    if (!client.activities) client.activities = [];

    const newActivity = {
      id: 'cact-' + Date.now(),
      date: new Date().toISOString().replace('T', ' ').slice(0, 16),
      user: this.state.profile ? this.state.profile.name : 'Nathan Antenor',
      ...activity
    };
    client.activities.unshift(newActivity);
    client.lastContactDate = new Date().toISOString().split('T')[0];

    this.addXP(15, 'Interação com cliente registrada');
    this.saveState();
    return newActivity;
  }


  // --- PARCELAMENTOS FINANCEIROS (V2) ---
  addTransactionWithInstallments(txData, installmentsCount = 1) {
    if (installmentsCount <= 1) {
      return this.addTransaction(txData);
    }

    const totalAmount = parseFloat(txData.amount) || 0;
    const installmentValue = Math.round((totalAmount / installmentsCount) * 100) / 100;
    const baseDate = new Date(txData.dueDate || txData.date || Date.now());
    const groupId = 'inst-' + Date.now();

    const createdList = [];
    for (let i = 1; i <= installmentsCount; i++) {
      const curDate = new Date(baseDate);
      curDate.setMonth(curDate.getMonth() + (i - 1));
      const curDateStr = curDate.toISOString().split('T')[0];

      const installmentTx = {
        ...txData,
        id: `tx-${Date.now()}-${i}`,
        title: `${txData.title} (${i}/${installmentsCount})`,
        amount: installmentValue,
        dueDate: curDateStr,
        date: i === 1 ? (txData.date || curDateStr) : curDateStr,
        status: i === 1 && txData.status === 'paid' ? 'paid' : 'pending',
        installmentGroup: groupId,
        installment: { current: i, total: installmentsCount }
      };

      this.state.transactions.unshift(installmentTx);
      createdList.push(installmentTx);
    }

    this.addXP(20, `Lançamento parcelado em ${installmentsCount}x gerado`);
    this.saveState();
    return createdList;
  }

  // --- MARCAR COMO PAGO (V2) ---
  markTransactionAsPaid(id) {
    const tx = this.state.transactions.find(t => t.id === id);
    if (!tx) return;

    tx.status = 'paid';
    tx.paidDate = new Date().toISOString().split('T')[0];

    // Atualiza receita do cliente
    if (tx.type === 'income' && tx.clientId) {
      const client = this.state.clients.find(c => c.id === tx.clientId);
      if (client) {
        client.totalGenerated = (client.totalGenerated || 0) + (tx.amount || 0);
        if (client.projectsCount > 0) {
          client.averageTicket = Math.round(client.totalGenerated / client.projectsCount);
        }
      }
    }

    // Atualiza metas relacionadas
    if (tx.type === 'income') {
      const relatedGoals = this.state.goals.filter(g =>
        g.scope === tx.scope && (g.linkedCategory === tx.category || !g.linkedCategory || g.category === 'Receita')
      );
      relatedGoals.forEach(g => {
        g.currentValue = (g.currentValue || 0) + (tx.amount || 0);
      });
    }

    this.addNotification({
      title: 'Pagamento Confirmado',
      message: `Recebimento de '${tx.title}' no valor de ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(tx.amount || 0)} foi baixado.`,
      type: 'success',
      link: 'finance'
    });

    this.addXP(30, 'Pagamento confirmado e baixado');
    this.saveState();
  }

  // --- CONFIGURAÇÃO DE WIDGETS DO DASHBOARD (V2) ---
  updateDashboardWidgets(widgets) {
    if (!this.state.profile) return;
    this.state.profile.dashboardWidgets = { ...this.state.profile.dashboardWidgets, ...widgets };
    this.saveState();
  }

  // --- INBOX & CAPTURA RÁPIDA (V2) ---
  addInboxItem(item) {
    if (!this.state.inbox) this.state.inbox = [];
    const newItem = {
      id: 'inb-' + Date.now(),
      text: '',
      category: 'ideia',
      status: 'pending',
      createdAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
      source: 'manual',
      suggestedType: 'task',
      ...item
    };
    this.state.inbox.unshift(newItem);
    this.addXP(5, 'Captura rápida registrada no Inbox');
    this.saveState();
    return newItem;
  }

  updateInboxItem(id, updates) {
    if (!this.state.inbox) this.state.inbox = [];
    const idx = this.state.inbox.findIndex(i => i.id === id);
    if (idx !== -1) {
      this.state.inbox[idx] = { ...this.state.inbox[idx], ...updates };
      this.saveState();
    }
  }

  deleteInboxItem(id) {
    if (!this.state.inbox) this.state.inbox = [];
    this.state.inbox = this.state.inbox.filter(i => i.id !== id);
    this.saveState();
  }

  convertInboxItem(id, targetType, details = {}) {
    if (!this.state.inbox) this.state.inbox = [];
    const item = this.state.inbox.find(i => i.id === id);
    if (!item) return null;

    let createdEntity = null;
    let label = '';

    if (targetType === 'task') {
      createdEntity = this.addTask({
        title: details.title || item.text,
        priority: details.priority || 'media',
        dueDate: details.dueDate || new Date().toISOString().split('T')[0],
        category: 'Trabalho'
      });
      label = 'Tarefa';
      this.addXP(20, 'Item de Inbox transformado em Tarefa');
    } else if (targetType === 'delivery') {
      createdEntity = this.addDelivery({
        title: details.title || item.text,
        clientId: details.clientId || (this.state.clients[0]?.id || ''),
        projectId: details.projectId || (this.state.projects[0]?.id || ''),
        priority: details.priority || 'media',
        dueDate: details.dueDate || new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
        description: `Originado do Inbox: ${item.text}`
      });
      label = 'Entrega';
      this.addXP(20, 'Item de Inbox transformado em Entrega');
    } else if (targetType === 'lead') {
      createdEntity = this.addLead({
        name: details.name || item.text.slice(0, 40),
        company: details.company || 'A definir',
        notes: `Originado do Inbox: ${item.text}`,
        stage: 'lead'
      });
      label = 'Lead Comercial';
      this.addXP(20, 'Item de Inbox transformado em Lead');
    } else if (targetType === 'project') {
      createdEntity = this.addProject({
        title: details.title || item.text,
        clientId: details.clientId || (this.state.clients[0]?.id || ''),
        stage: 'Briefing',
        description: `Originado do Inbox: ${item.text}`,
        deadline: details.dueDate || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]
      });
      label = 'Projeto';
      this.addXP(25, 'Item de Inbox transformado em Projeto');
    } else if (targetType === 'event') {
      createdEntity = this.addEvent({
        title: details.title || item.text,
        date: details.date || new Date().toISOString().split('T')[0],
        startTime: details.startTime || '10:00',
        endTime: details.endTime || '11:00',
        description: `Originado do Inbox: ${item.text}`
      });
      label = 'Evento na Agenda';
      this.addXP(15, 'Item de Inbox agendado');
    } else if (targetType === 'note') {
      createdEntity = this.addDocument({
        name: details.title || (item.text.length > 30 ? item.text.slice(0, 30) + '...' : item.text),
        category: 'Anotações',
        notes: item.text,
        format: 'txt'
      });
      label = 'Nota Documentada';
      this.addXP(10, 'Item de Inbox arquivado como Nota');
    }

    item.status = 'processed';
    item.processedAt = new Date().toISOString().replace('T', ' ').slice(0, 16);
    item.convertedTo = {
      type: targetType,
      label,
      entityId: createdEntity?.id
    };

    this.addNotification({
      title: 'Inbox Processado',
      message: `Item convertido em ${label} com sucesso!`,
      type: 'success',
      link: targetType === 'delivery' ? 'entregas' : (targetType === 'event' ? 'agenda' : targetType === 'task' ? 'routine' : targetType === 'lead' ? 'crm' : targetType === 'project' ? 'projects' : 'documents')
    });

    this.saveState();
    return { item, createdEntity };
  }

  searchAll(query) {
    if (!query || query.trim() === '') return {};
    const q = query.toLowerCase().trim();

    return {
      entregas: (this.state.deliveries || []).filter(d => (d.title && d.title.toLowerCase().includes(q)) || (d.clientName && d.clientName.toLowerCase().includes(q)) || (d.projectName && d.projectName.toLowerCase().includes(q)) || (d.tags && d.tags.some(t => t.toLowerCase().includes(q)))),
      clientes: this.state.clients.filter(c => (c.name && c.name.toLowerCase().includes(q)) || (c.company && c.company.toLowerCase().includes(q))),
      leads: this.state.leads.filter(l => (l.name && l.name.toLowerCase().includes(q)) || (l.company && l.company.toLowerCase().includes(q)) || (l.serviceOfInterest && l.serviceOfInterest.toLowerCase().includes(q))),
      projetos: this.state.projects.filter(p => (p.title && p.title.toLowerCase().includes(q)) || (p.clientName && p.clientName.toLowerCase().includes(q))),
      propostas: this.state.proposals.filter(p => (p.number && p.number.toLowerCase().includes(q)) || (p.clientName && p.clientName.toLowerCase().includes(q)) || (p.serviceName && p.serviceName.toLowerCase().includes(q))),
      servicos: this.state.services.filter(s => (s.name && s.name.toLowerCase().includes(q)) || (s.category && s.category.toLowerCase().includes(q))),
      documentos: this.state.documents.filter(d => (d.name && d.name.toLowerCase().includes(q)) || (d.category && d.category.toLowerCase().includes(q))),
      tarefas: this.state.tasks.filter(t => t.title && t.title.toLowerCase().includes(q)),
      eventos: this.state.events.filter(e => (e.title && e.title.toLowerCase().includes(q)) || (e.location && e.location.toLowerCase().includes(q))),
      financeiro: this.state.transactions.filter(t => (t.title && t.title.toLowerCase().includes(q)) || (t.category && t.category.toLowerCase().includes(q))),
      inbox: (this.state.inbox || []).filter(i => i.text && i.text.toLowerCase().includes(q))
    };
  }
}

export const store = new Store();
