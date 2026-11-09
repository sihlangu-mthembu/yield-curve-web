// A hand-drawn SVG chart: no chart library, so every line here is explainable.

export interface CurvePoint {
  code: string
  years: number
  yieldPercent: number
}

interface Props {
  points: CurvePoint[]
  selected?: string
  onSelect?: (code: string) => void
}

const W = 720
const H = 320
const PAD = { top: 20, right: 24, bottom: 44, left: 52 }

export function YieldCurveChart({ points, selected, onSelect }: Props) {
  if (points.length === 0) return <p className="muted">No bonds left to plot for this date.</p>

  const sorted = [...points].sort((a, b) => a.years - b.years)
  const maxYears = Math.ceil(Math.max(...sorted.map((p) => p.years)) / 5) * 5
  const ys = sorted.map((p) => p.yieldPercent)
  const yMin = Math.floor(Math.min(...ys) - 0.5)
  const yMax = Math.ceil(Math.max(...ys) + 0.5)

  const x = (years: number) => PAD.left + (years / maxYears) * (W - PAD.left - PAD.right)
  const y = (pct: number) => H - PAD.bottom - ((pct - yMin) / (yMax - yMin)) * (H - PAD.top - PAD.bottom)

  const xTicks = Array.from({ length: maxYears / 5 + 1 }, (_, i) => i * 5)
  const yTicks = Array.from({ length: yMax - yMin + 1 }, (_, i) => yMin + i)
  const path = sorted.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(p.years).toFixed(1)},${y(p.yieldPercent).toFixed(1)}`)

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="chart" role="img" aria-label="Yield curve: yield against years to maturity">
      {yTicks.map((t) => (
        <g key={`y${t}`}>
          <line x1={PAD.left} x2={W - PAD.right} y1={y(t)} y2={y(t)} className="grid" />
          <text x={PAD.left - 8} y={y(t) + 4} textAnchor="end" className="tick">{t}%</text>
        </g>
      ))}
      {xTicks.map((t) => (
        <text key={`x${t}`} x={x(t)} y={H - PAD.bottom + 18} textAnchor="middle" className="tick">{t}y</text>
      ))}
      <text x={(W + PAD.left) / 2} y={H - 6} textAnchor="middle" className="axis-label">Years to maturity</text>

      <path d={path.join(' ')} className="curve" />
      {sorted.map((p, i) => (
        <g
          key={p.code}
          className={`point${p.code === selected ? ' selected' : ''}`}
          onClick={() => onSelect?.(p.code)}
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && onSelect?.(p.code)}
        >
          <circle cx={x(p.years)} cy={y(p.yieldPercent)} r={p.code === selected ? 7 : 5} />
          <text
            x={x(p.years)}
            y={i % 2 === 0 ? y(p.yieldPercent) + 20 : y(p.yieldPercent) - 11}
            textAnchor="middle"
            className="point-label"
          >
            {p.code}
          </text>
          <title>{`${p.code}: ${p.yieldPercent.toFixed(2)}% at ${p.years.toFixed(1)} years`}</title>
        </g>
      ))}
    </svg>
  )
}
