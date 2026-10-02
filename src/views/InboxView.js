import { store } from '../state/store.js';
import { modal } from '../components/Modal.js';

export function renderInboxView() {
  const container = document.createElement('div');
  container.className = 'p-6 max-w-6xl mx-auto space-y-6';

  let currentTab = 'pending'; // 'pending' | 'processed' | 'all'
  let currentCategory = 'all'; // 'all' | 'ideia' | 'pedido' | 'insight' | 'link' | 'nota'
  let searchQuery = '';

  const categoryMeta = {
    ideia: { label: 'Ideia', icon: '💡', color: 'bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300 border-purple-200 dark:border-purple-800' },
    pedido: { label: 'Pedido de Cliente', icon: '📩', color: 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border-blue-200 dark:border-blue-800' },
    insight: { label: 'Insight', icon: '⚡', color: 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border-amber-200 dark:border-amber-800' },
    link: { label: 'Link & Referência', icon: '🔗', color: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800' },
    nota: { label: 'Nota Rápida', icon: '📝', color: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700' }
  };

  function render() {
    const state = store.getState();
    const inboxItems = state.inbox || [];

    const pendingCount = inboxItems.filter(i => i.status === 'pending').length;
    const processedCount = inboxItems.filter(i => i.status === 'processed').length;

    // Filter items
    const filteredItems = inboxItems.filter(item => {
      if (currentTab === 'pending' && item.status !== 'pending') return false;
      if (currentTab === 'processed' && item.status !== 'processed') return false;
      if (currentCategory !== 'all' && (item.category || 'ideia') !== currentCategory) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        if (!item.text.toLowerCase().includes(q)) return false;
      }
      return true;
    });

    container.innerHTML = `
      <!-- Cabeçalho -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div class="flex items-center gap-3">
            <h1 class="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">Inbox & Captura Rápida</h1>
            <span class="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
              ${pendingCount} pendente${pendingCount === 1 ? '' : 's'}
            </span>
          </div>
          <p class="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Descarregue pensamentos, pedidos soltos de WhatsApp e referências. Transforme qualquer item em ação com 1 clique (+5 XP por captura).
          </p>
        </div>

        <div class="flex items-center gap-2">
          <div class="text-right hidden sm:block">
            <span class="text-xs font-medium text-zinc-500 dark:text-zinc-400">Total capturado</span>
            <div class="text-sm font-bold text-zinc-800 dark:text-zinc-200">${inboxItems.length} registros</div>
          </div>
        </div>
      </div>

      <!-- Caixa de Captura Rápida Instantânea -->
      <div class="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 shadow-sm p-4 sm:p-5 space-y-4">
        <div class="flex items-center justify-between text-xs font-semibold text-zinc-700 dark:text-zinc-300">
          <span class="flex items-center gap-2">
            <svg class="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
            Captura Imediata
          </span>
          <span class="text-[11px] text-zinc-400 font-normal">Pressione <kbd class="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 border text-zinc-600 dark:text-zinc-300 font-mono text-[10px]">Enter</kbd> para salvar</span>
        </div>

        <div class="space-y-3">
          <textarea 
            id="inbox-input" 
            rows="2" 
            placeholder="O que está na sua cabeça? Ex: Ligar para Camila sobre briefing da Pulse, Criar template Figma para Reels..."
            class="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-zinc-100 placeholder-zinc-400 resize-none transition-all"
          ></textarea>

          <div class="flex flex-wrap items-center justify-between gap-3 pt-1">
            <div class="flex items-center gap-1.5 overflow-x-auto pb-1" id="category-selector">
              <span class="text-[11px] font-medium text-zinc-400 mr-1">Tipo:</span>
              <button type="button" data-cat="ideia" class="cat-pill active px-2.5 py-1 rounded-lg text-xs font-medium border border-blue-600 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 transition-colors">
                💡 Ideia
              </button>
              <button type="button" data-cat="pedido" class="cat-pill px-2.5 py-1 rounded-lg text-xs font-medium border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300 transition-colors">
                📩 Pedido
              </button>
              <button type="button" data-cat="insight" class="cat-pill px-2.5 py-1 rounded-lg text-xs font-medium border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300 transition-colors">
                ⚡ Insight
              </button>
              <button type="button" data-cat="link" class="cat-pill px-2.5 py-1 rounded-lg text-xs font-medium border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300 transition-colors">
                🔗 Link
              </button>
              <button type="button" data-cat="nota" class="cat-pill px-2.5 py-1 rounded-lg text-xs font-medium border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300 transition-colors">
                📝 Nota
              </button>
            </div>

            <button 
              id="btn-quick-capture" 
              class="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-semibold shadow-sm transition-all flex items-center gap-2 shrink-0 ml-auto"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
              Capturar (+5 XP)
            </button>
          </div>
        </div>
      </div>

      <!-- Filtros e Busca -->
      <div class="flex flex-col sm:flex-row items-center justify-between gap-3">
        <!-- Status Tabs -->
        <div class="flex items-center gap-1 p-1 bg-zinc-100 dark:bg-zinc-800/80 rounded-xl w-full sm:w-auto">
          <button 
            data-tab="pending" 
            class="flex-1 sm:flex-initial px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${currentTab === 'pending' ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-xs font-bold' : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'}"
          >
            Pendentes (${pendingCount})
          </button>
          <button 
            data-tab="processed" 
            class="flex-1 sm:flex-initial px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${currentTab === 'processed' ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-xs font-bold' : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'}"
          >
            Processados (${processedCount})
          </button>
          <button 
            data-tab="all" 
            class="flex-1 sm:flex-initial px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${currentTab === 'all' ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-xs font-bold' : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'}"
          >
            Todos (${inboxItems.length})
          </button>
        </div>

        <!-- Busca -->
        <div class="relative w-full sm:w-64">
          <input 
            type="text" 
            id="inbox-search" 
            value="${searchQuery}" 
            placeholder="Buscar no inbox..." 
            class="w-full pl-8 pr-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <svg class="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
        </div>
      </div>

      <!-- Lista de Itens do Inbox -->
      ${filteredItems.length === 0 ? `
        <div class="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 p-12 text-center space-y-3">
          <div class="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400 mx-auto text-xl">
            📥
          </div>
          <h3 class="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
            ${currentTab === 'pending' ? 'Inbox zerado! Nada pendente por aqui.' : 'Nenhum registro encontrado.'}
          </h3>
          <p class="text-xs text-zinc-400 max-w-sm mx-auto">
            ${currentTab === 'pending' ? 'Excelente trabalho mantendo suas ideias e demandas processadas. Use a caixa acima para capturar novas ideias.' : 'Tente ajustar os filtros ou pesquisar com outro termo.'}
          </p>
        </div>
      ` : `
        <div class="grid grid-cols-1 gap-3">
          ${filteredItems.map(item => {
            const cat = categoryMeta[item.category || 'ideia'] || categoryMeta.ideia;
            const isProcessed = item.status === 'processed';

            return `
              <div class="group bg-white dark:bg-zinc-900 rounded-2xl border ${isProcessed ? 'border-zinc-200/50 dark:border-zinc-800/60 opacity-75' : 'border-zinc-200/90 dark:border-zinc-800 hover:border-blue-400 dark:hover:border-blue-600'} p-4 shadow-2xs transition-all space-y-3">
                <div class="flex items-start justify-between gap-3">
                  <div class="flex items-center gap-2">
                    <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-semibold border ${cat.color}">
                      <span>${cat.icon}</span>
                      <span>${cat.label}</span>
                    </span>
                    <span class="text-[11px] text-zinc-400 font-mono">${item.createdAt || ''}</span>
                    ${isProcessed ? `
                      <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
                        ${item.convertedTo?.label ? `Convertido em ${item.convertedTo.label}` : 'Processado'}
                      </span>
                    ` : ''}
                  </div>

                  <div class="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                    ${!isProcessed ? `
                      <button 
                        data-action="convert" 
                        data-id="${item.id}" 
                        class="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-600 hover:text-white text-blue-600 dark:text-blue-300 text-xs font-semibold border border-blue-200 dark:border-blue-800 transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"/></svg>
                        Converter
                      </button>
                      <button 
                        data-action="complete" 
                        data-id="${item.id}" 
                        title="Marcar como processado"
                        class="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-emerald-600 transition-colors cursor-pointer"
                      >
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
                      </button>
                    ` : `
                      <button 
                        data-action="reopen" 
                        data-id="${item.id}" 
                        title="Reabrir item"
                        class="text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 px-2 py-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                      >
                        Reabrir
                      </button>
                    `}
                    <button 
                      data-action="delete" 
                      data-id="${item.id}" 
                      title="Excluir"
                      class="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 text-zinc-400 hover:text-red-600 transition-colors cursor-pointer"
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                    </button>
                  </div>
                </div>

                <div class="text-sm text-zinc-800 dark:text-zinc-200 font-normal leading-relaxed whitespace-pre-wrap">
                  ${item.text}
                </div>
              </div>
            `;
          }).join('')}
        </div>
      `}
    `;

    attachEvents();
  }

  function attachEvents() {
    let selectedCat = 'ideia';

    const catButtons = container.querySelectorAll('.cat-pill');
    catButtons.forEach(btn => {
      btn.onclick = () => {
        catButtons.forEach(b => {
          b.className = 'cat-pill px-2.5 py-1 rounded-lg text-xs font-medium border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300 transition-colors';
        });
        btn.className = 'cat-pill active px-2.5 py-1 rounded-lg text-xs font-medium border border-blue-600 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 transition-colors';
        selectedCat = btn.getAttribute('data-cat');
      };
    });

    const captureBtn = container.querySelector('#btn-quick-capture');
    const inputArea = container.querySelector('#inbox-input');

    const handleCapture = () => {
      const text = inputArea.value.trim();
      if (!text) return;
      store.addInboxItem({
        text,
        category: selectedCat
      });
      inputArea.value = '';
      render();
    };

    if (captureBtn && inputArea) {
      captureBtn.onclick = handleCapture;
      inputArea.onkeydown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          handleCapture();
        }
      };
    }

    container.querySelectorAll('button[data-tab]').forEach(btn => {
      btn.onclick = () => {
        currentTab = btn.getAttribute('data-tab');
        render();
      };
    });

    const searchInput = container.querySelector('#inbox-search');
    if (searchInput) {
      searchInput.oninput = (e) => {
        searchQuery = e.target.value;
        render();
        const reInput = container.querySelector('#inbox-search');
        if (reInput) {
          reInput.focus();
          reInput.setSelectionRange(reInput.value.length, reInput.value.length);
        }
      };
    }

    container.querySelectorAll('button[data-action]').forEach(btn => {
      const action = btn.getAttribute('data-action');
      const id = btn.getAttribute('data-id');

      if (action === 'delete') {
        btn.onclick = () => {
          if (confirm('Deseja excluir este item do Inbox?')) {
            store.deleteInboxItem(id);
            render();
          }
        };
      } else if (action === 'complete') {
        btn.onclick = () => {
          store.updateInboxItem(id, { status: 'processed', processedAt: new Date().toISOString() });
          store.addXP(10, 'Item de Inbox marcado como concluído');
          render();
        };
      } else if (action === 'reopen') {
        btn.onclick = () => {
          store.updateInboxItem(id, { status: 'pending', convertedTo: null });
          render();
        };
      } else if (action === 'convert') {
        btn.onclick = () => {
          openConvertModal(id);
        };
      }
    });
  }

  function openConvertModal(inboxId) {
    const item = (store.getState().inbox || []).find(i => i.id === inboxId);
    if (!item) return;

    const state = store.getState();
    const clients = state.clients || [];
    const projects = state.projects || [];

    const content = `
      <div class="space-y-4">
        <div class="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-700 dark:text-zinc-300">
          <span class="font-semibold block text-zinc-900 dark:text-zinc-100 mb-1">Conteúdo capturado:</span>
          "${item.text}"
        </div>

        <p class="text-xs text-zinc-500 font-medium">Escolha para onde deseja transformar este item:</p>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <!-- Tarefa -->
          <button data-type="task" class="target-btn text-left p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-950/30 transition-all flex items-start gap-3 group cursor-pointer">
            <span class="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-600 flex items-center justify-center font-bold text-sm shrink-0">📋</span>
            <div>
              <div class="text-xs font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-blue-600">Tarefa Operacional</div>
              <div class="text-[11px] text-zinc-500">Adiciona à Rotina diária de afazeres (+20 XP)</div>
            </div>
          </button>

          <!-- Entrega -->
          <button data-type="delivery" class="target-btn text-left p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-950/30 transition-all flex items-start gap-3 group cursor-pointer">
            <span class="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center font-bold text-sm shrink-0">🚀</span>
            <div>
              <div class="text-xs font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-emerald-600">Entrega (Kanban)</div>
              <div class="text-[11px] text-zinc-500">Cria entregável no fluxo de produção (+20 XP)</div>
            </div>
          </button>

          <!-- Lead CRM -->
          <button data-type="lead" class="target-btn text-left p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-950/30 transition-all flex items-start gap-3 group cursor-pointer">
            <span class="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-950 text-purple-600 flex items-center justify-center font-bold text-sm shrink-0">🎯</span>
            <div>
              <div class="text-xs font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-purple-600">Lead Comercial</div>
              <div class="text-[11px] text-zinc-500">Cadastra novo contato no funil CRM (+20 XP)</div>
            </div>
          </button>

          <!-- Projeto -->
          <button data-type="project" class="target-btn text-left p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-950/30 transition-all flex items-start gap-3 group cursor-pointer">
            <span class="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-950 text-indigo-600 flex items-center justify-center font-bold text-sm shrink-0">📁</span>
            <div>
              <div class="text-xs font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-indigo-600">Novo Projeto</div>
              <div class="text-[11px] text-zinc-500">Inicia um projeto de produção (+25 XP)</div>
            </div>
          </button>

          <!-- Evento na Agenda -->
          <button data-type="event" class="target-btn text-left p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-950/30 transition-all flex items-start gap-3 group cursor-pointer">
            <span class="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-950 text-amber-600 flex items-center justify-center font-bold text-sm shrink-0">📅</span>
            <div>
              <div class="text-xs font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-amber-600">Evento na Agenda</div>
              <div class="text-[11px] text-zinc-500">Agenda reunião ou compromisso (+15 XP)</div>
            </div>
          </button>

          <!-- Nota Documentada -->
          <button data-type="note" class="target-btn text-left p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-950/30 transition-all flex items-start gap-3 group cursor-pointer">
            <span class="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-600 flex items-center justify-center font-bold text-sm shrink-0">📄</span>
            <div>
              <div class="text-xs font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-zinc-900">Nota / Documento</div>
              <div class="text-[11px] text-zinc-500">Salva na Central de Documentos (+10 XP)</div>
            </div>
          </button>
        </div>

        <div id="conversion-options-form" class="mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-800 hidden space-y-3">
          <div class="text-xs font-semibold text-zinc-800 dark:text-zinc-200" id="options-title">Ajustes rápidos:</div>
          <div id="options-fields" class="space-y-2.5"></div>
          <div class="flex justify-end gap-2 pt-2">
            <button id="btn-cancel-convert" class="px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-xs font-medium text-zinc-600 dark:text-zinc-400 cursor-pointer">Voltar</button>
            <button id="btn-confirm-convert" class="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs cursor-pointer">Confirmar Conversão</button>
          </div>
        </div>
      </div>
    `;

    const convModal = modal.open({
      title: 'Converter Item do Inbox',
      content
    });

    let selectedType = null;
    const formBox = convModal.panel.querySelector('#conversion-options-form');
    const fieldsBox = convModal.panel.querySelector('#options-fields');
    const optionsTitle = convModal.panel.querySelector('#options-title');

    convModal.panel.querySelectorAll('.target-btn').forEach(btn => {
      btn.onclick = () => {
        selectedType = btn.getAttribute('data-type');
        setupConversionFields(selectedType);
      };
    });

    function setupConversionFields(type) {
      formBox.classList.remove('hidden');

      if (type === 'delivery') {
        optionsTitle.textContent = 'Configurar Entrega:';
        fieldsBox.innerHTML = `
          <div>
            <label class="text-[11px] font-medium text-zinc-500">Título</label>
            <input type="text" id="conv-title" value="${item.text.replace(/"/g, '&quot;')}" class="w-full text-xs px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-100" />
          </div>
          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="text-[11px] font-medium text-zinc-500">Cliente</label>
              <select id="conv-client" class="w-full text-xs px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-100">
                ${clients.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
              </select>
            </div>
            <div>
              <label class="text-[11px] font-medium text-zinc-500">Projeto</label>
              <select id="conv-project" class="w-full text-xs px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-100">
                ${projects.map(p => `<option value="${p.id}">${p.title}</option>`).join('')}
              </select>
            </div>
          </div>
        `;
      } else if (type === 'lead') {
        optionsTitle.textContent = 'Configurar Lead:';
        fieldsBox.innerHTML = `
          <div>
            <label class="text-[11px] font-medium text-zinc-500">Nome do Contato</label>
            <input type="text" id="conv-title" value="${item.text.slice(0, 30).replace(/"/g, '&quot;')}" class="w-full text-xs px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-100" />
          </div>
          <div>
            <label class="text-[11px] font-medium text-zinc-500">Empresa / Negócio</label>
            <input type="text" id="conv-company" placeholder="Ex: Studio Beta" class="w-full text-xs px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-100" />
          </div>
        `;
      } else if (type === 'project') {
        optionsTitle.textContent = 'Configurar Projeto:';
        fieldsBox.innerHTML = `
          <div>
            <label class="text-[11px] font-medium text-zinc-500">Nome do Projeto</label>
            <input type="text" id="conv-title" value="${item.text.replace(/"/g, '&quot;')}" class="w-full text-xs px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-100" />
          </div>
          <div>
            <label class="text-[11px] font-medium text-zinc-500">Cliente</label>
            <select id="conv-client" class="w-full text-xs px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-100">
              ${clients.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
            </select>
          </div>
        `;
      } else if (type === 'event') {
        optionsTitle.textContent = 'Configurar Evento na Agenda:';
        fieldsBox.innerHTML = `
          <div>
            <label class="text-[11px] font-medium text-zinc-500">Título da Reunião / Compromisso</label>
            <input type="text" id="conv-title" value="${item.text.replace(/"/g, '&quot;')}" class="w-full text-xs px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-100" />
          </div>
          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="text-[11px] font-medium text-zinc-500">Data</label>
              <input type="date" id="conv-date" value="${new Date().toISOString().split('T')[0]}" class="w-full text-xs px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-100" />
            </div>
            <div>
              <label class="text-[11px] font-medium text-zinc-500">Horário</label>
              <input type="time" id="conv-time" value="14:00" class="w-full text-xs px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-100" />
            </div>
          </div>
        `;
      } else {
        optionsTitle.textContent = type === 'task' ? 'Configurar Tarefa:' : 'Configurar Nota:';
        fieldsBox.innerHTML = `
          <div>
            <label class="text-[11px] font-medium text-zinc-500">Título</label>
            <input type="text" id="conv-title" value="${item.text.replace(/"/g, '&quot;')}" class="w-full text-xs px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-100" />
          </div>
        `;
      }
    }

    const cancelBtn = convModal.panel.querySelector('#btn-cancel-convert');
    if (cancelBtn) {
      cancelBtn.onclick = () => {
        formBox.classList.add('hidden');
      };
    }

    const confirmBtn = convModal.panel.querySelector('#btn-confirm-convert');
    if (confirmBtn) {
      confirmBtn.onclick = () => {
        if (!selectedType) return;
        const title = convModal.panel.querySelector('#conv-title')?.value || item.text;
        const clientId = convModal.panel.querySelector('#conv-client')?.value;
        const projectId = convModal.panel.querySelector('#conv-project')?.value;
        const company = convModal.panel.querySelector('#conv-company')?.value;
        const date = convModal.panel.querySelector('#conv-date')?.value;
        const time = convModal.panel.querySelector('#conv-time')?.value;

        store.convertInboxItem(item.id, selectedType, {
          title,
          clientId,
          projectId,
          company,
          date,
          time
        });

        convModal.close();
        render();
      };
    }
  }

  render();
  return container;
}
