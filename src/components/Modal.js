class ModalManager {
  constructor() {
    this.modalRoot = null;
    this.init();
  }

  init() {
    if (!document.getElementById('modal-root')) {
      this.modalRoot = document.createElement('div');
      this.modalRoot.id = 'modal-root';
      this.modalRoot.className = 'fixed inset-0 z-50 pointer-events-none';
      document.body.appendChild(this.modalRoot);
    } else {
      this.modalRoot = document.getElementById('modal-root');
    }
  }

  open({ title, content, size = 'md', isDrawer = false, onClose }) {
    this.init();
    this.close(); // fecha qualquer modal existente

    const overlay = document.createElement('div');
    overlay.className = 'pointer-events-auto fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 transition-opacity duration-200 opacity-0 z-50';
    
    let sizeClasses = 'max-w-md';
    if (size === 'lg') sizeClasses = 'max-w-2xl';
    if (size === 'xl') sizeClasses = 'max-w-4xl';
    if (size === 'full') sizeClasses = 'max-w-6xl';

    const panel = document.createElement('div');
    
    if (isDrawer) {
      panel.className = 'pointer-events-auto fixed right-0 top-0 bottom-0 w-full max-w-lg bg-white dark:bg-zinc-900 border-l border-zinc-200 dark:border-zinc-800 shadow-2xl flex flex-col transform transition-transform duration-300 translate-x-full';
    } else {
      panel.className = `pointer-events-auto w-full ${sizeClasses} bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] transform transition-all duration-200 scale-95 opacity-0 overflow-hidden`;
    }

    panel.innerHTML = `
      <div class="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 shrink-0">
        <h3 class="text-base font-semibold text-zinc-900 dark:text-zinc-100">${title}</h3>
        <button id="modal-close-btn" class="p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
        </button>
      </div>
      <div class="p-6 overflow-y-auto flex-1 space-y-4 text-zinc-800 dark:text-zinc-200">
        ${content}
      </div>
    `;

    overlay.appendChild(panel);
    this.modalRoot.appendChild(overlay);

    const closeModal = () => {
      if (isDrawer) {
        panel.classList.add('translate-x-full');
      } else {
        panel.classList.add('scale-95', 'opacity-0');
      }
      overlay.classList.add('opacity-0');
      setTimeout(() => {
        overlay.remove();
        if (onClose) onClose();
      }, 250);
    };

    overlay.onclick = (e) => {
      if (e.target === overlay) closeModal();
    };

    const closeBtn = panel.querySelector('#modal-close-btn');
    if (closeBtn) closeBtn.onclick = closeModal;

    requestAnimationFrame(() => {
      overlay.classList.remove('opacity-0');
      if (isDrawer) {
        panel.classList.remove('translate-x-full');
      } else {
        panel.classList.remove('scale-95', 'opacity-0');
        panel.classList.add('scale-100', 'opacity-100');
      }
    });

    return { panel, close: closeModal };
  }

  confirm({
    title = 'Confirmação',
    message = 'Deseja continuar com esta ação?',
    confirmText = 'Confirmar',
    cancelText = 'Cancelar',
    confirmColor = 'bg-rose-600 hover:bg-rose-700',
    onConfirm,
    onCancel
  }) {
    const content = `
      <div class="space-y-4 select-none">
        <p class="text-xs sm:text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed">${message}</p>
        <div class="pt-3 flex items-center justify-end gap-2 border-t border-zinc-100 dark:border-zinc-800">
          <button id="modal-confirm-cancel" class="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer">
            ${cancelText}
          </button>
          <button id="modal-confirm-submit" class="px-4 py-2 rounded-xl text-xs font-bold text-white ${confirmColor} transition-all shadow-xs cursor-pointer active:scale-95">
            ${confirmText}
          </button>
        </div>
      </div>
    `;

    const m = this.open({
      title,
      content,
      size: 'md'
    });

    const cancelBtn = m.panel.querySelector('#modal-confirm-cancel');
    const submitBtn = m.panel.querySelector('#modal-confirm-submit');

    if (cancelBtn) {
      cancelBtn.onclick = () => {
        m.close();
        if (onCancel) onCancel();
      };
    }

    if (submitBtn) {
      submitBtn.onclick = async () => {
        submitBtn.disabled = true;
        submitBtn.classList.add('opacity-75');
        submitBtn.innerHTML = '<span>Processando...</span>';
        try {
          if (onConfirm) await onConfirm();
        } catch (err) {
          console.error('Erro na confirmação:', err);
        } finally {
          m.close();
        }
      };
    }

    return m;
  }

  close() {
    if (this.modalRoot) {
      this.modalRoot.innerHTML = '';
    }
  }
}

export const modal = new ModalManager();
