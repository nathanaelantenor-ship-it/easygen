class ToastManager {
  constructor() {
    this.container = null;
    this.init();
  }

  init() {
    if (!document.getElementById('toast-container')) {
      this.container = document.createElement('div');
      this.container.id = 'toast-container';
      this.container.className = 'fixed bottom-5 right-5 z-50 flex flex-col gap-2 pointer-events-none max-w-sm w-full px-4';
      document.body.appendChild(this.container);
    } else {
      this.container = document.getElementById('toast-container');
    }
  }

  show(message, type = 'info', duration = 3500) {
    this.init();
    const toast = document.createElement('div');
    toast.className = pointer-events-auto transform transition-all duration-300 ease-out translate-y-2 opacity-0 flex items-center gap-3 p-4 rounded-xl border shadow-lg text-sm font-medium ;

    const iconColor = type === 'success' ? 'text-emerald-500' : type === 'error' ? 'text-rose-500' : type === 'warning' ? 'text-amber-500' : 'text-blue-600';
    
    toast.innerHTML = 
      <div class=\"w-2 h-2 rounded-full \"></div>
      <div class=\"flex-1 text-xs sm:text-sm font-medium\"></div>
      <button class=\"text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors\">&times;</button>
    ;

    toast.querySelector('button').onclick = () => this.dismiss(toast);
    this.container.appendChild(toast);

    requestAnimationFrame(() => {
      toast.classList.remove('translate-y-2', 'opacity-0');
      toast.classList.add('translate-y-0', 'opacity-100');
    });

    if (duration > 0) {
      setTimeout(() => this.dismiss(toast), duration);
    }
  }

  dismiss(toast) {
    toast.classList.add('opacity-0', 'translate-y-2');
    setTimeout(() => toast.remove(), 300);
  }

  success(msg) { this.show(msg, 'success'); }
  error(msg) { this.show(msg, 'error'); }
  warning(msg) { this.show(msg, 'warning'); }
  info(msg) { this.show(msg, 'info'); }
}

export const toast = new ToastManager();
