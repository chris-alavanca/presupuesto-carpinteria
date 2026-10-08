import { useEffect, useMemo, useState } from 'react'
import Plano from './Plano.jsx'
import { PIEZAS, MATERIALES, ACABADOS, IMPUESTOS, AJUSTES_INICIALES, calcular, eur } from './pricing.js'

const CLAVE = 'taller-presupuestos-v1'
const ESTADOS = ['Borrador', 'Enviado', 'Aceptado', 'Rechazado']

const nuevo = (tipo = 'estanteria') => ({
  id: null, cliente: '', tipo, dims: { ...PIEZAS[tipo].def },
  material: 'pino', acabado: 'aceite', cierreSuave: true, tiradores: true, instalacion: true, notas: '',
})

const EJEMPLOS = [
  { ...nuevo('armario'), id: 'P-2026-014', cliente: 'Lucía Hernández', material: 'mdf', acabado: 'lacado', estado: 'Aceptado', fecha: '2026-09-22', notas: 'Dormitorio principal, hueco entre pilares.' },
  { ...nuevo('estanteria'), id: 'P-2026-015', cliente: 'Librería El Faro', material: 'roble', acabado: 'aceite', dims: { ancho: 120, alto: 200, fondo: 32, baldas: 5, puertas: 0, cajones: 0 }, estado: 'Enviado', fecha: '2026-09-30', notas: 'Dos unidades iguales; precio por unidad.' },
  { ...nuevo('mesa'), id: 'P-2026-016', cliente: 'Casa rural Los Almendros', material: 'pino', acabado: 'barniz', instalacion: false, estado: 'Borrador', fecha: '2026-10-05', notas: '' },
]

const INICIAL = { presupuestos: EJEMPLOS, ajustes: AJUSTES_INICIALES, siguiente: 17 }

function leer() {
  try {
    const raw = localStorage.getItem(CLAVE)
    if (raw) return JSON.parse(raw)
  } catch { /* almacenamiento no disponible */ }
  return INICIAL
}

