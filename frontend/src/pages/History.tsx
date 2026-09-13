import { useCallback, useEffect, useState } from 'react'
import { api, type ReportPeriod, type ReportRow, type Trade } from '../lib/api'

function fmt(n: number, digits = 2) {
  return n.toLocaleString('en-US', { maximumFractionDigits: digits, minimumFractionDigits: digits })
}

const reasonLabel: Record<string, string> = {
  take_profit: 'جني ربح',
  take_profit_trailing: 'جني ربح مؤمَّن',
  stop_loss: 'وقف خسارة',
  manual: 'إغلاق يدوي',
  kill_switch: 'إيقاف طارئ',
}

const periods: { key: ReportPeriod; label: string }[] = [
  { key: 'daily', label: 'يومي' },
  { key: 'weekly', label: 'أسبوعي' },
  { key: 'monthly', label: 'شهري' },
  { key: 'quarterly', label: 'ربعي' },
  { key: 'yearly', label: 'سنوي' },
]

export default function History() {
  const [trades, setTrades] = useState<Trade[]>([])
  const [period, setPeriod] = useState<ReportPeriod>('daily')
  const [report, setReport] = useState<ReportRow[]>([])

  useEffect(() => {
    api.getTrades().then(setTrades).catch(() => {})
  }, [])

  const loadReport = useCallback((p: ReportPeriod) => {
    api.getReport(p).then(setReport).catch(() => setReport([]))
  }, [])

  useEffect(() => {
    loadReport(period)
  }, [period, loadReport])

  const totalPnl = trades.reduce((sum, t) => sum + t.pnl_quote, 0)
  const wins = trades.filter((t) => t.pnl_quote > 0).length

  return (
    <div className="mx-auto max-w-5xl space-y-4 p-4">
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
          <p className="text-xs text-slate-500">عدد الصفقات</p>
          <p className="mt-1 text-lg font-bold text-white">{trades.length}</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
          <p className="text-xs text-slate-500">نسبة الصفقات الرابحة</p>
          <p className="mt-1 text-lg font-bold text-white">
            {trades.length ? fmt((wins / trades.length) * 100, 1) : '0.0'}%
          </p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
          <p className="text-xs text-slate-500">إجمالي الربح/الخسارة</p>
          <p className={`mt-1 text-lg font-bold ${totalPnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            ${fmt(totalPnl)}
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-semibold text-white">تقرير الأرباح والخسائر</h2>
          <div className="flex flex-wrap gap-1">
            {periods.map((p) => (
              <button key={p.key} onClick={() => setPeriod(p.key)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium ${
                  period === p.key ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}>
                {p.label}
              </button>
            ))}
          </div>
        </div>
        {report.length === 0 ? (
          <p className="text-sm text-slate-500">لا توجد بيانات لهذه الفترة بعد.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[500px] text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-right text-slate-400">
                  <th className="py-2">الفترة</th>
                  <th>الصفقات</th>
                  <th>نسبة الربح</th>
                  <th>صافي الربح/الخسارة</th>
                  <th>متوسط العائد</th>
                </tr>
              </thead>
              <tbody>
                {report.map((r) => (
                  <tr key={r.period} className="border-b border-slate-800/50">
                    <td className="py-2 font-medium text-white">{r.period}</td>
                    <td className="text-slate-400">{r.trades} ({r.wins}✓/{r.losses}✗)</td>
                    <td className="text-slate-400">{fmt(r.win_rate, 1)}%</td>
                    <td className={r.pnl_quote >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                      ${fmt(r.pnl_quote)}
                    </td>
                    <td className={r.pnl_pct_avg >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                      {fmt(r.pnl_pct_avg)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
        <h2 className="mb-3 font-semibold text-white">سجل الصفقات المغلقة</h2>
        {trades.length === 0 ? (
          <p className="text-sm text-slate-500">لا يوجد صفقات مغلقة بعد.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-right text-slate-400">
                  <th className="py-2">الزوج</th>
                  <th>الدخول</th>
                  <th>الخروج</th>
                  <th>الربح/الخسارة</th>
                  <th>%</th>
                  <th>السبب</th>
                  <th>الوضع</th>
                  <th>وقت الخروج</th>
                </tr>
              </thead>
              <tbody>
                {trades.map((t) => (
                  <tr key={t.id} className="border-b border-slate-800/50">
                    <td className="py-2 font-medium text-white">{t.symbol}</td>
                    <td>{fmt(t.entry_price, 4)}</td>
                    <td>{fmt(t.exit_price, 4)}</td>
                    <td className={t.pnl_quote >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                      ${fmt(t.pnl_quote)}
                    </td>
                    <td className={t.pnl_pct >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                      {fmt(t.pnl_pct)}%
                    </td>
                    <td className="text-slate-400">{reasonLabel[t.exit_reason] ?? t.exit_reason}</td>
                    <td className="text-slate-400">{t.mode === 'live' ? 'حقيقي' : 'محاكاة'}</td>
                    <td className="text-slate-500">{new Date(t.exit_time).toLocaleString('ar-EG')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
