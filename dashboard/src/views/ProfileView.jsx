import { useState } from 'react'
import { predictSingle } from '../lib/api'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'
import {
  UserSearch,
  Send,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Loader2,
  GraduationCap,
  CalendarDays,
  BookOpen,
  Hash,
  TrendingUp,
  TrendingDown,
  RotateCcw,
} from 'lucide-react'

/* ── helpers ──────────────────────────────────────────────────────── */

const RISK_CONFIG = {
  low:      { color: '#22c55e', bg: 'rgba(34,197,94,0.10)', icon: ShieldCheck,  label: 'Low Risk' },
  medium:   { color: '#f59e0b', bg: 'rgba(245,158,11,0.10)', icon: AlertTriangle, label: 'Medium Risk' },
  high:     { color: '#f97316', bg: 'rgba(249,115,22,0.10)', icon: AlertTriangle, label: 'High Risk' },
  critical: { color: '#ef4444', bg: 'rgba(239,68,68,0.10)', icon: ShieldAlert,   label: 'Critical Risk' },
}

function featureLabel(name) {
  const map = {
    learning_score: 'Learning Score',
    attendance: 'Attendance Rate',
    attendance_score_interaction: 'Attendance × Score',
    consecutive_absences: 'Consecutive Absences',
  }
  return map[name] || name
}

/* ── SHAP Bar Chart ───────────────────────────────────────────────── */

