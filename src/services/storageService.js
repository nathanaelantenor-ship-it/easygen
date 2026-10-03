// ========================================================
// STORAGE SERVICE (IndexedDB & Local Binary Storage)
// Suporta uploads reais de qualquer tamanho (PDF, PNG, JPG, XLSX, DOCX, CSV)
// com persistência no IndexedDB, preview via Blob URL e download real.
// ========================================================

const DB_NAME = 'EasyGenStorageDB';
const DB_VERSION = 1;
const STORE_NAME = 'user_files';

class StorageService {
  constructor() {
    this.dbPromise = this.initDB();
  }

  initDB() {
    return new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || !window.indexedDB) {
        console.warn('IndexedDB não suportado neste ambiente.');
        return resolve(null);
      }

      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          store.createIndex('userId', 'userId', { unique: false });
          store.createIndex('createdAt', 'createdAt', { unique: false });
        }
      };

      request.onsuccess = (e) => {
        resolve(e.target.result);
      };

      request.onerror = (e) => {
        console.error('Erro ao abrir IndexedDB:', e.target.error);
        resolve(null); // Fallback amigável
      };
    });
  }

  formatBytes(bytes, decimals = 1) {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }

  getFileExtension(filename) {
    if (!filename) return '';
    const parts = filename.split('.');
    return parts.length > 1 ? parts.pop().toLowerCase() : '';
  }

  // Converte File/Blob para Base64 (para preview rápido e fallback)
  fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });
  }

  /**
   * Salva um arquivo binário real no IndexedDB
   * @param {File|Blob} file 
   * @param {Object} metadata 
   * @returns {Promise<Object>} Metadados do arquivo salvo
   */
  async saveFile(file, metadata = {}) {
    const fileId = metadata.id || 'file-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7);
    const originalName = file.name || metadata.originalName || 'arquivo';
    const extension = this.getFileExtension(originalName) || metadata.extension || 'bin';
    const sizeBytes = file.size || metadata.sizeBytes || 0;
    const sizeFormatted = this.formatBytes(sizeBytes);
    const mimeType = file.type || metadata.mimeType || 'application/octet-stream';
    const createdAt = new Date().toISOString();

    let base64Preview = null;
    if (mimeType.startsWith('image/') && sizeBytes < 5 * 1024 * 1024) {
      try {
        base64Preview = await this.fileToBase64(file);
      } catch (e) {
        console.warn('Erro ao gerar base64 de imagem:', e);
      }
    }

    const record = {
      id: fileId,
      userId: metadata.userId || 'guest',
      name: metadata.name || originalName,
      originalName,
      extension,
      sizeBytes,
      sizeFormatted,
      mimeType,
      category: metadata.category || 'Geral',
      clientId: metadata.clientId || null,
      clientName: metadata.clientName || null,
      projectId: metadata.projectId || null,
      projectName: metadata.projectName || null,
      deliveryId: metadata.deliveryId || null,
      subfolder: metadata.subfolder || null,
      notes: metadata.notes || '',
      base64Preview,
      blob: file, // Salva o próprio blob binário
      createdAt
    };

    const db = await this.dbPromise;
    if (db) {
      await new Promise((resolve, reject) => {
        try {
          const tx = db.transaction(STORE_NAME, 'readwrite');
          const store = tx.objectStore(STORE_NAME);
          store.put(record);
          tx.oncomplete = () => resolve(true);
          tx.onerror = (err) => reject(err);
        } catch (err) {
          console.error('Erro na transação IndexedDB:', err);
          resolve(false);
        }
      });
    }

    // Retorna metadados para salvar no estado (sem o objeto Blob direto para evitar ciclos)
    return {
      id: fileId,
      name: record.name,
      originalName: record.originalName,
      extension: record.extension,
      mimeType: record.mimeType,
      size: record.sizeFormatted,
      sizeBytes: record.sizeBytes,
      category: record.category,
      clientId: record.clientId,
      clientName: record.clientName,
      projectId: record.projectId,
      projectName: record.projectName,
      deliveryId: record.deliveryId,
      subfolder: record.subfolder,
      notes: record.notes,
      base64Preview: record.base64Preview,
      createdAt: record.createdAt
    };
  }

  /**
   * Obtém o registro completo do arquivo incluindo o Blob
   */
  async getFile(id) {
    const db = await this.dbPromise;
    if (!db) return null;
    return new Promise((resolve) => {
      try {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.get(id);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => resolve(null);
      } catch (e) {
        resolve(null);
      }
    });
  }

  /**
   * Obtém uma URL de Objeto para visualização/preview
   */
  async getObjectUrl(id) {
    const file = await this.getFile(id);
    if (!file) return null;
    if (file.blob instanceof Blob) {
      return URL.createObjectURL(file.blob);
    }
    if (file.base64Preview) {
      return file.base64Preview;
    }
    return null;
  }

  /**
   * Executa o download binário real do arquivo no navegador
   */
  async downloadFile(id, fallbackName = 'documento') {
    const file = await this.getFile(id);
    let blob = file?.blob;

    if (!blob && file?.base64Preview) {
      const res = await fetch(file.base64Preview);
      blob = await res.blob();
    }

    if (!blob) {
      throw new Error('Arquivo não encontrado no armazenamento local.');
    }

    const filename = file?.originalName || file?.name || fallbackName;
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }

  /**
   * Remove o arquivo do IndexedDB
   */
  async deleteFile(id) {
    const db = await this.dbPromise;
    if (!db) return;
    return new Promise((resolve) => {
      try {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        store.delete(id);
        tx.oncomplete = () => resolve(true);
        tx.onerror = () => resolve(false);
      } catch (e) {
        resolve(false);
      }
    });
  }
}

export const storageService = new StorageService();
