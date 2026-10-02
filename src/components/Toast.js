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
    const bgStyles = type === 'success' ? 'bg-emerald-50 dark:bg-emerald-950/80 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-100' :
                     type === 'error' ? 'bg-rose-50 dark:bg-rose-950/80 border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-100' :
                     type === 'warning' ? 'bg-amber-50 dark:bg-amber-950/80 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-100' :
                     'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100';

    toast.className = `pointer-events-auto transform transition-all duration-300 ease-out translate-y-2 opacity-0 flex items-center gap-3 p-4 rounded-xl border shadow-lg text-sm font-medium ${bgStyles}`;

    const dotColor = type === 'success' ? 'bg-emerald-500' : type === 'error' ? 'bg-rose-500' : type === 'warning' ? 'bg-amber-500' : 'bg-blue-600';
    
    toast.innerHTML = `
      <div class="w-2 h-2 rounded-full shrink-0 ${dotColor}"></div>
      <div class="flex-1 text-xs sm:text-sm font-medium">${message}</div>
      <button class="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors text-base font-bold leading-none">&times;</button>
    `;

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
