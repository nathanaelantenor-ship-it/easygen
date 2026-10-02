# APP TESTE - Central Integrada de Gestão Inteligente

## Informações & Detalhes Completos do Sistema

Este diretório contém a aplicação web completa, responsiva e de alta fidelidade para gestão inteligente de profissionais autônomos, freelancers e pequenos negócios criativos.

---

### 📂 Estrutura de Arquivos no Desktop

```
C:\Users\Nathan\Desktop\App Easy Gen\
├── index.html                     # Shell principal da aplicação SPA
├── styles.css                     # Design System, variáveis CSS, temas claro e escuro
├── start.bat                      # Iniciar servidor local com 2 cliques
├── server.ps1                     # Servidor HTTP nativo em PowerShell (sem dependências)
├── README.md                      # Documentação rápida do repositório
├── DETALHES_DO_SISTEMA.md         # Este guia detalhado com todas as informações
└── src/
    ├── app.js                     # Roteador principal e gerenciador de eventos globais
    ├── state/
    │   ├── store.js               # Gerenciador de estado reativo e relacional (LocalStorage)
    │   └── initialData.js         # Dados de demonstração completos (leads, clientes, etc.)
    ├── components/
    │   ├── Navbar.js              # Barra superior (busca, ações rápidas, notificações, tema)
    │   ├── Sidebar.js             # Menu lateral desktop com 13 módulos
    │   ├── MobileNav.js           # Barra inferior (bottom navigation) e gaveta mobile
    │   ├── QuickActionsModal.js   # Modal de ações rápidas para criação imediata
    │   ├── GlobalSearchModal.js   # Busca global com atalho Ctrl + K
    │   ├── NotificationsDrawer.js # Central lateral de notificações e pendências
    │   ├── Modal.js               # Sistema de modais e drawers acessíveis
    │   └── Toast.js               # Notificações visuais flutuantes
    ├── views/
    │   ├── DashboardView.js       # Visão geral, KPIs e gráficos analíticos
    │   ├── CRMView.js             # Kanban arrastável e Tabela de leads com conversão
    │   ├── ClientsView.js         # Inteligência 360°, LTV e alertas de relacionamento
    │   ├── DocumentsView.js       # Central de documentos com pastas por categoria
    │   ├── ServicesView.js        # Catálogo de serviços com geração de propostas
    │   ├── ProposalsView.js       # Ciclo de propostas comerciais e exportação PDF
    │   ├── ProjectsView.js        # Gestão de projetos por estágios e checklist de tarefas
    │   ├── FinanceView.js         # Controle financeiro Empresa (PJ) vs Pessoal (PF)
    │   ├── AgendaView.js          # Calendário mensal e preparação Google Calendar
    │   ├── RoutineView.js         # Tarefas prioritárias e hábitos com streaks (🔥)
    │   ├── GoalsView.js           # Metas com progresso automático via lançamentos
    │   ├── ReportsView.js         # 8 relatórios analíticos com exportação
    │   └── SettingsView.js        # Configurações, perfil e reset de dados
    └── utils/
        ├── exportUtils.js         # Utilitários de exportação (CSV, Excel, PDF)
        └── formatters.js          # Formatação monetária (BRL), datas e badges
```

---

### 🎨 Identidade Visual & Design System

- **Tema Claro**:
  - Fundo: Off-white (`#F8F9FA`)
  - Cor de destaque: Azul vibrante (`#0000FF`)
  - Superfícies / Cards: Branco puro (`#FFFFFF`)
  - Textos principais: Preto a ~80% de intensidade (`rgba(0, 0, 0, 0.82)`)
  - Textos secundários: Variações de cinza neutro
- **Tema Escuro**:
  - Fundo: Preto a ~80% de intensidade (`#18181B`)
  - Superfícies / Cards: `#242427`
  - Destaques: Azul vibrante (`#0000FF`)
  - Textos: Branco (`#F4F4F5`)
- **Estética**: Minimalista, limpa, espaçamento generoso, cantos sutilmente arredondados, sem gradientes pesados ou sombras excessivas.

---

### 🔄 Arquitetura Relacional & Conexões Automáticas

1. **Lead ➔ Cliente**: Ao converter um lead no CRM, ele é promovido para aprovado e seus dados geram instantaneamente um novo Cliente na carteira com histórico preservado.
2. **Proposta ➔ Projeto**: Propostas aprovadas geram automaticamente um novo projeto com o checklist de entregáveis pré-configurado.
3. **Financeiro ➔ Metas & Clientes**:
   - Lançamentos de receita vinculados a um cliente atualizam o LTV e ticket médio do cliente em tempo real.
   - Toda receita adicionada incrementa automaticamente o progresso percentual e financeiro de metas associadas.
4. **Documentos ➔ Central Unificada**: Arquivos anexados a clientes ou projetos aparecem automaticamente organizados na Central de Documentos.

---

### ⚡ Atalhos & Recursos Rápidos

- **Ctrl + K** (ou botão de lupa): Abre a Busca Global agrupada por Clientes, Leads, Projetos, Propostas, Serviços, Documentos e Lançamentos.
- **Botão + Ação Rápida** (ou botão flutuante FAB no mobile): Menu rápido para criar qualquer uma das 10 entidades do sistema em 1 clique.
- **Alternar Tema**: Botão de sol/lua na barra superior ou na lateral inferior.
- **Exportação Multiformato**: Exportação direta em PDF, Excel (XLSX) e CSV em todos os módulos principais.

---

### 💻 Como Executar

1. **Servidor Local Instantâneo**:
   - Dê um duplo clique no arquivo `start.bat`.
   - O servidor local iniciará e abrirá o navegador em `http://localhost:3000`.

2. **Abertura Direta**:
   - Dê dois cliques no arquivo `index.html` em qualquer navegador (Google Chrome, Microsoft Edge, Firefox, Safari).

---

### 🌐 Repositório GitHub Conectado

- **URL**: `https://github.com/nathanaelantenor-ship-it/easygen.git`
- **Branch**: `main`
