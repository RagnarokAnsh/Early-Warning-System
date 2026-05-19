import { useEffect, useState, useMemo, useCallback } from 'react'
import { fetchSurface } from '../lib/api'
import {
  Users,
  AlertTriangle,
  TrendingDown,
  Activity,
  Info,
} from 'lucide-react'

/* ── helpers ──────────────────────────────────────────────────────── */

function riskColor(p) {
  if (p >= 0.85) return '#ef4444'
  if (p >= 0.5)  return '#f97316'
  if (p >= 0.3)  return '#f59e0b'
  return '#22c55e'
}

function riskHSL(p) {
  // green 142 → yellow 48 → red 0
  const hue = (1 - p) * 142
  const sat = 75 + p * 15
  const light = 48 - p * 12
  return `hsl(${hue}, ${sat}%, ${light}%)`
}

/* ── Stat Card ────────────────────────────────────────────────────── */

function StatCard({ icon: Icon, label, value, sub, accent, delay }) {
  return (
    <div
      className="glass-card p-5 flex items-start gap-4 animate-fade-in"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div
        className="flex items-center justify-center w-11 h-11 rounded-xl"
        style={{ background: `${accent}18` }}
      >
        <Icon size={20} style={{ color: accent }} />
      </div>
      <div>
        <p className="text-xs font-medium text-slate-400 mb-0.5">{label}</p>
        <p className="text-2xl font-bold text-white leading-none">{value}</p>
        {sub && <p className="text-[11px] text-slate-500 mt-1">{sub}</p>}
      </div>
    </div>
  )
}

/* ── Skeleton ─────────────────────────────────────────────────────── */

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="skeleton h-24 rounded-2xl" />
        ))}
      </div>
      <div className="skeleton h-[500px] rounded-2xl" />
    </div>
  )
}

/* ── Heatmap Component ────────────────────────────────────────────── */