export default function App() {
  const [datos, setDatos] = useState(leer)
  const [q, setQ] = useState(() => nuevo())
  const [aviso, setAviso] = useState('')

  useEffect(() => {
    try { localStorage.setItem(CLAVE, JSON.stringify(datos)) } catch { /* sin almacenamiento */ }
  }, [datos])

  useEffect(() => {
    if (!aviso) return
    const t = setTimeout(() => setAviso(''), 2600)
    return () => clearTimeout(t)
  }, [aviso])

  const r = useMemo(() => calcular(q, datos.ajustes), [q, datos.ajustes])

  const set = (k, v) => setQ(p => ({ ...p, [k]: v }))
  const setDim = (k, v) => {
    const n = Math.max(0, Math.round(Number(v) || 0))
    setQ(p => ({ ...p, dims: { ...p.dims, [k]: n } }))
  }
  const cambiarTipo = tipo => setQ(p => ({ ...p, tipo, dims: { ...PIEZAS[tipo].def } }))

  const guardar = () => {
    if (!q.cliente.trim()) { setAviso('Escribe el nombre del cliente para guardar el presupuesto.'); return }
    if (q.id) {
      setDatos(d => ({ ...d, presupuestos: d.presupuestos.map(p => p.id === q.id ? { ...p, ...q } : p) }))
      setAviso('Presupuesto actualizado.')
      return
    }
    const id = `P-2026-${String(datos.siguiente).padStart(3, '0')}`
    const hoy = new Date().toISOString().slice(0, 10)
    setDatos(d => ({ ...d, siguiente: d.siguiente + 1, presupuestos: [{ ...q, id, estado: 'Borrador', fecha: hoy }, ...d.presupuestos] }))
    setQ(p => ({ ...p, id }))
    setAviso(`Presupuesto ${id} guardado.`)
  }

  const abrir = p => { setQ({ ...nuevo(p.tipo), ...p }); window.scrollTo({ top: 0, behavior: 'smooth' }) }
  const cambiarEstado = (id, estado) => setDatos(d => ({ ...d, presupuestos: d.presupuestos.map(p => p.id === id ? { ...p, estado } : p) }))
  const borrar = id => {
    if (!window.confirm(`¿Borrar el presupuesto ${id}?`)) return
    setDatos(d => ({ ...d, presupuestos: d.presupuestos.filter(p => p.id !== id) }))
    if (q.id === id) setQ(nuevo())
  }
  const setAjuste = (k, v) => setDatos(d => ({ ...d, ajustes: { ...d.ajustes, [k]: k === 'impuesto' ? v : Math.max(0, Number(v) || 0) } }))
  const restablecer = () => {
    if (!window.confirm('Se borrarán tus presupuestos y se cargarán los de ejemplo. ¿Continuar?')) return
    setDatos(INICIAL); setQ(nuevo())
  }

  const conPuertas = !['mesa', 'puerta'].includes(q.tipo)
  const totalDe = p => calcular({ ...nuevo(p.tipo), ...p }, datos.ajustes).total
  const aceptado = datos.presupuestos.filter(p => p.estado === 'Aceptado').reduce((s, p) => s + totalDe(p), 0)

  return (
    <div className="app">
      <header className="cabecera">
        <div>
          <p className="taller">Taller Almendro, carpintería a medida</p>
          <h1>Presupuestador</h1>
        </div>
        <button className="btn" onClick={() => setQ(nuevo())}>Nuevo presupuesto</button>
      </header>

      <main className="rejilla">
        <section className="panel formulario" aria-label="Datos de la pieza">
          <label className="campo">
            <span>Cliente</span>
            <input value={q.cliente} onChange={e => set('cliente', e.target.value)} placeholder="Nombre o empresa" />
          </label>

          <fieldset className="tipos">
            <legend>Pieza</legend>
            {Object.entries(PIEZAS).map(([k, p]) => (
              <label key={k} className={'chip' + (q.tipo === k ? ' activo' : '')}>
                <input type="radio" name="tipo" checked={q.tipo === k} onChange={() => cambiarTipo(k)} />
                {p.nombre}
              </label>
            ))}
          </fieldset>

          <div className="medidas">
            {[['ancho', 'Ancho'], ['alto', 'Alto'], ['fondo', 'Fondo']].map(([k, t]) => (
              <label key={k} className="campo">
                <span>{t} (cm)</span>
                <input type="number" inputMode="numeric" min="1" value={q.dims[k]} onChange={e => setDim(k, e.target.value)} />
              </label>
            ))}
          </div>

          {conPuertas && (
            <div className="medidas">
              {[['baldas', 'Baldas'], ['puertas', 'Puertas'], ['cajones', 'Cajones']].map(([k, t]) => (
                <label key={k} className="campo">
                  <span>{t}</span>
                  <input type="number" inputMode="numeric" min="0" max="8" value={q.dims[k]} onChange={e => setDim(k, Math.min(8, Number(e.target.value)))} />
                </label>
              ))}
            </div>
          )}

          <div className="medidas dos">
            <label className="campo">
              <span>Material</span>
              <select value={q.material} onChange={e => set('material', e.target.value)}>
                {Object.entries(MATERIALES).map(([k, m]) => <option key={k} value={k}>{m.nombre}, {m.precio} €/m²</option>)}
              </select>
            </label>
            <label className="campo">
              <span>Acabado</span>
              <select value={q.acabado} onChange={e => set('acabado', e.target.value)}>
                {Object.entries(ACABADOS).map(([k, a]) => <option key={k} value={k}>{a.nombre}, {a.precio} €/m²</option>)}
              </select>
            </label>
          </div>

          <div className="opciones">
            {conPuertas && <label><input type="checkbox" checked={q.cierreSuave} onChange={e => set('cierreSuave', e.target.checked)} /> Bisagras de cierre suave</label>}
            {conPuertas && <label><input type="checkbox" checked={q.tiradores} onChange={e => set('tiradores', e.target.checked)} /> Tiradores</label>}
            <label><input type="checkbox" checked={q.instalacion} onChange={e => set('instalacion', e.target.checked)} /> Montaje en casa del cliente</label>
          </div>

          <label className="campo">
            <span>Notas para el cliente</span>
            <textarea rows="2" value={q.notas} onChange={e => set('notas', e.target.value)} placeholder="Opcional" />
          </label>
        </section>

        <section className="panel dibujo" aria-label="Plano">
          <Plano tipo={q.tipo} dims={q.dims} />
        </section>

        <aside className="panel resumen" aria-label="Presupuesto">
          <div className="resumen-cab">
            <span>{q.id || 'Sin guardar'}</span>
            <span>{q.cliente || 'Cliente sin nombre'}</span>
          </div>
          <p className="pieza-nombre">{PIEZAS[q.tipo].nombre}, {q.dims.ancho} × {q.dims.alto} × {q.dims.fondo} cm</p>
          <table className="lineas">
            <tbody>
              {r.lineas.map((l, i) => (
                <tr key={i}><td>{l.concepto}</td><td>{eur(l.importe)}</td></tr>
              ))}
              <tr className="sub"><td>Margen del taller ({datos.ajustes.margen} %)</td><td>{eur(r.margen)}</td></tr>
              <tr className="sub"><td>Base imponible</td><td>{eur(r.base)}</td></tr>
              <tr className="sub"><td>{r.impuesto}</td><td>{eur(r.cuota)}</td></tr>
            </tbody>
          </table>
          <div className="total">
            <span>Total</span>
            <strong><mark>{eur(r.total)}</mark></strong>
          </div>
          <p className="plazo">Plazo estimado: {r.semanas} {r.semanas === 1 ? 'semana' : 'semanas'} de taller ({r.horas} h de trabajo)</p>
          {q.notas && <p className="notas-print">{q.notas}</p>}
          <div className="acciones">
            <button className="btn primario" onClick={guardar}>{q.id ? 'Actualizar presupuesto' : 'Guardar presupuesto'}</button>
            <button className="btn" onClick={() => window.print()}>Imprimir o guardar PDF</button>
          </div>
          <p className="aviso" role="status" aria-live="polite">{aviso}</p>
        </aside>
      </main>

      <section className="panel lista" aria-label="Presupuestos guardados">
        <div className="lista-cab">
          <h2>Presupuestos guardados</h2>
          <p>Aceptados: <strong>{eur(aceptado)}</strong></p>
        </div>
        {datos.presupuestos.length === 0 ? (
          <p className="vacio">Aún no hay presupuestos. Rellena el formulario y pulsa «Guardar presupuesto».</p>
        ) : (
          <div className="tabla-scroll">
            <table className="guardados">
              <thead><tr><th>Ref.</th><th>Cliente</th><th>Pieza</th><th>Fecha</th><th className="num">Total</th><th>Estado</th><th><span className="sr">Acciones</span></th></tr></thead>
              <tbody>
                {datos.presupuestos.map(p => (
                  <tr key={p.id} className={q.id === p.id ? 'abierto' : ''}>
                    <td>{p.id}</td>
                    <td>{p.cliente}</td>
                    <td>{PIEZAS[p.tipo].nombre} {p.dims.ancho}×{p.dims.alto}</td>
                    <td>{new Date(p.fecha + 'T12:00').toLocaleDateString('es-ES')}</td>
                    <td className="num">{eur(totalDe(p))}</td>
                    <td>
                      <select aria-label={`Estado de ${p.id}`} value={p.estado} onChange={e => cambiarEstado(p.id, e.target.value)} className={'estado e-' + p.estado.toLowerCase()}>
                        {ESTADOS.map(s => <option key={s}>{s}</option>)}
                      </select>
                    </td>
                    <td className="fila-acciones">
                      <button className="enlace" onClick={() => abrir(p)}>Abrir</button>
                      <button className="enlace peligro" onClick={() => borrar(p.id)}>Borrar</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <details className="panel ajustes">
        <summary>Ajustes del taller</summary>
        <div className="medidas">
          <label className="campo"><span>Tarifa (€/h)</span>
            <input type="number" min="0" value={datos.ajustes.tarifaHora} onChange={e => setAjuste('tarifaHora', e.target.value)} /></label>
          <label className="campo"><span>Margen (%)</span>
            <input type="number" min="0" value={datos.ajustes.margen} onChange={e => setAjuste('margen', e.target.value)} /></label>
          <label className="campo"><span>Impuesto</span>
            <select value={datos.ajustes.impuesto} onChange={e => setAjuste('impuesto', e.target.value)}>
              {Object.entries(IMPUESTOS).map(([k, i]) => <option key={k} value={k}>{i.nombre}</option>)}
            </select></label>
        </div>
        <p className="nota">Demostración con datos de ejemplo. Todo se guarda solo en este navegador.</p>
        <button className="enlace peligro" onClick={restablecer}>Restablecer datos de ejemplo</button>
      </details>

      <footer className="pie">Demo de Chris Martin. <a href="https://github.com/chris-alavanca/presupuesto-carpinteria">Ver el código</a></footer>
    </div>
  )
}
