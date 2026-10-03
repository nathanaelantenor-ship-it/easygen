// ========================================================
// EXPORT MENU COMPONENT (PDF, CSV, EXCEL)
// Componente universal de exportação para todos os módulos
// ========================================================

import { exportToPDF, exportToCSV, exportToExcel } from '../utils/exportUtils.js';
import { toast } from './Toast.js';

/**
 * Retorna o HTML do botão e dropdown padronizado de exportação
 * @param {string} id - Identificador único do elemento
 * @param {string} [buttonText='Exportar']
 */
export function renderExportButtonHtml(id = 'export-dropdown', buttonText = 'Exportar') {
  return `
    <div class="relative inline-block text-left" id="${id}-wrapper">
      <button 
        type="button" 
        id="${id}-trigger" 
        class="inline-flex items-center gap-1.5 px-3 py-1.5 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-xl text-xs font-medium text-zinc-700 dark:text-zinc-300 transition-colors shadow-2xs cursor-pointer select-none"
      >
        <svg class="w-3.5 h-3.5 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
        </svg>
        <span>${buttonText}</span>
        <svg class="w-3 h-3 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
        </svg>
      </button>

      <div 
        id="${id}-menu" 
        class="hidden absolute right-0 z-50 mt-1.5 w-44 rounded-xl bg-white dark:bg-zinc-850 shadow-lg border border-zinc-200/80 dark:border-zinc-700/80 py-1.5 divide-y divide-zinc-100 dark:divide-zinc-800 focus:outline-none"
      >
        <div class="px-3 py-1.5 text-[10px] uppercase font-bold text-zinc-400 tracking-wider">
          Exportar como
        </div>
        <div class="py-1">
          <button 
            type="button" 
            data-format="pdf" 
            class="export-action-item w-full text-left px-3 py-2 text-xs text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800 flex items-center gap-2 transition-colors cursor-pointer"
          >
            <span class="w-5 h-5 rounded flex items-center justify-center bg-rose-100 dark:bg-rose-950/60 text-rose-600 text-[10px] font-bold">PDF</span>
            <span>Documento PDF (.pdf)</span>
          </button>
          <button 
            type="button" 
            data-format="excel" 
            class="export-action-item w-full text-left px-3 py-2 text-xs text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800 flex items-center gap-2 transition-colors cursor-pointer"
          >
            <span class="w-5 h-5 rounded flex items-center justify-center bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 text-[10px] font-bold">XLS</span>
            <span>Planilha Excel (.xlsx)</span>
          </button>
          <button 
            type="button" 
            data-format="csv" 
            class="export-action-item w-full text-left px-3 py-2 text-xs text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800 flex items-center gap-2 transition-colors cursor-pointer"
          >
            <span class="w-5 h-5 rounded flex items-center justify-center bg-blue-100 dark:bg-blue-950/60 text-blue-600 text-[10px] font-bold">CSV</span>
            <span>Arquivo CSV (.csv)</span>
          </button>
        </div>
      </div>
    </div>
  `;
}

/**
 * Vincula os eventos do dropdown de exportação
 * @param {HTMLElement} container - Elemento pai que contém o wrapper do dropdown
 * @param {string} id - Mesmo id passado para renderExportButtonHtml
 * @param {Function} getDataCallback - Função síncrona ou assíncrona que retorna:
 *   { filename, title, headers, rows, summary, filters, period }
 */
export function bindExportButton(container, id = 'export-dropdown', getDataCallback) {
  const wrapper = container.querySelector(`#${id}-wrapper`);
  if (!wrapper) return;

  const trigger = wrapper.querySelector(`#${id}-trigger`);
  const menu = wrapper.querySelector(`#${id}-menu`);
  if (!trigger || !menu) return;

  // Toggle do menu
  trigger.onclick = (e) => {
    e.stopPropagation();
    const isHidden = menu.classList.contains('hidden');
    // Fecha outros menus abertos
    document.querySelectorAll('[id$="-menu"]').forEach(m => m.classList.add('hidden'));
    if (isHidden) {
      menu.classList.remove('hidden');
    }
  };

  // Fecha ao clicar fora
  const closeListener = (e) => {
    if (!wrapper.contains(e.target)) {
      menu.classList.add('hidden');
    }
  };
  document.removeEventListener('click', closeListener);
  document.addEventListener('click', closeListener);

  // Ações de exportação
  menu.querySelectorAll('.export-action-item').forEach(btn => {
    btn.onclick = async (e) => {
      e.stopPropagation();
      menu.classList.add('hidden');
      const format = btn.getAttribute('data-format');

      try {
        const data = await getDataCallback();
        if (!data || !data.headers || !data.rows) {
          toast.error('Nenhum dado disponível para exportação.');
          return;
        }

        const filename = data.filename || `exportacao_${Date.now()}`;
        const title = data.title || 'Relatório';

        if (format === 'pdf') {
          exportToPDF(filename, title, data.headers, data.rows, {
            summary: data.summary,
            filters: data.filters,
            period: data.period
          });
        } else if (format === 'excel') {
          exportToExcel(filename, data.rows, data.headers, {
            summary: data.summary,
            filters: data.filters,
            sheetName: data.sheetName || 'Dados'
          });
        } else if (format === 'csv') {
          exportToCSV(filename, data.rows, data.headers);
        }

        toast.success('Arquivo exportado com sucesso!');
      } catch (err) {
        console.error('Falha ao exportar:', err);
        toast.error('Não foi possível gerar o arquivo. Tente novamente.');
      }
    };
  });
}
