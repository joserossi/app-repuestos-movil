// Persistencia local en IndexedDB: guardamos el JSON completo bajo una sola clave.
const DB_NAME = 'repuestos'
const STORE = 'kv'
const KEY = 'inventario'

function open() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = () => req.result.createObjectStore(STORE)
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

function tx(mode, fn) {
  return open().then(
    (db) =>
      new Promise((resolve, reject) => {
        const t = db.transaction(STORE, mode)
        const r = fn(t.objectStore(STORE))
        t.oncomplete = () => resolve(r.result)
        t.onerror = () => reject(t.error)
      }),
  )
}

export const loadInventario = () => tx('readonly', (s) => s.get(KEY))
export const saveInventario = (data) => tx('readwrite', (s) => s.put(data, KEY))

// Pide a iOS que no borre los datos (solo es efectivo con la app instalada).
export function pedirPersistencia() {
  navigator.storage?.persist?.().catch(() => {})
}
