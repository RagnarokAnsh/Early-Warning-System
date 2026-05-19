import { useState, useMemo, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { bulkUpload } from '../lib/api'
import {
  Upload,
  FileSpreadsheet,
  AlertTriangle,
  Users,
  ShieldAlert,
  TrendingDown,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Search,
  X,
  Loader2,
  CheckCircle2,
} from 'lucide-react'

/* ── Risk badge ───────────────────────────────────────────────────── */

function RiskBadge({ level }) {
  const l = (level || '').toLowerCase()
  return <span className={`risk-badge ${l}`}>{level}</span>
}

/* ── Stat Card ────────────────────────────────────────────────────── */

function MiniStat({ icon: Icon, label, value, accent }) {
  return (
    <div className="glass-card p-4 flex items-center gap-3">
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center"
        style={{ background: `${accent}18` }}
      >
        <Icon size={18} style={{ color: accent }} />
      </div>
      <div>
        <p className="text-[11px] font-medium text-slate-400">{label}</p>
        <p className="text-xl font-bold text-white">{value}</p>
      </div>
    </div>
  )
}

/* ── Main View ────────────────────────────────────────────────────── */

export default function BulkView() {
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [fileName, setFileName] = useState(null)
  const [threshold, setThreshold] = useState(0.5)

  /* Sorting */
  const [sortKey, setSortKey] = useState('dropout_probability')
  const [sortDir, setSortDir] = useState('desc')

  /* Search filter */
  const [search, setSearch] = useState('')

  /* Pagination */
  const [page, setPage] = useState(1)
  const perPage = 15

  const onDrop = useCallback(
    (accepted) => {
      if (!accepted.length) return
      const file = accepted[0]
      setFileName(file.name)
      setError(null)
      setLoading(true)
      setResult(null)
      setPage(1)

      bulkUpload(file, threshold)
        .then(setResult)
        .catch((e) => setError(e.message))
        .finally(() => setLoading(false))
    },
    [threshold]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
    },
    multiple: false,
  })

  /* Sort and filter logic */
  const processedRows = useMemo(() => {
    if (!result?.rows) return []
    let rows = [...result.rows]

    if (search.trim()) {
      const q = search.toLowerCase()
      rows = rows.filter((r) =>
        Object.values(r).some((v) => String(v).toLowerCase().includes(q))
      )
    }

    rows.sort((a, b) => {
      const av = a[sortKey] ?? ''
      const bv = b[sortKey] ?? ''
      const cmp = typeof av === 'number' ? av - bv : String(av).localeCompare(String(bv))
      return sortDir === 'asc' ? cmp : -cmp
    })

    return rows
  }, [result, sortKey, sortDir, search])

  const totalPages = Math.max(1, Math.ceil(processedRows.length / perPage))
  const pageRows = processedRows.slice((page - 1) * perPage, page * perPage)

  const columns = useMemo(() => {
    if (!result?.rows?.length) return []
    return Object.keys(result.rows[0])
  }, [result])

  function handleSort(key) {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('desc')
    }
  }

  function SortIcon({ col }) {
    if (sortKey !== col) return <ArrowUpDown size={12} className="text-slate-600" />
    return sortDir === 'asc' ? (
      <ArrowUp size={12} className="text-indigo-400" />
    ) : (
      <ArrowDown size={12} className="text-indigo-400" />
    )
  }

  return (
    <div className="space-y-6">
      {/* ── Upload zone ────────────────────────────────── */}
      <div className="glass-card p-6">
        <h3 className="text-base font-semibold text-white mb-1">Upload Student Roster</h3>
        <p className="text-xs text-slate-400 mb-5">
          Drop a CSV or Excel file with <code className="text-indigo-400">learning_score</code> and{' '}
          <code className="text-indigo-400">attendance</code> columns
        </p>

        {/* Threshold slider */}
        <div className="flex items-center gap-4 mb-5">
          <label className="text-xs font-medium text-slate-400">Decision Threshold:</label>
          <input
            type="range"
            min="0.1"
            max="0.9"
            step="0.05"
            value={threshold}
            onChange={(e) => setThreshold(parseFloat(e.target.value))}
            className="w-40 h-1.5 rounded-full accent-indigo-500 bg-slate-700 appearance-none cursor-pointer"
          />
          <span className="text-sm font-semibold text-indigo-400 w-12 text-right">
            {threshold.toFixed(2)}
          </span>
        </div>

        <div
          {...getRootProps()}
          className={`dropzone ${isDragActive ? 'active' : ''}`}
          id="bulk-dropzone"
        >
          <input {...getInputProps()} />
          {loading ? (
            <div className="flex flex-col items-center gap-3">
              <Loader2 size={36} className="text-indigo-400 animate-spin" />
              <p className="text-sm text-slate-300 font-medium">Processing {fileName}…</p>
            </div>
          ) : fileName && result ? (
            <div className="flex flex-col items-center gap-3">
              <CheckCircle2 size={36} className="text-emerald-400" />
              <p className="text-sm text-slate-300 font-medium">
                <span className="text-emerald-400">{fileName}</span> processed successfully
              </p>
              <p className="text-xs text-slate-500">Drop another file to re-analyze</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-slate-800 flex items-center justify-center">
                <Upload size={24} className="text-slate-400" />
              </div>
              <p className="text-sm text-slate-300 font-medium">
                {isDragActive ? 'Drop file here…' : 'Drag & drop your roster file here'}
              </p>
              <p className="text-xs text-slate-500">Supports CSV, XLS, XLSX</p>
            </div>
          )}
        </div>

        {error && (
          <div className="mt-4 flex items-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400">
            <AlertTriangle size={16} />
            {error}
          </div>
        )}
      </div>

      {/* ── Summary stats ──────────────────────────────── */}
      {result && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 stagger-children">
          <MiniStat icon={Users} label="Total Students" value={result.total} accent="#6366f1" />
          <MiniStat
            icon={TrendingDown}
            label="Predicted Dropouts"
            value={result.dropouts}
            accent="#f97316"
          />
          <MiniStat
            icon={ShieldAlert}
            label="Critical Cases"
            value={result.critical_cases}
            accent="#ef4444"
          />
        </div>
      )}

      {/* ── Results Table ──────────────────────────────── */}
      {result && (
        <div className="glass-card overflow-hidden">
          {/* Table toolbar */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-slate-700/40">
            <div className="flex items-center gap-2">
              <FileSpreadsheet size={16} className="text-indigo-400" />
              <span className="text-sm font-semibold text-white">
                Results — {processedRows.length} students
              </span>
            </div>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setPage(1)
                }}
                placeholder="Search…"
                className="pl-8 pr-8 py-1.5 text-xs rounded-lg bg-slate-800 border border-slate-700 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 w-52"
                id="bulk-search"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          </div>

          {/* Scrollable table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-800/50">
                  {columns.map((col) => (
                    <th
                      key={col}
                      className="px-4 py-3 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider cursor-pointer hover:text-slate-200 transition-colors select-none whitespace-nowrap"
                      onClick={() => handleSort(col)}
                    >
                      <span className="inline-flex items-center gap-1">
                        {col.replace(/_/g, ' ')}
                        <SortIcon col={col} />
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {pageRows.map((row, ri) => (
                  <tr
                    key={ri}
                    className="hover:bg-slate-800/30 transition-colors"
                  >
                    {columns.map((col) => (
                      <td key={col} className="px-4 py-2.5 text-slate-300 whitespace-nowrap">
                        {col === 'risk_level' ? (
                          <RiskBadge level={row[col]} />
                        ) : col === 'dropout_probability' ? (
                          <span
                            className="font-semibold"
                            style={{
                              color:
                                row[col] >= 0.85
                                  ? '#f87171'
                                  : row[col] >= 0.5
                                  ? '#fb923c'
                                  : row[col] >= 0.3
                                  ? '#fbbf24'
                                  : '#4ade80',
                            }}
                          >
                            {(row[col] * 100).toFixed(1)}%
                          </span>
                        ) : (
                          <span className="text-xs">{String(row[col] ?? '—')}</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-3 border-t border-slate-700/40">
              <span className="text-xs text-slate-500">
                Page {page} of {totalPages}
              </span>
              <div className="flex gap-1">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="px-3 py-1 text-xs rounded-md bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  Prev
                </button>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="px-3 py-1 text-xs rounded-md bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
