# APP TESTE - Central Integrada de Gestão Inteligente

## Informações & Detalhes Completos do Sistema

Este diretório contém a aplicação web completa, responsiva e de alta fidelidade para gestão inteligente de profissionais autônomos, freelancers e pequenos negócios criativos (design, branding, audiovisual, social media, marketing e desenvolvimento).

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
    │   └── initialData.js         # Dados de demonstração completos (leads, clientes, entregas, etc.)
    ├── components/
    │   ├── Navbar.js              # Barra superior (busca, ações rápidas, notificações, tema)
    │   ├── Sidebar.js             # Menu lateral desktop com 14 módulos (incluindo Entregas)
    │   ├── MobileNav.js           # Barra inferior (bottom navigation) e gaveta mobile
    │   ├── QuickActionsModal.js   # Modal de ações rápidas para criação imediata
    │   ├── GlobalSearchModal.js   # Busca global com atalho Ctrl + K
    │   ├── NotificationsDrawer.js # Central lateral de notificações e pendências
    │   ├── Modal.js               # Sistema de modais e drawers acessíveis
    │   └── Toast.js               # Notificações visuais flutuantes
    ├── views/
    │   ├── DashboardView.js       # Visão geral, KPIs, gráficos analíticos e próximas entregas
    │   ├── DeliveriesView.js      # Módulo Entregas: Kanban Trello-like e Lista com Drag & Drop
    │   ├── CRMView.js             # Kanban arrastável e Tabela de leads com conversão
    │   ├── ClientsView.js         # Inteligência 360°, LTV, aba Entregas e alertas de relacionamento
    │   ├── DocumentsView.js       # Central de documentos com pastas por categoria
    │   ├── ServicesView.js        # Catálogo de serviços com geração de propostas
    │   ├── ProposalsView.js       # Ciclo de propostas comerciais e exportação PDF
    │   ├── ProjectsView.js        # Gestão de projetos por estágios, cronogramas e entregas vinculadas
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
  - Superfícies / Cards: `#242427` / `#1f1f23`
  - Destaques: Azul vibrante (`#0000FF`)
  - Textos: Branco (`#F4F4F5`)
- **Estética**: Minimalista, limpa, espaçamento generoso, cantos sutilmente arredondados, sem gradientes pesados ou sombras excessivas.

---

### 🚀 Novo Módulo: Entregas & Operações (Kanban Trello-like)

O módulo **Entregas** funciona como a central operacional visual para organizar demandas, entregáveis e fluxos de produção criativa:
- **Visualização Dupla**: Alternância com 1 clique entre **Kanban** e **Lista**.
- **Kanban Interativo com Drag & Drop**:
  - Colunas padrão: *Backlog*, *Em andamento*, *Em revisão*, *Aprovado*, *Entregue*, *Pausado*.
  - Possibilidade de criar novas colunas personalizadas, renomear ou remover colunas existentes.
  - Arraste fluido de cards entre colunas com atualização imediata do status.
- **Cards Ricos de Alta Fidelidade**:
  - Imagem de capa customizável.
  - Tag de prioridade (*Baixa*, *Média*, *Alta*, *Urgente*).
  - Etiquetas (Tags) coloridas customizáveis (ex: Design, Social Media, Vídeo, UI/UX, Copywriting, Urgente).
  - Indicador de cliente e projeto vinculado.
  - Checklist interativo com barra de progresso percentual dinâmica.
  - Contadores de anexos e comentários.
  - Alerta de prazo (destaque para atrasados e vencendo hoje).
  - Avatar do responsável.
  - Menu de ações rápidas no card (abrir detalhes, duplicar, excluir).
- **Modal de Detalhes Completo**:
  - Edição direta de título, descrição, prioridade, responsável e prazo.
  - Checklist operacional com checkbox instantâneo, adição e remoção de tarefas.
  - Gestão de anexos com opção de sincronizar automaticamente na **Central de Documentos**.
  - Linha do tempo de comentários com autor e data.
  - Histórico de auditoria com rastreamento cronológico de todas as alterações.
  - Botão de duplicar e excluir entrega.
