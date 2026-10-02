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
        const parsed = JSON.parse(stored);
        if (!parsed.deliveries) parsed.deliveries = JSON.parse(JSON.stringify(initialData.deliveries || []));
        if (!parsed.deliveryColumns) parsed.deliveryColumns = JSON.parse(JSON.stringify(initialData.deliveryColumns || []));
        if (!parsed.deliveryTags) parsed.deliveryTags = JSON.parse(JSON.stringify(initialData.deliveryTags || []));
        return parsed;
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
      notifications: [],
      deliveries: [],
      deliveryColumns: [...(initialData.deliveryColumns || [])],
      deliveryTags: [...(initialData.deliveryTags || [])]
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
      id: 'f-' + Date.now(),
      name: file.name,
      size: file.size || '1.5 MB',
      type: file.type || 'arquivo',
      date: new Date().toISOString().split('T')[0],
      uploader: this.state.profile.name,
      url: file.url || '#'
    };
    delivery.files.push(newFile);

    // Conexão automática com a Central de Documentos
    this.addDocument({
      name: newFile.name,
      category: 'Arquivos finais',
      format: newFile.type,
      size: newFile.size,
      clientId: delivery.clientId || null,
      clientName: delivery.clientName || null,
      projectId: delivery.projectId || null,
      projectName: delivery.projectName || null
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
      },
      deliveries: this.getDeliveryMetrics()
    };
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
      financeiro: this.state.transactions.filter(t => (t.title && t.title.toLowerCase().includes(q)) || (t.category && t.category.toLowerCase().includes(q)))
    };
  }
}

export const store = new Store();
