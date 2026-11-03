import { useEffect, useMemo, useRef, useState } from 'react'
import { loadInventario, saveInventario, pedirPersistencia } from './db.js'

const PAGE = 60

const norm = (s) =>
  String(s ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')

const MODOS = [
  { id: 'todo', label: 'Todo' },
  { id: 'codigo', label: 'Código' },
  { id: 'casillero', label: 'Casillero' },
]

const fmtNum = (n) => Number(n).toLocaleString('es-AR', { maximumFractionDigits: 2 })

function fmtFecha(s) {
  if (!s) return ''
  const [f, h] = s.split(' ')
  const [y, m, d] = f.split('-')
  return `${d}/${m}/${y} ${h?.slice(0, 5) ?? ''}`.trim()
}

export default function App() {
  const [data, setData] = useState(null) // { generado, items }
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [q, setQ] = useState('')
  const [modo, setModo] = useState('todo')
  const [limite, setLimite] = useState(PAGE)
  const fileRef = useRef(null)

  useEffect(() => {
    loadInventario()
      .then((d) => setData(d ?? null))
      .catch(() => setError('No se pudo leer la base local.'))
      .finally(() => setCargando(false))
  }, [])

  // índice de búsqueda precalculado una vez por importación
  const indexado = useMemo(
    () =>
      (data?.items ?? []).map((it) => ({
        it,
        todo: norm(`${it.c} ${it.d} ${it.k}`),
        codigo: norm(it.c),
        casillero: norm(it.k),
      })),
    [data],
  )

  const resultados = useMemo(() => {
    const tokens = norm(q).split(/\s+/).filter(Boolean)
    if (!tokens.length) return indexado
    return indexado.filter((r) => tokens.every((t) => r[modo].includes(t)))
  }, [indexado, q, modo])

  useEffect(() => setLimite(PAGE), [q, modo])

  async function importar(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setError('')
    try {
      const json = JSON.parse(await file.text())
      if (!Array.isArray(json.items)) throw new Error('formato')
      await saveInventario(json)
      pedirPersistencia()
      setData(json)
    } catch {
      setError('El archivo no es válido. Usá el repuestos.json exportado desde la app de escritorio.')
    }
  }

  const importBtn = (label, cls = '') => (
    <button className={`btn ${cls}`} onClick={() => fileRef.current?.click()}>
      {label}
    </button>
  )

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand-block">
          <div className="brand-top">AGRÍCOLA</div>
          <div className="brand-line">
            <span>JUNÍN</span>
            <span>S.A.</span>
          </div>
        </div>
        <div className="topbar-title">
          <span className="topbar-name">Repuestos</span>
          {data && <span className="topbar-sub">Datos al {fmtFecha(data.generado).split(' ')[0]}</span>}
        </div>
      </header>

      <input
        ref={fileRef}
        type="file"
        accept=".json,application/json"
        hidden
        onChange={importar}
      />

      {cargando ? null : !data ? (
        <main className="vacio">
          <h1>Sin datos todavía</h1>
          <p>
            Importá el archivo <b>repuestos.json</b> exportado desde la app de escritorio. Podés
            elegirlo desde Archivos, iCloud o Drive.
          </p>
          {importBtn('Importar repuestos.json', 'btn-primary')}
          {error && <p className="error">{error}</p>}
        </main>
      ) : (
        <main>
          <div className="buscador">
            <div className="search-wrap">
              <input
                className="search"
                type="search"
                inputMode="search"
                enterKeyHint="search"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="characters"
                spellCheck={false}
                placeholder="Buscar código, descripción o casillero…"
                value={q}
                onChange={(e) => setQ(e.target.value.toUpperCase())}
              />
              {q && (
                <button className="search-clear" onClick={() => setQ('')} aria-label="Borrar">
                  ✕
                </button>
              )}
            </div>
            <div className="chips">
              {MODOS.map((m) => (
                <button
                  key={m.id}
                  className={`chip${modo === m.id ? ' on' : ''}`}
                  onClick={() => setModo(m.id)}
                >
                  {m.label}
                </button>
              ))}
              <button className="chip chip-update" onClick={() => fileRef.current?.click()}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M21 12a9 9 0 1 1-3-6.7" />
                  <polyline points="21 3 21 9 15 9" />
                </svg>
                Actualizar
              </button>
            </div>
          </div>

          {error && <p className="error">{error}</p>}

          <div className="meta">
            {resultados.length.toLocaleString('es-AR')} de {indexado.length.toLocaleString('es-AR')}{' '}
            · datos del {fmtFecha(data.generado)}
          </div>

          <ul className="lista">
            {resultados.slice(0, limite).map(({ it }) => {
              const bajo = it.m > 0 && it.s <= it.m
              return (
                <li key={it.c} className="card">
                  <div className="info">
                    <div className="codigo">{it.c}</div>
                    <div className="desc">{it.d}</div>
                    <div className="sub">
                      <span className={`stock${bajo ? ' bajo' : ''}`}>Stock {fmtNum(it.s)}</span>
                      {it.p && <span className="prov">{it.p}</span>}
                    </div>
                  </div>
                  <div className="casillero">
                    <span className="casillero-label">Casillero</span>
                    <span className="casillero-num">{it.k || '—'}</span>
                  </div>
                </li>
              )
            })}
          </ul>

          {resultados.length === 0 && <div className="sin-res">Sin resultados</div>}

          {resultados.length > limite && (
            <button className="btn mas" onClick={() => setLimite((l) => l + PAGE)}>
              Mostrar más
            </button>
          )}
        </main>
      )}
    </div>
  )
}