- **Gerenciador de Tags**:
  - Criação de novas tags com nome e seletor de cor HEX.

---

### 🔄 Arquitetura Relacional & Conexões Automáticas

1. **Entregas ➔ Projetos**:
   - Mover uma entrega para a coluna **Entregue** calcula automaticamente a porcentagem de conclusão do projeto vinculado (ex: 6 de 10 entregas concluídas = 60%).
   - A modal de detalhes de qualquer Projeto exibe a seção **"Entregas do Projeto"** com barra de progresso em tempo real e listagem das demandas.
2. **Entregas ➔ Clientes**:
   - Cada Cliente possui no seu perfil 360° a aba **"Entregas"**, exibindo todas as demandas associadas àquele cliente com status e prioridade.
3. **Entregas ➔ Central de Documentos**:
   - Ao anexar arquivos a uma entrega com a opção ativada, o arquivo é imediatamente espelhado na Central de Documentos na categoria correspondente.
4. **Entregas ➔ Dashboard**:
   - O Dashboard exibe o card KPI da Central de Entregas e o widget **"Próximas Entregas"** em tempo real.
5. **Lead ➔ Cliente**: Ao converter um lead no CRM, seus dados geram instantaneamente um novo Cliente na carteira com histórico preservado.
6. **Proposta ➔ Projeto**: Propostas aprovadas geram automaticamente um novo projeto com o checklist pré-configurado.
7. **Financeiro ➔ Metas & Clientes**:
   - Lançamentos de receita vinculados a um cliente atualizam o LTV e ticket médio do cliente em tempo real.
   - Toda receita adicionada incrementa automaticamente o progresso percentual e financeiro de metas associadas.

---

### ⚡ Atalhos & Recursos Rápidos

- **Ctrl + K** (ou botão de lupa): Busca Global abrangendo Clientes, Leads, Projetos, Propostas, Entregas, Serviços, Documentos e Lançamentos.
- **Botão + Ação Rápida** (ou botão flutuante FAB no mobile): Menu rápido com opção direta para criar **Nova Entrega**, Novo Lead, Projeto, etc.
- **Alternar Tema**: Botão de alternância claro/escuro na barra superior e lateral.
- **Exportação Multiformato**: Exportação direta em PDF, Excel (XLSX) e CSV nos módulos principais.

---

### 💻 Como Executar

1. **Servidor Local Instantâneo**:
   - Dê um duplo clique no arquivo `start.bat`.
   - O servidor local nativo PowerShell iniciará e abrirá o navegador em `http://localhost:3000`.

2. **Abertura Direta**:
   - Dê dois cliques no arquivo `index.html` em qualquer navegador moderno.

---

### 🚀 Publicação na Vercel (Produção Instantânea)

O projeto está 100% preparado para ser publicado na **Vercel** através da integração nativa com o GitHub:
1. No painel da Vercel ([vercel.com](https://vercel.com)), clique em **"Add New..."** e selecione **"Project"**.
2. Conecte sua conta do GitHub e importe o repositório `nathanaelantenor-ship-it/easygen`.
3. Nas configurações:
   - **Framework Preset**: `Other` (HTML/JS estático).
   - **Root Directory**: `./`.
   - **Build Command**: Em branco.
   - **Output Directory**: Em branco.
4. Clique em **"Deploy"**.
O site será publicado com SSL gratuito, CDN global ultra-rápido e suporte completo a SPA via `vercel.json`.

---

### 🔒 Dados & Armazenamento

Todos os dados são persistidos no navegador via `LocalStorage`. É possível reiniciar a base demonstrativa completa ou exportar dados a qualquer momento pelo módulo de **Configurações**.