function Heatmap({ x, y, z }) {
  const [tooltip, setTooltip] = useState(null)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })

  // Use every 2nd point for performance (25x25 grid)
  const step = 2
  const displayX = useMemo(() => x.filter((_, i) => i % step === 0), [x])
  const displayY = useMemo(() => y.filter((_, i) => i % step === 0), [y])
  const displayZ = useMemo(
    () => z.filter((_, i) => i % step === 0).map((row) => row.filter((_, j) => j % step === 0)),
    [z]
  )

  const cellW = useMemo(() => Math.max(16, Math.floor(800 / displayX.length)), [displayX])
  const cellH = useMemo(() => Math.max(16, Math.floor(450 / displayY.length)), [displayY])

  const handleMouseMove = useCallback((e) => {
    setMousePos({ x: e.clientX, y: e.clientY })
  }, [])

  return (
    <div className="relative" onMouseMove={handleMouseMove}>
      {/* Legend */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Info size={14} className="text-slate-500" />
          <span className="text-xs text-slate-400">
            Hover cells to inspect dropout probability
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-slate-500 uppercase font-semibold">Low</span>
          <div className="flex h-3 rounded-sm overflow-hidden">
            {[0, 0.15, 0.3, 0.45, 0.6, 0.75, 0.9].map((v) => (
              <div key={v} className="w-6" style={{ background: riskHSL(v) }} />
            ))}
          </div>
          <span className="text-[10px] text-slate-500 uppercase font-semibold">High</span>
        </div>
      </div>

      {/* Axes labels */}
      <div className="flex">
        {/* Y-axis label */}
        <div className="flex items-center justify-center w-10">
          <span
            className="text-[11px] font-semibold text-slate-400 tracking-wider"
            style={{ writingMode: 'vertical-lr', transform: 'rotate(180deg)' }}
          >
            ATTENDANCE %
          </span>
        </div>

        <div className="flex-1">
          {/* Grid */}
          <div
            className="relative overflow-auto rounded-xl border border-slate-700/40"
            style={{ maxHeight: 500 }}
          >
            <div style={{ display: 'flex', flexDirection: 'column-reverse' }}>
              {displayY.map((yVal, yi) => (
                <div key={yi} style={{ display: 'flex' }}>
                  {displayX.map((xVal, xi) => {
                    const prob = displayZ[yi][xi]
                    return (
                      <div
                        key={xi}
                        className="heatmap-cell"
                        style={{
                          width: cellW,
                          height: cellH,
                          background: riskHSL(prob),
                          opacity: 0.85 + prob * 0.15,
                        }}
                        onMouseEnter={() =>
                          setTooltip({
                            learning: xVal.toFixed(1),
                            attendance: yVal.toFixed(1),
                            prob: prob,
                          })
                        }
                        onMouseLeave={() => setTooltip(null)}
                      />
                    )
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* X-axis label */}
          <div className="text-center mt-2">
            <span className="text-[11px] font-semibold text-slate-400 tracking-wider">
              LEARNING SCORE
            </span>
          </div>
        </div>
      </div>

      {/* Floating tooltip */}
      {tooltip && (
        <div
          className="fixed z-50 pointer-events-none px-3 py-2 rounded-lg bg-slate-800 border border-slate-600 shadow-xl text-xs"
          style={{ left: mousePos.x + 14, top: mousePos.y - 60 }}
        >
          <div className="flex items-center gap-2 mb-1">
            <div
              className="w-2.5 h-2.5 rounded-full"
              style={{ background: riskHSL(tooltip.prob) }}
            />
            <span className="font-semibold text-white">
              {(tooltip.prob * 100).toFixed(1)}% Risk
            </span>
          </div>
          <p className="text-slate-400">
            Learning: <span className="text-slate-200">{tooltip.learning}</span> &nbsp;|&nbsp;
            Attendance: <span className="text-slate-200">{tooltip.attendance}</span>
          </p>
        </div>
      )}
    </div>
  )
}

/* ── Main View ────────────────────────────────────────────────────── */

export default function DashboardView() {
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSurface()
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  /* Compute stats from the surface grid */
  const stats = useMemo(() => {
    if (!data) return null
    const flat = data.z.flat()
    const total = flat.length
    const critical = flat.filter((p) => p >= 0.85).length
    const high = flat.filter((p) => p >= 0.5).length
    const avg = flat.reduce((s, v) => s + v, 0) / total
    return { total, critical, high, avg }
  }, [data])

  if (loading) return <DashboardSkeleton />

  if (error) {
    return (
      <div className="glass-card p-8 text-center space-y-3">
        <AlertTriangle size={40} className="mx-auto text-amber-400" />
        <p className="text-white font-semibold">Unable to load surface data</p>
        <p className="text-sm text-slate-400">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* ── Summary Cards ──────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 stagger-children">
        <StatCard
          icon={Users}
          label="Grid Points Analyzed"
          value={stats.total.toLocaleString()}
          sub="50 × 50 prediction surface"
          accent="#6366f1"
          delay={0}
        />
        <StatCard
          icon={AlertTriangle}
          label="Critical Risk Zones"
          value={stats.critical.toLocaleString()}
          sub={`${((stats.critical / stats.total) * 100).toFixed(1)}% of surface`}
          accent="#ef4444"
          delay={60}
        />
        <StatCard
          icon={TrendingDown}
          label="High Risk Zones (≥50%)"
          value={stats.high.toLocaleString()}
          sub={`${((stats.high / stats.total) * 100).toFixed(1)}% of surface`}
          accent="#f97316"
          delay={120}
        />
        <StatCard
          icon={Activity}
          label="Average Risk Score"
          value={`${(stats.avg * 100).toFixed(1)}%`}
          sub="Across all grid points"
          accent={riskColor(stats.avg)}
          delay={180}
        />
      </div>

      {/* ── Heatmap ────────────────────────────────────── */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-base font-semibold text-white">Dropout Risk Surface</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Model-predicted dropout probability across the Learning × Attendance plane
            </p>
          </div>
        </div>
        <Heatmap x={data.x} y={data.y} z={data.z} />
      </div>
    </div>
  )
}
