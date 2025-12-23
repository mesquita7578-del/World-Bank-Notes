
import { Banknote } from "../types";

const DB_NAME = "NumisArchiveDB";
const STORE_NAME = "banknotes";
const DB_VERSION = 1;

export class DBService {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: "id" });
        }
      };

      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        resolve();
      };

      request.onerror = () => reject("Erro ao abrir IndexedDB");
    });
  }

  async getAll(): Promise<Banknote[]> {
    return new Promise((resolve, reject) => {
      if (!this.db) return reject("DB não inicializado");
      const transaction = this.db.transaction(STORE_NAME, "readonly");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject("Erro ao buscar registros");
    });
  }

  async save(note: Banknote): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) return reject("DB não inicializado");
      const transaction = this.db.transaction(STORE_NAME, "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(note);

      request.onsuccess = () => resolve();
      request.onerror = () => reject("Erro ao salvar registro");
    });
  }

  async delete(id: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) return reject("DB não inicializado");
      const transaction = this.db.transaction(STORE_NAME, "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject("Erro ao excluir registro");
    });
  }

  async clear(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) return reject("DB não inicializado");
      const transaction = this.db.transaction(STORE_NAME, "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.clear();
      request.onsuccess = () => resolve();
    });
  }
}

export const dbService = new DBService();
