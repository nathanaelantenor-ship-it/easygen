# easygen

## APP TESTE - Central Integrada de Gestão Inteligente

Aplicativo web responsivo de gestão empresarial e pessoal de alta fidelidade desenvolvido especialmente para profissionais autônomos, freelancers e pequenos negócios de serviços criativos (Design, Branding, Marketing, Audiovisual, Social Media, Desenvolvimento de Software e Consultoria).

---

### 🌟 Principais Características
- **Arquitetura Relacional Integrada**: Todos os 14 módulos são interconectados em tempo real sem silos de dados.
- **Módulo Entregas & Operações (Kanban estilo Trello)**: Central operacional com visualização Kanban e Lista, Drag & Drop nativo, checklists dinâmicos, comentários, arquivos e histórico.
- **Automação de Progresso de Projetos**: Concluir entregas atualiza a porcentagem de progresso do projeto correspondente automaticamente.
- **Inteligência 360° de Clientes**: Cada cliente possui aba exclusiva de Entregas, Projetos, Propostas, Histórico Financeiro e Documentos.
- **Design System Minimalista & Sofisticado**: Off-white (`#F8F9FA`), preto 80% (`rgba(0,0,0,0.82)`), cor de destaque azul elétrico (`#0000FF`), e modo escuro impecável (`#18181B`).
- **Responsividade Real**: Desktop com Sidebar e Mobile com Bottom Navigation e gaveta completa.
- **Roteamento por URL Hash**: Suporte a links diretos (`/#entregas`, `/#crm`, `/#dashboard`) e histórico de navegação (Voltar/Avançar).
- **14 Módulos Completos**: Dashboard, Entregas, CRM, Clientes, Central de Documentos, Serviços, Propostas, Projetos, Financeiro, Agenda, Rotina, Metas, Relatórios e Configurações.
- **Exportações Reais**: CSV, Excel (XLSX) e PDF.
- **Persistência Reativa**: LocalStorage com sincronização automática entre todas as entidades.

---

### 🚀 Como Publicar na Vercel

O projeto já está 100% configurado para a **Vercel** com o arquivo `vercel.json` e `package.json` na raiz:

1. Acesse [vercel.com](https://vercel.com) e faça login com sua conta do GitHub.
2. Clique no botão **"Add New..."** ➔ **"Project"**.
3. Importe o repositório: `nathanaelantenor-ship-it/easygen`.
4. Nas configurações do projeto:
   - **Framework Preset**: Deixe como `Other` (Static HTML/JS).
   - **Root Directory**: `./` (padrão).
   - **Build Command**: Não precisa preencher (em branco).
   - **Output Directory**: Não precisa preencher (em branco).
5. Clique em **"Deploy"**.
6. Em menos de 30 segundos, o app estará no ar com link público HTTPS e certificado SSL gratuito!

---

### 💻 Como Rodar Localmente

1. **Via `start.bat` (Servidor Local Nativo)**:
   - Dê um duplo clique no arquivo `start.bat`.
   - O servidor iniciará automaticamente em `http://localhost:3000`.

2. **Via Navegador**:
   - Abra diretamente o arquivo `index.html` em qualquer navegador (Chrome, Edge, Firefox, Safari).

---

### 🔗 Links Diretos de Navegação
Quando publicado na Vercel (ou em localhost), é possível acessar qualquer módulo diretamente pela URL:
- Dashboard: `/#dashboard`
- Entregas (Kanban): `/#entregas`
- CRM & Funil: `/#crm`
- Clientes: `/#clients`
- Projetos: `/#projects`
- Financeiro: `/#finance`
- Propostas: `/#proposals`
- Serviços: `/#services`
- Documentos: `/#documents`
- Agenda: `/#agenda`
- Rotina & Hábitos: `/#routine`
- Metas: `/#goals`
- Relatórios: `/#reports`
- Configurações: `/#settings`
