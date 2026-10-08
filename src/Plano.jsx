// Alzado frontal acotado que se redibuja al cambiar las medidas.
const VW = 420, VH = 460, PAD = 52

function Cota({ x1, y1, x2, y2, texto, vertical }) {
  const mx = (x1 + x2) / 2, my = (y1 + y2) / 2
  return (
    <g className="cota">
      <line x1={x1} y1={y1} x2={x2} y2={y2} markerStart="url(#flecha)" markerEnd="url(#flecha)" />
      <text
        x={vertical ? mx - 10 : mx}
        y={vertical ? my : my - 8}
        textAnchor="middle"
        transform={vertical ? `rotate(-90 ${mx - 10} ${my})` : undefined}
      >{texto}</text>
    </g>
  )
}

export default function Plano({ tipo, dims }) {
  const { ancho, alto, fondo, baldas, puertas, cajones } = dims
  const esMesa = tipo === 'mesa'
  const escala = Math.min((VW - PAD * 2) / Math.max(ancho, 1), (VH - PAD * 2) / Math.max(alto, 1))
  const w = ancho * escala, h = alto * escala
  const x = (VW - w) / 2 + 10, y = (VH - h) / 2 - 6

  const piezas = []
  if (esMesa) {
    const tablero = Math.max(4, 4 * escala)
    const pata = Math.max(4, 7 * escala)
    piezas.push(<rect key="t" x={x} y={y} width={w} height={tablero} className="pieza" />)
    piezas.push(<rect key="p1" x={x + 6 * escala} y={y + tablero} width={pata} height={h - tablero} className="pieza" />)
    piezas.push(<rect key="p2" x={x + w - 6 * escala - pata} y={y + tablero} width={pata} height={h - tablero} className="pieza" />)
  } else if (tipo === 'puerta') {
    piezas.push(<rect key="h" x={x} y={y} width={w} height={h} className="pieza" />)
    piezas.push(<rect key="pa" x={x + w * 0.15} y={y + h * 0.08} width={w * 0.7} height={h * 0.36} className="linea" />)
    piezas.push(<rect key="pb" x={x + w * 0.15} y={y + h * 0.52} width={w * 0.7} height={h * 0.4} className="linea" />)
    piezas.push(<circle key="m" cx={x + w * 0.88} cy={y + h * 0.5} r={3} className="herraje" />)
  } else {
    piezas.push(<rect key="c" x={x} y={y} width={w} height={h} className="pieza" />)
    const zonaCajones = cajones > 0 ? Math.min(h * 0.45, cajones * 18 * escala) : 0
    const zonaSuperior = h - zonaCajones
    for (let i = 1; i <= cajones; i++) {
      const cy = y + zonaSuperior + (zonaCajones / cajones) * (i - 1)
      piezas.push(<rect key={'cj' + i} x={x + 3} y={cy + 2} width={w - 6} height={zonaCajones / cajones - 4} className="linea" />)
      piezas.push(<line key={'tj' + i} x1={x + w / 2 - 10} x2={x + w / 2 + 10} y1={cy + zonaCajones / cajones / 2} y2={cy + zonaCajones / cajones / 2} className="herraje-l" />)
    }
    for (let i = 1; i <= baldas; i++) {
      const by = y + (zonaSuperior / (baldas + 1)) * i
      piezas.push(<line key={'b' + i} x1={x} x2={x + w} y1={by} y2={by} className={puertas > 0 ? 'oculta' : 'linea'} />)
    }
    if (puertas > 0) {
      const pw = w / puertas
      for (let i = 0; i < puertas; i++) {
        piezas.push(<rect key={'pu' + i} x={x + pw * i + 2} y={y + 2} width={pw - 4} height={zonaSuperior - 4} className="frente" />)
        const izquierda = puertas === 1 || i % 2 === 1
        piezas.push(<line key={'ti' + i} x1={x + pw * i + (izquierda ? 10 : pw - 10)} x2={x + pw * i + (izquierda ? 10 : pw - 10)} y1={y + zonaSuperior / 2 - 12} y2={y + zonaSuperior / 2 + 12} className="herraje-l" />)
      }
    }
  }

  return (
    <svg viewBox={`0 0 ${VW} ${VH}`} className="plano" role="img"
      aria-label={`Alzado de la pieza: ${ancho} cm de ancho por ${alto} cm de alto y ${fondo} cm de fondo`}>
      <defs>
        <marker id="flecha" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M0,2 L10,5 L0,8 Z" />
        </marker>
        <pattern id="veta" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(8)">
          <line x1="0" y1="0" x2="0" y2="8" className="veta" />
        </pattern>
      </defs>
      {piezas}
      <Cota x1={x} y1={y + h + 26} x2={x + w} y2={y + h + 26} texto={`${ancho} cm`} />
      <Cota x1={x - 26} y1={y} x2={x - 26} y2={y + h} texto={`${alto} cm`} vertical />
      <text x={VW - 8} y={18} textAnchor="end" className="fondo">fondo {fondo} cm</text>
    </svg>
  )
}