function DriversChart({ drivers }) {
  const data = drivers.map((d) => ({
    name: featureLabel(d.feature),
    value: d.impact,
  }))

  return (
    <div>
      <div className="flex items-center gap-4 mb-3 text-[11px]">
        <span className="flex items-center gap-1 text-red-400">
          <TrendingUp size={12} /> Increases risk
        </span>
        <span className="flex items-center gap-1 text-emerald-400">
          <TrendingDown size={12} /> Protective factor
        </span>
      </div>
      <ResponsiveContainer width="100%" height={Math.max(120, data.length * 52)}>
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 24, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
          <XAxis
            type="number"
            tick={{ fontSize: 11, fill: '#94a3b8' }}
            tickLine={false}
            axisLine={{ stroke: '#475569' }}
          />
          <YAxis
            type="category"
            dataKey="name"
            width={150}
            tick={{ fontSize: 12, fill: '#cbd5e1', fontWeight: 500 }}
            tickLine={false}
            axisLine={false}
          />
          <ReferenceLine x={0} stroke="#475569" strokeWidth={1} />
          <Tooltip
            contentStyle={{
              background: '#1e293b',
              border: '1px solid #334155',
              borderRadius: 8,
              fontSize: 12,
              color: '#f1f5f9',
            }}
            formatter={(val) => [`${val > 0 ? '+' : ''}${val.toFixed(4)}`, 'SHAP Impact']}
          />
          <Bar dataKey="value" radius={[4, 4, 4, 4]} barSize={24}>
            {data.map((entry, i) => (
              <Cell
                key={i}
                fill={entry.value >= 0 ? '#ef4444' : '#22c55e'}
                fillOpacity={0.85}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

/* ── Main View ────────────────────────────────────────────────────── */

export default function ProfileView() {
  const [form, setForm] = useState({
    learning_score: '',
    attendance: '',
    consecutive_absences: '',
  })
  const [threshold, setThreshold] = useState(0.5)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  function onChange(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const payload = {
        learning_score: parseFloat(form.learning_score),
        attendance: parseFloat(form.attendance),
        consecutive_absences: parseInt(form.consecutive_absences || '0', 10),
        threshold,
      }
      const data = await predictSingle(payload)
      setResult(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  function reset() {
    setForm({ learning_score: '', attendance: '', consecutive_absences: '' })
    setResult(null)
    setError(null)
  }

  const riskConf = result ? RISK_CONFIG[result.risk] || RISK_CONFIG.low : null

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      {/* ── Left: Input Form ───────────────────────────── */}
      <div className="lg:col-span-2 space-y-5">
        <div className="glass-card p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/15 flex items-center justify-center">
              <UserSearch size={20} className="text-indigo-400" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Student Assessment</h3>
              <p className="text-xs text-slate-400">Enter student metrics for risk prediction</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Learning Score */}
            <div>
              <label className="flex items-center gap-1.5 text-xs font-medium text-slate-400 mb-1.5">
                <BookOpen size={13} /> Learning Score
              </label>
              <input
                type="number"
                name="learning_score"
                value={form.learning_score}
                onChange={onChange}
                required
                min="0"
                max="100"
                step="0.1"
                placeholder="0 — 100"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/20 transition-all"
                id="input-learning-score"
              />
            </div>

            {/* Attendance */}
            <div>
              <label className="flex items-center gap-1.5 text-xs font-medium text-slate-400 mb-1.5">
                <CalendarDays size={13} /> Attendance Rate (%)
              </label>
              <input
                type="number"
                name="attendance"
                value={form.attendance}
                onChange={onChange}
                required
                min="0"
                max="100"
                step="0.1"
                placeholder="0 — 100"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/20 transition-all"
                id="input-attendance"
              />
            </div>

            {/* Consecutive Absences */}
            <div>
              <label className="flex items-center gap-1.5 text-xs font-medium text-slate-400 mb-1.5">
                <Hash size={13} /> Consecutive Absences (days)
              </label>
              <input
                type="number"
                name="consecutive_absences"
                value={form.consecutive_absences}
                onChange={onChange}
                min="0"
                step="1"
                placeholder="0"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/20 transition-all"
                id="input-absences"
              />
            </div>

            {/* Threshold */}
            <div>
              <label className="flex items-center justify-between text-xs font-medium text-slate-400 mb-1.5">
                <span>Decision Threshold</span>
                <span className="text-indigo-400 font-semibold">{threshold.toFixed(2)}</span>
              </label>
              <input
                type="range"
                min="0.1"
                max="0.9"
                step="0.05"
                value={threshold}
                onChange={(e) => setThreshold(parseFloat(e.target.value))}
                className="w-full h-1.5 rounded-full accent-indigo-500 bg-slate-700 appearance-none cursor-pointer"
              />
            </div>

            {/* Buttons */}
            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                disabled={loading || !form.learning_score || !form.attendance}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold transition-all shadow-lg shadow-indigo-600/20"
                id="btn-predict"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={15} />}
                {loading ? 'Analyzing…' : 'Predict Risk'}
              </button>
              <button
                type="button"
                onClick={reset}
                className="px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 transition-colors"
                title="Reset"
              >
                <RotateCcw size={16} />
              </button>
            </div>
          </form>

          {error && (
            <div className="mt-4 flex items-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400">
              <AlertTriangle size={16} />
              {error}
            </div>
          )}
        </div>

        {/* Quick-fill presets */}
        <div className="glass-card p-4">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-3">
            Quick Presets
          </p>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'High Achiever', ls: 85, att: 95, abs: 0 },
              { label: 'At-Risk Student', ls: 35, att: 55, abs: 8 },
              { label: 'Chronic Absentee', ls: 50, att: 20, abs: 35 },
              { label: 'Average Student', ls: 60, att: 75, abs: 2 },
            ].map((p) => (
              <button
                key={p.label}
                onClick={() => {
                  setForm({
                    learning_score: String(p.ls),
                    attendance: String(p.att),
                    consecutive_absences: String(p.abs),
                  })
                  setResult(null)
                }}
                className="text-left px-3 py-2 rounded-lg bg-slate-800/50 hover:bg-slate-700/60 border border-slate-700/40 transition-colors"
              >
                <span className="text-xs font-medium text-slate-300">{p.label}</span>
                <span className="block text-[10px] text-slate-500 mt-0.5">
                  LS {p.ls} · Att {p.att}% · Abs {p.abs}d
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right: Result Card ─────────────────────────── */}
      <div className="lg:col-span-3">
        {!result && !loading && (
          <div className="glass-card h-full flex flex-col items-center justify-center text-center p-12">
            <div className="w-20 h-20 rounded-2xl bg-slate-800 flex items-center justify-center mb-5">
              <GraduationCap size={36} className="text-slate-600" />
            </div>
            <p className="text-base font-semibold text-slate-400">No Prediction Yet</p>
            <p className="text-sm text-slate-500 mt-1 max-w-xs">
              Enter a student's metrics on the left and click <strong>Predict Risk</strong> to generate
              a risk profile with explainability.
            </p>
          </div>
        )}

        {loading && (
          <div className="glass-card h-full flex items-center justify-center p-12">
            <div className="flex flex-col items-center gap-3">
              <Loader2 size={40} className="text-indigo-400 animate-spin" />
              <p className="text-sm text-slate-300 font-medium">Running prediction model…</p>
            </div>
          </div>
        )}

        {result && riskConf && (
          <div className="space-y-5 animate-fade-in">
            {/* Risk profile header */}
            <div
              className="glass-card p-6"
              style={{ borderColor: `${riskConf.color}30` }}
            >
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center"
                    style={{ background: riskConf.bg }}
                  >
                    <riskConf.icon size={28} style={{ color: riskConf.color }} />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-400 mb-0.5">Risk Assessment</p>
                    <h3 className="text-xl font-bold text-white">{riskConf.label}</h3>
                  </div>
                </div>
                <span className={`risk-badge ${result.risk}`} style={{ fontSize: '0.75rem', padding: '4px 14px' }}>
                  {result.risk}
                </span>
              </div>

              {/* Probability gauge */}
              <div className="mb-2">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-slate-400">Dropout Probability</span>
                  <span className="font-bold text-lg" style={{ color: riskConf.color }}>
                    {(result.probability * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="h-3 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700 ease-out"
                    style={{
                      width: `${result.probability * 100}%`,
                      background: `linear-gradient(90deg, ${riskConf.color}99, ${riskConf.color})`,
                    }}
                  />
                </div>
              </div>

              {/* Prediction label */}
              <div className="flex items-center gap-3 mt-4 pt-4 border-t border-slate-700/50">
                <span className="text-xs text-slate-400">Model Prediction:</span>
                <span
                  className="text-sm font-bold"
                  style={{ color: result.prediction === 'Dropout' ? '#f87171' : '#4ade80' }}
                >
                  {result.prediction}
                </span>
                {result.reason && (
                  <span className="text-xs text-amber-400/80 ml-auto">⚠ {result.reason}</span>
                )}
              </div>
            </div>

            {/* SHAP Drivers */}
            {result.top_drivers && result.top_drivers.length > 0 && (
              <div className="glass-card p-6">
                <h4 className="text-sm font-semibold text-white mb-1">Risk Drivers (SHAP Explainability)</h4>
                <p className="text-xs text-slate-400 mb-4">
                  What factors are pushing this student's risk up or down?
                </p>
                <DriversChart drivers={result.top_drivers} />
              </div>
            )}

            {/* Input summary */}
            <div className="glass-card p-5">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                Input Summary
              </p>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-lg font-bold text-white">{form.learning_score}</p>
                  <p className="text-[11px] text-slate-400">Learning Score</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-white">{form.attendance}%</p>
                  <p className="text-[11px] text-slate-400">Attendance</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-white">{form.consecutive_absences || 0}</p>
                  <p className="text-[11px] text-slate-400">Consecutive Absences</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
