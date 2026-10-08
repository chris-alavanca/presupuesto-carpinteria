// Catálogo y modelo de precios del taller.
// Todas las medidas en centímetros; superficies en m².

export const PIEZAS = {
  estanteria: { nombre: 'Estantería', baseHoras: 6, def: { ancho: 90, alto: 180, fondo: 30, baldas: 4, puertas: 0, cajones: 0 } },
  armario:    { nombre: 'Armario', baseHoras: 14, def: { ancho: 120, alto: 220, fondo: 60, baldas: 3, puertas: 2, cajones: 2 } },
  cocina:     { nombre: 'Módulo de cocina', baseHoras: 8, def: { ancho: 60, alto: 72, fondo: 56, baldas: 1, puertas: 1, cajones: 0 } },
  mesa:       { nombre: 'Mesa', baseHoras: 10, def: { ancho: 160, alto: 75, fondo: 90, baldas: 0, puertas: 0, cajones: 0 } },
  puerta:     { nombre: 'Puerta de paso', baseHoras: 6, def: { ancho: 82, alto: 203, fondo: 4, baldas: 0, puertas: 1, cajones: 0 } },
}

export const MATERIALES = {
  pino:   { nombre: 'Pino macizo', precio: 38 },
  roble:  { nombre: 'Roble macizo', precio: 95 },
  abedul: { nombre: 'Contrachapado de abedul', precio: 48 },
  mdf:    { nombre: 'MDF para lacar', precio: 22 },
}

export const ACABADOS = {
  aceite: { nombre: 'Aceite natural', precio: 8 },
  barniz: { nombre: 'Barniz mate', precio: 12 },
  lacado: { nombre: 'Lacado a color', precio: 28 },
}

export const IMPUESTOS = {
  igic: { nombre: 'IGIC 7 % (Canarias)', tipo: 0.07 },
  iva:  { nombre: 'IVA 21 % (Península y Baleares)', tipo: 0.21 },
}

export const AJUSTES_INICIALES = { tarifaHora: 32, margen: 20, impuesto: 'igic' }

const DESPERDICIO = 0.15
const BISAGRA = 6, TIRADOR = 9, GUIA_CAJON = 24

const m2 = (a, b) => (a * b) / 10000

// Superficie de tablero que consume cada tipo de pieza.
function superficie(tipo, d) {
  const { ancho: w, alto: h, fondo: f, baldas, cajones, puertas } = d
  switch (tipo) {
    case 'mesa':
      return m2(w, f) * 1.6 + 0.3 // tablero grueso + patas y faldón
    case 'puerta':
      return m2(w, h) * 1.3
    default: {
      const casco = 2 * m2(h, f) + 2 * m2(w, f) + 0.3 * m2(w, h) // laterales, techo y suelo, trasera fina
      const interior = baldas * m2(w, f)
      const frentes = puertas > 0 ? m2(w, h) : 0
      const cajonera = cajones * (m2(w, 18) + 2 * m2(f, 15))
      return casco + interior + frentes + cajonera
    }
  }
}

function horas(tipo, d) {
  const base = PIEZAS[tipo].baseHoras
  const tamano = Math.max(0, m2(d.ancho, d.alto) - 1) * 1.5 // piezas grandes llevan más tiempo
  return base + tamano + d.baldas * 0.6 + d.puertas * 2 + d.cajones * 2.5
}

const r2 = n => Math.round(n * 100) / 100

export function calcular(q, ajustes) {
  const sup = superficie(q.tipo, q.dims) * (1 + DESPERDICIO)
  const mat = MATERIALES[q.material]
  const aca = ACABADOS[q.acabado]

  const lineas = []
  lineas.push({ concepto: `${mat.nombre}, ${sup.toFixed(2)} m² con un 15 % de merma`, importe: sup * mat.precio })
  lineas.push({ concepto: `${aca.nombre}, ${sup.toFixed(2)} m²`, importe: sup * aca.precio })

  const herrajes = q.dims.puertas * 2 * BISAGRA * (q.cierreSuave ? 1.5 : 1)
    + (q.dims.puertas + q.dims.cajones) * (q.tiradores ? TIRADOR : 0)
    + q.dims.cajones * GUIA_CAJON
  if (herrajes > 0) lineas.push({ concepto: 'Herrajes: bisagras, guías y tiradores', importe: herrajes })

  const h = horas(q.tipo, q.dims)
  lineas.push({ concepto: `Mano de obra en taller, ${h.toFixed(1)} h a ${ajustes.tarifaHora} €/h`, importe: h * ajustes.tarifaHora })

  if (q.instalacion) {
    const hi = Math.max(2, h * 0.25)
    lineas.push({ concepto: `Montaje en casa del cliente, ${hi.toFixed(1)} h`, importe: hi * ajustes.tarifaHora })
  }

  const coste = lineas.reduce((s, l) => s + l.importe, 0)
  const margen = coste * (ajustes.margen / 100)
  const base = coste + margen
  const imp = IMPUESTOS[ajustes.impuesto]
  const cuota = base * imp.tipo

  return {
    lineas: lineas.map(l => ({ ...l, importe: r2(l.importe) })),
    coste: r2(coste), margen: r2(margen), base: r2(base),
    impuesto: imp.nombre, cuota: r2(cuota), total: r2(base + cuota),
    horas: r2(h), semanas: Math.max(1, Math.ceil(h / 20)),
  }
}

export const eur = n => n.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })
