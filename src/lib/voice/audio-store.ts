/**
 * IndexedDB 音频存储模块
 *
 * 用 IndexedDB 存储录音 Blob（最长 60 秒的录音也不适合 localStorage）。
 * 数据库名 qm-voice-storage，store 名 audio-blobs，key 为 message ID。
 *
 * 所有操作均为异步，失败时不抛异常（降级为纯文字消息），不阻塞 UI。
 */

const DB_NAME = "qm-voice-storage";
const STORE_NAME = "audio-blobs";
const DB_VERSION = 1;

let dbPromise: Promise<IDBDatabase> | null = null;

/** 打开（或创建）数据库，单例复用 */
function openDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB 不可用"));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => {
      const db = request.result;
      db.onversionchange = () => { db.close(); dbPromise = null; };
      resolve(db);
    };
    request.onerror = () => reject(request.error);
  });

  void dbPromise.catch(() => { dbPromise = null; });
  return dbPromise;
}

/**
 * 保存音频 Blob
 * 写入时捕获 QuotaExceededError，失败不影响对话（降级为纯文字消息）
 */
export async function saveAudio(messageId: string, blob: Blob): Promise<void> {
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(blob, messageId);

      req.onsuccess = () => resolve();
      req.onerror = () => {
        // QuotaExceededError 等错误静默处理
        console.warn("[audio-store] saveAudio 失败:", req.error);
        resolve(); // 不 reject，降级为纯文字
      };
    });
  } catch (err) {
    console.warn("[audio-store] saveAudio 异常:", err);
    // 降级：不抛异常
  }
}

/** 读取音频 Blob，不存在返回 null */
export async function getAudio(messageId: string): Promise<Blob | null> {
  try {
    const db = await openDB();
    return await new Promise<Blob | null>((resolve) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(messageId);

      req.onsuccess = () => {
        const result = req.result;
        resolve(result instanceof Blob ? result : null);
      };
      req.onerror = () => {
        console.warn("[audio-store] getAudio 失败:", req.error);
        resolve(null);
      };
    });
  } catch (err) {
    console.warn("[audio-store] getAudio 异常:", err);
    return null;
  }
}

/** 删除指定音频 */
export async function deleteAudio(messageId: string): Promise<void> {
  try {
    const db = await openDB();
    await new Promise<void>((resolve) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(messageId);
      req.onsuccess = () => resolve();
      req.onerror = () => {
        console.warn("[audio-store] deleteAudio 失败:", req.error);
        resolve();
      };
    });
  } catch (err) {
    console.warn("[audio-store] deleteAudio 异常:", err);
  }
}

/** 清空所有音频（新对话时调用） */
export async function clearAllAudio(): Promise<void> {
  try {
    const db = await openDB();
    await new Promise<void>((resolve) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const req = store.clear();
      req.onsuccess = () => resolve();
      req.onerror = () => {
        console.warn("[audio-store] clearAllAudio 失败:", req.error);
        resolve();
      };
    });
  } catch (err) {
    console.warn("[audio-store] clearAllAudio 异常:", err);
  }
}

/** 桌面对话清空：只删除本对话消息的音频，事务实际完成后才确认。 */
export async function deleteConversationAudioChecked(messageIds: string[]): Promise<void> {
  if (!messageIds.length) return;
  const db = await openDB();
  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    for (const id of messageIds) store.delete(id);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error || new Error("音频删除失败"));
    transaction.onabort = () => reject(transaction.error || new Error("音频删除中断"));
  });
}
