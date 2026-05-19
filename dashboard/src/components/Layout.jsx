import { useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  FileSpreadsheet,
  UserSearch,
  ShieldAlert,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react'

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Risk Overview', icon: LayoutDashboard, description: 'State-wide heatmap' },
  { to: '/bulk', label: 'Bulk Processing', icon: FileSpreadsheet, description: 'Upload & analyze rosters' },
  { to: '/profile', label: 'Student Profile', icon: UserSearch, description: 'Individual assessment' },
]

const SIDEBAR_OPEN = 260
const SIDEBAR_CLOSED = 72

function SidebarLink({ to, label, icon: Icon, description, collapsed }) {
  return (
    <NavLink
      to={to}
      title={collapsed ? label : undefined}
      className={({ isActive }) =>
        `sidebar-link group flex items-center gap-3 rounded-xl transition-all duration-200 ${
          collapsed ? 'justify-center px-2 py-3' : 'px-4 py-3'
        } ${
          isActive
            ? 'bg-indigo-500/15 text-indigo-400 shadow-sm shadow-indigo-500/10'
            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
        }`
      }
    >
      {({ isActive }) => (
        <>
          <div
            className={`flex items-center justify-center rounded-lg transition-colors ${
              collapsed ? 'w-10 h-10' : 'w-9 h-9'
            } ${isActive ? 'bg-indigo-500/20' : 'bg-slate-800 group-hover:bg-slate-700'}`}
          >
            <Icon size={18} />
          </div>
          {!collapsed && (
            <>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium leading-tight">{label}</div>
                <div style={{ fontSize: 11 }} className="text-slate-500 truncate">{description}</div>
              </div>
              {isActive && <ChevronRight size={14} className="text-indigo-400 opacity-60" />}
            </>
          )}
        </>
      )}
    </NavLink>
  )
}

export default function Layout() {
  const location = useLocation()
  const [collapsed, setCollapsed] = useState(false)
  const pageTitle = NAV_ITEMS.find((n) => n.to === location.pathname)?.label || 'Dashboard'
  const sidebarW = collapsed ? SIDEBAR_CLOSED : SIDEBAR_OPEN

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* ── Sidebar ────────────────────────────────────────── */}
      <aside
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          bottom: 0,
          width: sidebarW,
          transition: 'width 0.25s cubic-bezier(0.4,0,0.2,1)',
          zIndex: 30,
        }}
        className="bg-slate-900/80 backdrop-blur-xl border-r border-slate-800/60 flex flex-col"
      >
        {/* Logo */}
        <div
          className="flex items-center border-b border-slate-800/60"
          style={{ height: 72, padding: collapsed ? '0 12px' : '0 20px', gap: 12, justifyContent: collapsed ? 'center' : 'flex-start' }}
        >
          <div className="relative flex-shrink-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
              <ShieldAlert size={20} className="text-white" />
            </div>
            <div
              className="absolute bg-emerald-400 rounded-full border-2 border-slate-900"
              style={{ bottom: -2, right: -2, width: 12, height: 12 }}
            />
          </div>
          {!collapsed && (
            <div style={{ overflow: 'hidden', whiteSpace: 'nowrap' }}>
              <h1 className="text-sm font-bold text-white tracking-tight">Student EWS</h1>
              <p style={{ fontSize: 10 }} className="text-slate-500 font-medium tracking-widest uppercase">Early Warning System</p>
            </div>
          )}
        </div>

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="flex items-center justify-center mx-auto my-2 w-8 h-8 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
        </button>

        {/* Navigation */}
        <nav className="flex-1 py-2 space-y-1" style={{ padding: collapsed ? '8px 8px' : '8px 12px' }}>
          {!collapsed && (
            <p style={{ fontSize: 10, padding: '0 16px', marginBottom: 8 }} className="font-semibold text-slate-500 tracking-widest uppercase">
              Navigation
            </p>
          )}
          {NAV_ITEMS.map((item) => (
            <SidebarLink key={item.to} {...item} collapsed={collapsed} />
          ))}
        </nav>

        {/* Sidebar footer */}
        <div className="border-t border-slate-800/60" style={{ padding: collapsed ? '16px 8px' : '16px' }}>
          <div
            className="flex items-center"
            style={{ gap: 12, padding: collapsed ? '0' : '0 8px', justifyContent: collapsed ? 'center' : 'flex-start' }}
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center text-xs font-bold text-slate-300 flex-shrink-0">
              A
            </div>
            {!collapsed && (
              <div>
                <p className="text-xs font-medium text-slate-300">Admin</p>
                <p style={{ fontSize: 10 }} className="text-slate-500">State Coordinator</p>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* ── Main Content ───────────────────────────────────── */}
      <main
        style={{
          marginLeft: sidebarW,
          flex: 1,
          minHeight: '100vh',
          transition: 'margin-left 0.25s cubic-bezier(0.4,0,0.2,1)',
        }}
      >
        {/* Top bar */}
        <header
          className="sticky top-0 border-b border-slate-800/40 bg-slate-950/60 backdrop-blur-xl flex items-center"
          style={{ height: 72, padding: '0 32px', zIndex: 20 }}
        >
          <div>
            <h2 className="text-lg font-semibold text-white">{pageTitle}</h2>
            <p className="text-xs text-slate-500">Student Early Warning System — Real-time Analytics</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-medium" style={{ padding: '4px 12px' }}>
              <span className="rounded-full bg-emerald-400 animate-pulse" style={{ width: 6, height: 6 }} />
              Backend Online
            </span>
          </div>
        </header>

        {/* Page content */}
        <div className="animate-fade-in" style={{ padding: 32 }} key={location.pathname}>
          <Outlet />
        </div>
      </main>
    </div>
  )
}
