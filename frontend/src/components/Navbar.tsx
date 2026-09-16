import { NavLink } from 'react-router-dom'
import { api } from '../lib/api'
import { useCurrency } from '../lib/currency'

const links = [
  { to: '/', label: 'لوحة التحكم' },
  { to: '/history', label: 'السجل' },
  { to: '/logs', label: 'قرارات البوت' },
  { to: '/settings', label: 'الإعدادات' },
]

export default function Navbar({ onLogout }: { onLogout: () => void }) {
  const { currency, toggle } = useCurrency()

  return (
    <nav className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 bg-slate-950/95 px-4 py-3 backdrop-blur">
      <div className="flex flex-wrap gap-1">
        {links.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            end={l.to === '/'}
            className={({ isActive }) =>
              `rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isActive ? 'bg-emerald-600 text-white' : 'text-slate-300 hover:bg-slate-800'
              }`
            }
          >
            {l.label}
          </NavLink>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={toggle}
          title="تبديل عملة العرض"
          className="rounded-lg border border-slate-700 px-3 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white"
        >
          {currency === 'USD' ? '$ USD' : 'ر.س SAR'}
        </button>
        <button
          onClick={async () => {
            await api.logout()
            onLogout()
          }}
          className="rounded-lg px-3 py-2 text-sm text-slate-400 hover:bg-slate-800 hover:text-white"
        >
          تسجيل خروج
        </button>
      </div>
    </nav>
  )
}
